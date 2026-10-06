import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadConfig, fingerprint, packageDirectory, PROTOCOL} from './config.mjs';

const send = (response, status, value) => {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  response.end(JSON.stringify(value));
};
async function readBody(request) {
  if ((request.headers['content-type'] || '').split(';')[0].trim() !== 'application/json') throw Error('Invalid body');
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024) throw Error('Invalid body');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function startHost(inputRoot, {startApplication} = {}) {
  const loaded = loadConfig(inputRoot);
  const {config, credentials, allowedPeers, root, rootHash} = loaded;
  const bootId = randomUUID();
  loaded.hostBootId = bootId;
  const recordFile = path.join(packageDirectory(root, 'data'), 'node-process.json');
  let stopping = false, closePromise, application, applicationPromise, phase = 'starting';
  const snapshot = () => {
    const readiness = {host: phase, application: 'not-integrated', renderer: 'not-integrated', spout: 'not-checked', td: 'not-checked'};
    if (typeof application?.readiness === 'string') readiness.application = application.readiness;
    else for (const name of ['application', 'renderer', 'spout', 'td']) {
      if (typeof application?.readiness?.[name] === 'string') readiness[name] = application.readiness[name];
    }
    return {protocolVersion: PROTOCOL, nodeId: config.nodeId, role: config.role, releaseId: config.releaseId, bootId, readiness,
      capabilities: [...new Set(['node.health', 'node.stop', ...(application?.capabilities || [])])]};
  };
  const server = https.createServer({...credentials, requestCert: true, rejectUnauthorized: true, minVersion: 'TLSv1.3', maxHeaderSize: 8192,
    handshakeTimeout: 5000, connectionsCheckingInterval: 1000}, async (req, res) => {
    let trusted = false;
    try { trusted = req.socket.authorized && allowedPeers.has(fingerprint(req.socket.getPeerCertificate().fingerprint256)); } catch {}
    if (!trusted || req.headers.origin) return send(res, 403, {error: 'Peer not allowed'});
    if (stopping) return send(res, 503, {error: 'Node stopping'});
    if (req.url === '/node/v1/health' && req.method === 'GET') return send(res, 200, snapshot());
    if(req.url==='/node/v1/max-lidar'&&config.role==='MAX_RIGHT'&&['GET','POST'].includes(req.method)){
      try{
        if(!application?.lidar) return send(res,503,{error:'LIDAR_UNAVAILABLE'});
        if(req.method==='GET')return send(res,200,await application.lidar.snapshot());
        let body;try{body=await readBody(req);}catch{return send(res,400,{error:'LIDAR_COMMAND_INVALID'});}
        if(!body||body.nodeId!==config.nodeId||body.bootId!==bootId)return send(res,409,{error:'NODE_GENERATION_MISMATCH'});
        if(Object.keys(body).some(k=>!['nodeId','bootId','commandId','expectedRevision','action'].includes(k)))return send(res,400,{error:'LIDAR_COMMAND_INVALID'});
        return send(res,200,await application.lidar.command({commandId:body.commandId,expectedRevision:body.expectedRevision,action:body.action}));
      }catch(e){return send(res,[400,409,422,503].includes(e.status)?e.status:503,{error:e.code??'LIDAR_UNAVAILABLE'});}
    }
    if (req.url === '/node/v1/stop' && req.method === 'POST') {
      let body;
      try { body = await readBody(req); } catch { return send(res, 400, {error: 'Invalid stop request'}); }
      if (!body || Object.keys(body).sort().join(',') !== 'bootId,nodeId' || body.nodeId !== config.nodeId || body.bootId !== bootId) return send(res, 409, {error: 'Node generation mismatch'});
      send(res, 200, {ok: true, nodeId: config.nodeId, bootId});
      // Only this listener/process is stopped; no remote command or PID-kill API.
      res.once('finish', () => { void close().catch(() => console.error('{"event":"application-close-failed"}')); });
      return;
    }
    send(res, 404, {error: 'Not found'});
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 1000;
  server.setTimeout(5000, socket => socket.destroy());
  server.on('tlsClientError', () => {});
  // Exclusive bind arbitrates simultaneous launches before any process record is written.
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({host: config.listen.host, port: config.listen.port, exclusive: true}, () => { server.removeListener('error', reject); resolve(); });
  });
  try {
    applicationPromise = (async () => {
      let factory = startApplication;
      if (!factory && config.application !== undefined) factory = (await import('./role-application.mjs')).startApplication;
      if (factory !== undefined && typeof factory !== 'function') throw Error('Invalid application factory');
      return factory ? await factory(loaded) : null;
    })();
    application = await applicationPromise;
    if (application && (typeof application.close !== 'function' || (application.capabilities !== undefined &&
      (!Array.isArray(application.capabilities) || application.capabilities.length > 32 || application.capabilities.some(value => typeof value !== 'string' || !/^[a-z][a-z0-9.-]{0,63}$/.test(value)))))) throw Error('Invalid role application handle');
    if (stopping) throw Error('Application start cancelled');
    const temporary = recordFile + '.' + bootId + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify({nodeId: config.nodeId, role: config.role, releaseId: config.releaseId, bootId, pid: process.pid, rootHash}), {flag: 'wx'});
    fs.renameSync(temporary, recordFile);
    phase = 'ready';
  } catch (error) { await close(); throw error; }
  function close() {
    if (closePromise) return closePromise;
    stopping = true;
    phase = 'stopping';
    const closeListener = new Promise(resolve => {
      const timeout = setTimeout(() => server.closeAllConnections(), 1500);
      server.close(() => { clearTimeout(timeout); resolve(); });
      server.closeIdleConnections();
    });
    const closeApplication = (async () => {
      // A STOP during startup still closes a handle returned later by the factory.
      const handle = await applicationPromise?.catch(() => null);
      if (typeof handle?.close === 'function') await handle.close();
    })();
    closePromise = Promise.allSettled([closeListener, closeApplication]).then(results => {
      const success=!results.some(result => result.status === 'rejected');
      const resultFile=path.join(packageDirectory(root,'data'),'node-stop-result.json');
      const temporary=resultFile+'.'+bootId+'.tmp';
      fs.writeFileSync(temporary,JSON.stringify({bootId,nodeId:config.nodeId,success}),{flag:'wx'});
      fs.renameSync(temporary,resultFile);
      if (!success) throw Error('Application close failed');
    }).finally(() => {
      try {
        const current = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
        if (current.bootId === bootId) fs.unlinkSync(recordFile);
      } catch {}
    });
    return closePromise;
  }
  return {snapshot, close, origin: loaded.origin};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--root') throw Error('Usage: host.mjs --root PATH');
    const host = await startHost(process.argv[3]);
    const stop = () => { void host.close().catch(() => { console.error('{"event":"application-close-failed"}'); process.exitCode = 1; }); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    console.log(JSON.stringify({event: 'host-ready', ...host.snapshot()}));
  } catch (error) {
    // TLS/OS errors can include private paths; log only stable codes at the executable boundary.
    console.error(JSON.stringify({event: 'host-failed', code: error.code === 'EADDRINUSE' ? 'PORT_IN_USE' : 'START_FAILED'}));
    process.exitCode = 1;
  }
}
