const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const net=require('node:net');
const http=require('node:http');
const {createPortableServer}=require('./portable-server.cjs');
test('portable HTTP: resources, ranges, isolation and authenticated stop',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'KDW portable HTTP '));
 let host;
 try {
  fs.mkdirSync(path.join(root,'www'));
  fs.writeFileSync(path.join(root,'www/index.html'),'<title>MAX</title>');
  fs.writeFileSync(path.join(root,'www/clip.mp4'),'0123456789');
  fs.writeFileSync(path.join(root,'private.json'),'private');
  const reservation=net.createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  let stopped=false;
  host=createPortableServer({root,config:{id:'test',version:'1',entry:'/',port},onStop:()=>{stopped=true;}});
  await host.listen();
  assert.equal((await fetch(host.origin+'/')).status,200);
  assert.equal((await fetch(host.origin+'/private.json')).status,404);
  assert.equal((await fetch(host.origin+'/%2e%2e%5cprivate.json')).status,404);
  const foreignHostStatus=await new Promise((resolve,reject)=>{http.get(host.origin+'/',{headers:{Host:'example.com'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});
  assert.equal(foreignHostStatus,403);
  const range=await fetch(host.origin+'/clip.mp4',{headers:{Range:'bytes=2-5'}});
  assert.equal(range.status,206);assert.equal(range.headers.get('content-type'),'video/mp4');assert.equal(await range.text(),'2345');
  const suffix=await fetch(host.origin+'/clip.mp4',{headers:{Range:'bytes=-3'}});assert.equal(await suffix.text(),'789');
  assert.equal((await fetch(host.origin+'/clip.mp4',{headers:{Range:'bytes=100-200'}})).status,416);
  assert.equal((await fetch(host.origin+'/',{method:'HEAD'})).headers.get('content-length'),'18');
  const health=await (await fetch(host.origin+'/__kdw/health')).json();assert.equal(health.application,'test');assert.equal(health.token,undefined);
  assert.equal((await fetch(host.origin+'/__kdw/stop',{method:'POST'})).status,403);assert.equal(stopped,false);
  assert.equal((await fetch(host.origin+'/__kdw/stop',{method:'POST',headers:{'X-KDW-Token':host.token}})).status,200);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(stopped,true);
 } finally {await host?.close();fs.rmSync(root,{recursive:true,force:true});}
});
