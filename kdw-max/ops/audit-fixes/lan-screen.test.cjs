const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createLanScreen}=require('../../apps/STARTUP/tools/lan-screen.cjs');
test('plain HTTP reads JSON/CSV, blocks all commands/private routes and untrusted hosts',async()=>{
 const calls=[];const source=http.createServer((req,res)=>{calls.push(req.url);res.writeHead(200,{'Content-Type':req.url.endsWith('.csv')?'text/csv':'application/json'});res.end(req.url.endsWith('.csv')?'"screenId"\r\n"max-menu"\r\n':'{"screenId":"max-menu"}');});
 await new Promise(r=>source.listen(0,'127.0.0.1',r));const api=createLanScreen({port:source.address().port,readPort:0});
 try{await api.listen();assert.equal(api.state().enabled,true);const base='http://127.0.0.1:'+api.state().port;
  const csv=await fetch(base+'/__kdw/screen/state.csv');assert.equal(csv.status,200);assert.match(await csv.text(),/max-menu/);
  assert.deepEqual(await(await fetch(base+'/__kdw/screen/state')).json(),{screenId:'max-menu'});
  for(const route of ['/__kdw/screen/publish','/__kdw/operator/state','/__kdw/screen/events','/stella/','/__kdw/health'])assert.equal((await fetch(base+route)).status,404);
  for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal((await fetch(base+'/__kdw/screen/state',{method})).status,405);
  assert.equal(await new Promise((resolve,reject)=>{const req=http.get(base+'/__kdw/screen/state',{headers:{Host:'evil.example:'+api.state().port}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);}),403);
  assert.equal((await fetch(base+'/__kdw/screen/state',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal(calls.length,2);
 }finally{await api.close();source.closeAllConnections();await new Promise(r=>source.close(r));}
});
