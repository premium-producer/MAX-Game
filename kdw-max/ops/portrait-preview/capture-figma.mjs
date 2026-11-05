#!/usr/bin/env node
// PORTRAIT-LAYOUT-C: capture the Figma screen set (same 134 frames as
// UI/figma-plugins/max-current-screens) on the vertical 1080×1920 stand.
// The Git snapshot cannot rebuild the capture bundle, so the shipped app.js
// gets the portrait patch plus the same state-injection hook as
// final-prepare.mjs, mapped to the minified names. Rendering, CSS and text
// are not substituted. Frames are taken in headless Chrome over CDP.
// Usage (from kdw-max): node ops/portrait-preview/capture-figma.mjs <out-dir> [--only=a,b]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {patchBundle} from './patch-bundle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const www = path.join(root, 'apps/max-game/www');
const figma = path.join(root, 'UI/figma-plugins/max-current-screens/source');
const out = path.resolve(process.argv[2] ?? 'portrait-figma');
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
const W = 1080, H = 1920;
const chrome = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = b => createHash('sha256').update(b).digest('hex');

// final-prepare.mjs hook, minified names of the shipped bundle:
// foreground=Ne sharedSession=pt controller=D stopProduction=GC stopGameLink=Lp
// disposeIdleMenu=u9 personalChannel=ca kdwInteractions=qo kdwPosts=Lu
// businessNative=Hu clearManagedScene=Zc view=Xo configureController=i6
// fit=oa render=os host=ge phonePresence=ts pixelPlan=qs productionMode=Xs
// localDevelopment=Hr.
const HOOK = `
globalThis.__figmaCapture={
 clock(time){const c=globalThis.__kdwCaptureSnapshot.view.clock;c.serverTime=time;c.checkpointAt=time;c.held=false;},
 ready:()=>!!Ne&&!!pt&&!!D,
 async show(snapshot,warmup){GC();Lp();await u9();await ca.flush();ca.update(null,'');qo.update(null,'');Lu.update(null,'');Hu.update(null,'');const target=snapshot;globalThis.__kdwCaptureSnapshot=warmup??target;let active=globalThis.__kdwCaptureSnapshot;pt={snapshot:active,connected:true,busy:false,owner:async()=>active,poll:async()=>active,command:async()=>({reply:{ok:true},snapshot:active}),act:async()=>({reply:{ok:true},snapshot:active}),contact:async()=>active,layout:async()=>active};Zc();Xo='';i6();oa();if(D.phase==='paused')D.resume(D.activeId);os(true);if(warmup){const started=performance.now();while(performance.now()-started<30000){const p=ge.querySelector('.route-phone');if(D.phase==='task'&&!D.startup&&!D.handoff&&ts.value>.995&&!Ne.contentBusy(ge)&&Number(ge.dataset.contentPresence)>.995&&p?.dataset.gpuReadyKey===p?.dataset.sceneVersion)break;await new Promise(r=>setTimeout(r,30));}active=target;globalThis.__kdwCaptureSnapshot=target;pt.snapshot=target;D.accept(target);os(true);}},
 state:()=>({phase:D?.phase,startup:D?.startup?.stage,handoff:D?.handoff?.stage,screen:D?.displayedState?.screenId,phonePresence:ts.value,contentPresence:Number(ge.dataset.contentPresence??1),busy:Ne?.busy(ge,true),contentBusy:Ne?.contentBusy(ge),viewport:{width:innerWidth,height:innerHeight},pixelMap:!!qs,production:Xs,development:Hr})};
`;
function captureBundle() {
  let s = patchBundle(fs.readFileSync(path.join(www, 'webgl-v5/app.js'), 'utf8'));
  // Ignore the real sessions' snapshots while a fixture is shown (final-prepare guard).
  for (const needle of ['onSnapshot:i=>{Gn||t!==kn||(WC(i),', 'onSnapshot:s=>{n!==kn||Gn||(WC(s),']) {
    const at = s.indexOf(needle);
    if (at < 0 || s.indexOf(needle, at + 1) >= 0) throw Error('Snapshot hook changed: ' + needle);
    s = s.replace(needle, needle.replace('=>{', '=>{if(globalThis.__kdwCaptureSnapshot)return;'));
  }
  return Buffer.from(s + HOOK);
}

