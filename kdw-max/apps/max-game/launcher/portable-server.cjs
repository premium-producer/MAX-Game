const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.bin':'application/octet-stream','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};

function createPortableServer({root, config, onStop = () => {}, onMissing = () => {}, getOutput = () => null, runtimeControl=null, runtimeState=()=>null}) {
  const publicRoot = fs.realpathSync(path.join(root, 'www'));
  const instanceKey = crypto.createHash('sha256').update(fs.realpathSync(root).toLowerCase()).digest('hex');
  const token = crypto.randomBytes(32).toString('hex');
  const origin = `http://127.0.0.1:${config.port}`;
  const lan=require('./lan-admin.cjs').createLanAdmin({root,port:config.port,app:'max'});
  const link=require('./game-link.cjs').createGameHub({root,origin,production:config.production===true,getOutput:()=>getOutput()?.operatorStatus()??null,validatePhoto:buffer=>{const image=require('electron').nativeImage.createFromBuffer(buffer);const size=image.getSize();if(image.isEmpty()||size.width!==1080||size.height!==1920)throw Object.assign(Error('INVALID_JPEG'),{code:'INVALID_JPEG',status:400});}});
  const network=require('./game-link-network.cjs').createNetworkReceiver({root,hub:link});
  const operator=require('./operator.cjs').createOperator({root,origin,link,getOutput});
  const layout=require('./layout-settings.cjs').createLayoutSettings({root,origin});
  const sound=require('./sound-library.cjs').createSoundLibrary({root,origin,app:'max'});
  const health = {application:config.id, version:config.version, instanceKey, pid:process.pid, origin, entry:config.entry};
  const json = (res, code, value) => {res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  const runtime=runtimeControl?require('./runtime-http.cjs').runtimeHandler({origin,control:runtimeControl}):null;
  const server = http.createServer((req, res) => {
    if (req.headers.host !== `127.0.0.1:${config.port}`) return json(res, 403, {error:'INVALID_HOST'});
    if(lan.handle(req,res)||runtime?.(req,res)||sound.handle(req,res)||operator.handle(req,res)||layout.handle(req,res))return;
    if(link.handle(req,res))return;
    if (req.url === '/__kdw/health' && req.method === 'GET') return json(res, 200, {...health,runtime:runtimeState()});
    if (req.url === '/__kdw/stop' && req.method === 'POST') {
      if (req.headers['x-kdw-token'] !== token) return json(res, 403, {error:'INVALID_TOKEN'});
      json(res, 200, {stopping:true});setImmediate(onStop);return;
    }
    if (!['GET','HEAD'].includes(req.method)) return json(res, 405, {error:'METHOD_NOT_ALLOWED'});
    let filename;
    try {
      const url = new URL(req.url, origin);
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      if (relative.includes('\\') || relative.includes('\0') || relative.split('/').some(part => part.startsWith('.') || part.includes(':'))) throw Error('INVALID_PATH');
      filename = path.resolve(publicRoot, relative);
      const isInside = candidate => {const rel=path.relative(publicRoot,candidate);return rel && rel !== '..' && !rel.startsWith('..'+path.sep) && !path.isAbsolute(rel);};
      if (!isInside(filename)) throw Error('INVALID_PATH');
      if (fs.statSync(filename).isDirectory()) filename = path.join(filename,'index.html');
      filename = fs.realpathSync(filename);
      if (!isInside(filename) || !fs.statSync(filename).isFile() || !MIME[path.extname(filename).toLowerCase()]) throw Error('INVALID_FILE');
    } catch {
      onMissing(req.url);res.writeHead(404);res.end();return;
    }
    const size = fs.statSync(filename).size;
    const headers = {'Content-Type':MIME[path.extname(filename).toLowerCase()],'Cache-Control':'no-cache','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
    let start=0,end=size-1,status=200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) {res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
      if (!match[1]) start = Math.max(0,size-Number(match[2]));
      else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=size) {res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
    }
    headers['Content-Length']=Math.max(0,end-start+1);
    res.writeHead(status,headers);
    if(req.method==='HEAD'||size===0){res.end();return;}
    const stream=fs.createReadStream(filename,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  });
  return {server,health,token,origin,resetForStartup:()=>link.resetForStartup(),listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,'127.0.0.1',()=>{server.off('error',reject);network.listen().then(()=>lan.listen()).then(resolve,reject);});}),close:async()=>{await lan.close();await network.close();await new Promise(resolve=>{server.closeAllConnections();server.close(()=>resolve());});}};
}
module.exports = {createPortableServer};
