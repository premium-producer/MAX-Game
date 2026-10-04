// Only the plugin directory is served; no access to the project root/secrets.
import http from 'node:http';
import fs from 'node:fs/promises';
const html=new URL('./ui.html',import.meta.url);
http.createServer(async(req,res)=>{try{
 if(req.method!=='GET')throw Error('Method');
 const route=new URL(req.url,'http://localhost').pathname,ui=await fs.readFile(html,'utf8'),script=ui.match(/<script>([\s\S]*)<\/script>/)[1];
 const payload=JSON.parse(script.match(/const DATA=([\s\S]*?);\r?\nconst \$/)[1]),game=Buffer.from(payload.html,'base64').toString('utf8'),scripts=[...game.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 const pages={'/':ui.replace(/<script>[\s\S]*<\/script>/,'<script src="/ui.js"></script>'),'/ui.js':script,'/game.html':game.replace(/<script>[\s\S]*?<\/script>/g,(()=>{let i=0;return ()=>`<script src="/game-${i++}.js"></script>`;})()),'/game-0.js':scripts[0],'/game-1.js':scripts[1]};
 if(!(route in pages))throw Error('Route');res.writeHead(200,{'content-type':route.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'});res.end(pages[route]);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(8786,'127.0.0.1',()=>console.log('MAX plugin preview: http://127.0.0.1:8786/'));
