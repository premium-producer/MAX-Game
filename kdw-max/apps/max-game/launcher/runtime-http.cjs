'use strict';
const fs=require('node:fs'),path=require('node:path');
function runtimeHandler({origin,control}){
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 return(req,res)=>{const url=new URL(req.url,origin);if(!url.pathname.startsWith('/__kdw/runtime/'))return false;
  if(req.headers.host!==new URL(origin).host||req.headers.origin&&req.headers.origin!==origin){json(res,403,{error:'INVALID_ORIGIN'});return true;}
  const action=url.pathname.slice('/__kdw/runtime/'.length);
  if(action==='panel'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'none'"});res.end(fs.readFileSync(path.join(__dirname,'runtime-panel.html')));return true;}
  void(async()=>{if(req.method==='GET'&&['state','diagnostics'].includes(action))return control(action);if(req.method!=='POST'||req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw Object.assign(Error('INVALID_REQUEST'),{status:403});let size=0;for await(const b of req){size+=b.length;if(size>1024)throw Object.assign(Error('BODY_TOO_LARGE'),{status:413});}if(!['restart-output','restart-api','start-output','stop'].includes(action))throw Object.assign(Error('NOT_FOUND'),{status:404});return control(action);})().then(v=>json(res,200,v)).catch(e=>json(res,e.status||503,{error:e.message}));return true;
 };
}
module.exports={runtimeHandler};
