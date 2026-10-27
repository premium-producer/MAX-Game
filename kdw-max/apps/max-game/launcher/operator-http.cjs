'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const revision=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function read(file,fallback){try{return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch(e){if(e.code==='ENOENT')return structuredClone(fallback);throw e;}}
function atomic(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');if(fs.existsSync(file))fs.copyFileSync(file,file+'.backup');fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req,origin){if(req.method!=='POST'||req.headers.origin!==origin||req.headers['content-type']!=='application/json')throw fail('Требуется локальная панель управления',403);let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>65536)throw fail('Слишком большой запрос',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail('Некорректный JSON');}}
function serialHandler(origin,route){let queue=Promise.resolve();return(req,res)=>{const url=new URL(req.url,origin);if(!url.pathname.startsWith('/__kdw/operator/'))return false;const run=async()=>{try{if(req.headers.origin&&req.headers.origin!==origin)throw fail('Неверный Origin',403);const input=req.method==='GET'?null:await body(req,origin);json(res,200,await route(url.pathname.slice('/__kdw/operator/'.length),input));}catch(e){json(res,e.status||400,{error:e.message});}};queue=queue.then(run,run);return true;};}
function compare(expected,value){if(expected!==revision(value))throw fail('Настройки изменены в другом окне. Перечитайте их перед сохранением',409);}
module.exports={fail,read,atomic,json,body,revision,compare,serialHandler};
