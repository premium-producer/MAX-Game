import {randomUUID} from 'node:crypto';

export const MAX_API_PREFIX = '/api/max-game/v1';
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
const fail = code => Object.assign(new Error(code), {code});
const statusFor = code => /NOT_FOUND/.test(code) ? 404 : /CONFLICT|BUSY|REUSED|EXPIRED|SESSION_EXISTS/.test(code) ? 409 : /OWNER_REQUIRED|FORBIDDEN/.test(code) ? 403 : /INVALID|UNSUPPORTED|UNAVAILABLE_ACTION/.test(code) ? 400 : /CLOSED|STORAGE|CONTENT_UNAVAILABLE/.test(code) ? 503 : 400;
const json = (res, status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'}); res.end(JSON.stringify(body)); };

async function readBody(req, limit) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) throw fail('INVALID_CONTENT_TYPE');
  let size = 0; const chunks=[];
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw fail('INVALID_BODY_SIZE'); chunks.push(chunk); }
  const body=Buffer.concat(chunks).toString('utf8');
  try { const value = JSON.parse(body); if (!value || typeof value !== 'object' || Array.isArray(value)) throw 0; return value; }
  catch { throw fail('INVALID_JSON'); }
}

/** HTTP transport only. Application owns rules; leases/ordered contacts are transient. */
export function createMaxGameApi({application, catalog, authorize = () => false, authorizeControl = () => false, now = Date.now, leaseMs = 15000, bodyLimit = 65536}) {
  if (!application || ['createSession','getSnapshot','sendCommand','subscribe','close'].some(key => typeof application[key] !== 'function')) throw new TypeError('SessionPort required');
  if (!catalog || typeof authorize !== 'function' || typeof authorizeControl !== 'function' || typeof now !== 'function' || !Number.isSafeInteger(leaseMs) || leaseMs < 1000) throw new TypeError('Invalid API options');
  const catalogJson = JSON.stringify(catalog), owners = new Map(), generations = new Map(), queues = new Map(), streams = new Set();
  let closed = false, sweeping = false, lastHeartbeat = 0;
  function serial(id, operation) {
    if (closed) return Promise.reject(fail('API_CLOSED'));
    const previous = queues.get(id) ?? Promise.resolve();
    const result = previous.catch(() => {}).then(() => { if (closed) throw fail('API_CLOSED'); return operation(); });
    const tail = result.catch(() => {}); queues.set(id, tail);
    tail.then(() => { if (queues.get(id) === tail) queues.delete(id); });
    return result;
  }
  async function deactivate(id) {
    if (application.inputOwnerChanged) await application.inputOwnerChanged(id, {active:false}, now());
    owners.delete(id);
  }
  async function expire(id) { const lease = owners.get(id); if (lease && now() >= lease.expiresAt) await deactivate(id); }
  async function requireOwner(id, supplied) {
    await expire(id);
    const lease = owners.get(id);
    if (!lease || !supplied || supplied.ownerId !== lease.ownerId || supplied.generation !== lease.generation || supplied.token !== lease.token) throw fail('OWNER_REQUIRED');
    return lease;
  }
  const leaseView = lease => ({ownerId:lease.ownerId, generation:lease.generation, token:lease.token, expiresAt:lease.expiresAt, serverTime:now()});
  async function inputOwner(id, body) {
    await application.getSnapshot(id); await expire(id);
    if (body.action === 'acquire') {
      if (!validId(body.ownerId) || !validId(body.acquisitionId)) throw fail('INVALID_OWNER');
      const current = owners.get(id);
      if (current) {
        if (current.ownerId === body.ownerId && current.acquisitionId === body.acquisitionId) return leaseView(current);
        throw fail('OWNER_BUSY');
      }
      const generation = (generations.get(id) ?? 0) + 1;
      const lease = {ownerId:body.ownerId, acquisitionId:body.acquisitionId, generation, token:randomUUID(), expiresAt:now() + leaseMs, sequences:new Map()};
      // Resume is committed before an owner can send input.
      if (application.inputOwnerChanged) await application.inputOwnerChanged(id, {active:true}, now());
      generations.set(id, generation); owners.set(id, lease); return leaseView(lease);
    }
    const lease = await requireOwner(id, body.owner);
    if (body.action === 'renew') { lease.expiresAt = now() + leaseMs; return leaseView(lease); }
    if (body.action === 'release') { await deactivate(id); return {released:true}; }
    throw fail('INVALID_OWNER_ACTION');
  }
  async function contact(id, body) {
    const lease = await requireOwner(id, body.owner), event = body.event;
    if (!event || Object.keys(event).some(key => !['contactId','sequence','type','inside'].includes(key)) || !validId(event.contactId) || !Number.isSafeInteger(event.sequence) || event.sequence < 0 || !['down','move','up','cancel'].includes(event.type) || typeof event.inside !== 'boolean') throw fail('INVALID_CONTACT');
    const last = lease.sequences.get(event.contactId) ?? -1;
    if (event.sequence <= last) throw fail('CONTACT_SEQUENCE_CONFLICT');
    if (!application.handleContact) throw fail('UNSUPPORTED_CONTACT');
    if (!lease.sequences.has(event.contactId) && lease.sequences.size >= 128) throw fail('INVALID_CONTACT_LIMIT');
    const result = await application.handleContact(id, event, now());
    lease.sequences.set(event.contactId, event.sequence);
    return result;
  }
  async function eventStream(req, res, id) {
    if (streams.size >= 32) throw fail('INVALID_STREAM_LIMIT');
    let unsubscribe, disconnected = false, sequence = 0;
    const stream = {res, disconnect};
    function disconnect() { if (disconnected) return; disconnected = true; unsubscribe?.(); streams.delete(stream); }
    req.once('close', disconnect); res.once('close', disconnect);
    // Subscribe first: a missing session must return JSON 404, not an empty SSE.
    unsubscribe = await application.subscribe(id, event => {
      if (disconnected || res.destroyed) return;
      if (!res.headersSent) res.writeHead(200, {'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','X-Accel-Buffering':'no'});
      if (res.writableLength > 1024 * 1024) { disconnect(); res.destroy(); return; }
      res.write(`id: ${++sequence}\nevent: state\ndata: ${JSON.stringify(event)}\n\n`);
    });
    if (disconnected || closed) { unsubscribe(); res.end(); return; }
    streams.add(stream);
  }
  const api = {
    async handle(req, res, url) {
      const pathname = url.pathname;
      if (pathname !== MAX_API_PREFIX && !pathname.startsWith(MAX_API_PREFIX + '/')) return false;
      try {
        if (closed) throw fail('API_CLOSED');
        if (req.method === 'GET' && pathname === MAX_API_PREFIX + '/catalog') { res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(catalogJson); return true; }
        const control = pathname.match(/^\/api\/max-game\/v1\/(assignments|slots)(?:\/([^/]+))?$/);
        if (control) {
          if (!await authorizeControl(req)) throw fail('FORBIDDEN');
          const [,kind,id] = control;
          let result;
          if (kind === 'assignments' && !id && req.method === 'POST') {
            const body = await readBody(req, bodyLimit);
            if (typeof application.assignMission !== 'function') throw fail('ASSIGNMENT_STORAGE_UNAVAILABLE');
            result = await serial('control.assignments', () => application.assignMission(body));
            json(res, result.duplicate ? 200 : 201, result); return true;
          }
          if (kind === 'assignments' && id && req.method === 'GET') {
            if (typeof application.getAssignment !== 'function') throw fail('ASSIGNMENT_STORAGE_UNAVAILABLE');
            result = await serial('control.assignments', () => application.getAssignment(id));
          } else if (kind === 'slots' && id && req.method === 'GET') {
            if (typeof application.getSlot !== 'function') throw fail('ASSIGNMENT_STORAGE_UNAVAILABLE');
            result = await serial('control.slots', () => application.getSlot(id));
          } else throw fail('UNSUPPORTED_ROUTE');
          json(res, 200, result); return true;
        }
        if (req.method !== 'GET' && !await authorize(req)) throw fail('FORBIDDEN');
        if (req.method === 'POST' && pathname === MAX_API_PREFIX + '/sessions') {
          const body = await readBody(req, bodyLimit);
          if (!validId(body.sessionId)) throw fail('INVALID_SESSION_ID');
          const snapshot = await serial(body.sessionId, () => application.createSession(body));
          json(res, 201, snapshot); return true;
        }
        const match = pathname.match(/^\/api\/max-game\/v1\/sessions\/([^/]+)(?:\/(commands|events|input-owner|contacts|layouts\/([^/]+)))?$/);
        if (!match || !validId(match[1])) throw fail('SESSION_NOT_FOUND');
        const [,id,route,layoutId] = match;
        if (req.method === 'GET' && route === 'events') { await eventStream(req, res, id); return true; }
        if (req.method === 'GET' && !route) {
          const snapshot = await serial(id, async () => { await expire(id); return application.getSnapshot(id); });
          json(res, 200, snapshot); return true;
        }
        const body = await readBody(req, bodyLimit);
        const result = await serial(id, async () => {
          if (req.method === 'POST' && route === 'input-owner') return inputOwner(id, body);
          if (req.method === 'POST' && route === 'contacts') return contact(id, body);
          if (req.method === 'POST' && route === 'commands') {
            await requireOwner(id, body.owner);
            if (body.command?.sessionId !== id) throw fail('INVALID_COMMAND_CONTEXT');
            return application.sendCommand(body.command);
          }
          if (req.method === 'PUT' && layoutId && validId(layoutId)) {
            await requireOwner(id, body.owner);
            if (body.command?.sessionId !== id || body.command?.type !== 'SET_LAYOUT' || body.command?.layoutId !== layoutId) throw fail('INVALID_LAYOUT_CONTEXT');
            return application.sendCommand(body.command);
          }
          throw fail('UNSUPPORTED_ROUTE');
        });
        json(res, result?.reply?.ok === false ? statusFor(result.reply.code) : 200, result);
      } catch (cause) {
        if (res.headersSent) res.destroy();
        else json(res, statusFor(cause.code ?? 'STORAGE_UNAVAILABLE'), {error:{code:cause.code ?? 'STORAGE_UNAVAILABLE'}});
      }
      return true;
    },
    async sweep() {
      if (closed || sweeping) return;
      sweeping=true;
      try {
        await Promise.all([...owners.keys()].map(id => serial(id, async () => { await expire(id); if (owners.has(id) && application.pollTime) await application.pollTime(id); })));
        if(now()-lastHeartbeat>=2000) {
          lastHeartbeat=now();
          for (const stream of [...streams]) if (!stream.res.destroyed) {
            if(stream.res.writableLength>1024*1024){stream.disconnect();stream.res.destroy();}
            else stream.res.write(': heartbeat\n\n');
          }
        }
      }finally{sweeping=false;}
    },
    async close() {
      if (closed) return;
      closed = true;
      for (const stream of [...streams]) { stream.disconnect(); stream.res.end(); }
      await Promise.allSettled([...queues.values()]);
      try { for (const id of [...owners.keys()]) await deactivate(id); }
      finally { await application.close(); }
    },
  };
  return Object.freeze(api);
}