const bundle = captureBundle();
const policy = fs.readFileSync(path.join(figma, 'final-policy.json'));
const data = JSON.parse(fs.readFileSync(path.join(figma, 'final-fixtures.json'), 'utf8'));
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.ogg': 'audio/ogg'};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const send = (status, type, body) => { res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store'}); res.end(body); };
  if (url.pathname === '/__kdw/settings') return send(200, 'application/json', policy);
  if (url.pathname === '/__kdw/link/active') return send(200, 'application/json', '{"game":null}');
  if (url.pathname === '/webgl-v5/app.js') return send(200, 'text/javascript', bundle);
  const file = path.resolve(www, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(www + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(404, 'text/plain', '');
  send(200, types[path.extname(file).toLowerCase()] ?? 'application/octet-stream', fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

const assets = path.join(out, 'final-assets');
fs.mkdirSync(assets, {recursive: true});
const inventory = path.join(out, 'captures.json');
const results = fs.existsSync(inventory) ? JSON.parse(fs.readFileSync(inventory, 'utf8')) : [];
const profile = path.join(out, 'chrome-profile-' + process.pid);
const proc = spawn(chrome, ['--headless=new', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=9334',
  `--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required', 'about:blank'], {stdio: 'ignore'});
let target;
for (let i = 0; i < 100 && !target; i++) { await sleep(200); try { target = (await (await fetch('http://127.0.0.1:9334/json/list')).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, {once: true}));
let seq = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const n = ++seq; pending.set(n, r); ws.send(JSON.stringify({id: n, method, params})); });
const js = async expr => { const r = await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true}); if (r.result?.exceptionDetails) throw Error(r.result.exceptionDetails.exception?.description ?? JSON.stringify(r.result.exceptionDetails)); return r.result?.result?.value; };
const wait = async (expr, ms = 30000) => { const start = Date.now(); while (Date.now() - start < ms) { if (await js(expr)) return; await sleep(90); } throw Error('Timeout ' + expr.slice(0, 120) + ' ' + JSON.stringify(await js('globalThis.__figmaCapture?.state()'))); };
const shot = async () => Buffer.from((await send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: W, height: H, scale: 1}})).result.data, 'base64');
const save = (f, bytes, diagnostics = null) => {
  if (bytes.readUInt32BE(16) !== W || bytes.readUInt32BE(20) !== H) throw Error('Capture size mismatch ' + f.id);
  const image = f.id + '.png';
  fs.writeFileSync(path.join(assets, image), bytes);
  const row = {id: f.id, missionId: f.missionId, taskId: f.taskId, screenId: f.screenId, variant: f.variant, sector: f.sector, width: W, height: H, image, sha256: sha(bytes), bytes: bytes.length, diagnostics};
  const old = results.findIndex(r => r.id === f.id); if (old >= 0) results.splice(old, 1); results.push(row);
  fs.writeFileSync(inventory, JSON.stringify(results, null, 2));
};

try {
  await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 1, mobile: false, screenWidth: W, screenHeight: H});
  await send('Emulation.setFocusEmulationEnabled', {enabled: true});
  await send('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/webgl-v5/client.html?backend=local&view=pixel-map&v=stand-production-v1&display=portrait`});
  await wait('globalThis.__figmaCapture?.ready()', 90000);
  await wait("document.documentElement.dataset.gameReady==='true'&&[...document.querySelectorAll('[data-idle-mission]')].every(n=>Number(n.dataset.pathPresence)>.995)", 90000);
  await sleep(1200);
  if (!only) save({id: 'shared.standby', missionId: null, taskId: null, screenId: 'shared.standby', variant: 'standby', sector: null}, await shot());
  const selected = only ? data.fixtures.filter(f => only.split(',').some(p => f.id.includes(p))) : data.fixtures;
  const failures = [];
  for (const [index, original] of selected.entries()) {
    const f = structuredClone(original), shift = Date.now() - f.snapshot.view.clock.serverTime;
    const rebase = o => { for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number' && v > 1e12 && v < 1e13) o[k] = v + shift; else if (v && typeof v === 'object') rebase(v); } };
    rebase(f.snapshot); if (f.warmupSnapshot) rebase(f.warmupSnapshot);
    const clock = f.snapshot.view.clock.serverTime;
    if (f.variant === 'activity') { f.snapshot.view.clock.serverTime = clock - 4500; f.snapshot.view.clock.checkpointAt = clock - 4500; }
    console.log(`[${index + 1}/${selected.length}] ${f.id}`);
    try {
      await js(`__figmaCapture.show(${JSON.stringify(f.snapshot)},${JSON.stringify(f.warmupSnapshot ?? null)})`);
      const terminal = ['completed', 'incomplete'].includes(f.screenId), palm = f.variant === 'palm', snack = f.screenId === 'business.platform.ready';
      if (terminal) await wait("__figmaCapture.state().phase==='complete'");
      else if (palm) await wait("__figmaCapture.state().phase==='palm'&&Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.995");
      else await wait(`(()=>{const s=__figmaCapture.state(),p=document.querySelector('.route-phone');return ['task','result'].includes(s.phase)&&!s.startup&&!s.handoff&&!s.contentBusy&&s.contentPresence>.995&&${snack ? 'true' : "s.phonePresence>.995&&p?.dataset.mediaReadyKey===p?.dataset.sceneVersion&&p?.dataset.gpuReadyKey===p?.dataset.sceneVersion"}})()`);
      await wait('__figmaCapture.state().contentPresence>.995');
      await sleep(f.variant === 'result' ? 30 : 900);
      if (f.variant === 'activity') {
        await wait(`document.querySelector(${JSON.stringify(f.taskId === 'business.channel' ? '#kdw-posts' : '.kdw-store-editor')})&&!document.querySelector(${JSON.stringify(f.taskId === 'business.channel' ? '.kdw-post-phone' : '.kdw-store-editor')}).inert`);
        for (let i = 0; i <= 60; i++) { await js(`__figmaCapture.clock(${clock - 4500 + i * 100})`); await sleep(35); }
        await sleep(100);
      }
      if (f.variant === 'success') await sleep(700);
      if (f.variant === 'keyboard') { await js(`document.querySelector('[data-pc-field="${f.taskId === 'blogger.channel' ? 'name' : 'reply'}"]').click()`); await sleep(800); }
      // The composition eases the device, reference and icons towards their new
      // place after a screen change; capture only once they stop moving.
      const geometry = `JSON.stringify([...document.querySelectorAll('.route-phone,.task-dialog .instruction,.object[data-object],.v5-device-timer,.kdw-transition-button')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]}))`;
      for (let last = '', stable = 0, start = Date.now(); stable < 4 && Date.now() - start < 15000; await sleep(150)) {
        const now = await js(geometry); stable = now === last ? stable + 1 : 0; last = now;
      }
      await js(`Promise.all([...document.images].filter(e=>!e.closest('[hidden]')&&e.getBoundingClientRect().width>0).map(e=>e.decode().catch(()=>null)))`);
      await js('document.fonts.ready.then(()=>true)');
      if (f.variant === 'success') {
        await js(`__figmaCapture.clock(${Date.now()})`);
        await wait(`(()=>{const b=document.querySelector(${JSON.stringify(f.taskId === 'business.channel' ? '[data-post-finish]' : '[data-kdw-submit]')});return b&&!b.hidden&&!b.disabled&&!b.closest('[inert]')})()`);
      }
      const diagnostics = await js(`({state:__figmaCapture.state(),forbidden:[...document.querySelectorAll('.kdw-browser-back,.v5-brand,#v5-tools,.v5-qr-restart,.kdw-task-skip')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).map(e=>e.className)})`);
      save(f, await shot(), diagnostics);
    } catch (error) {
      failures.push({id: f.id, error: String(error.message ?? error).slice(0, 400)});
      console.log('  failed:', failures.at(-1).error);
    }
  }
  fs.writeFileSync(path.join(out, 'failures.json'), JSON.stringify(failures, null, 2));
  console.log('captured', results.length, 'failed', failures.length);
} finally {
  ws.close(); proc.kill(); server.close();
  await sleep(500); fs.rmSync(profile, {recursive: true, force: true});
}
