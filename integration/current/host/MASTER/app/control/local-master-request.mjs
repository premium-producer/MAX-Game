// Existing loopback JSON transport, extracted without changing its limits.
import http from 'node:http';
const err=(code,status=403)=>Object.assign(Error(code),{code,status});
export function localMasterRequest(port,{method,path:target,body,headers={}}) {

  if(!Number.isInteger(port)||port<1024||port>65535)throw err('INVALID_BACKEND_PORT',503);

  return new Promise((resolve,reject)=>{

    let size=0;const chunks=[];const payload=body===undefined?undefined:Buffer.from(JSON.stringify(body));

    const request=http.request({hostname:'127.0.0.1',port,path:target,method,agent:false,headers:{...headers,Accept:'application/json',...(payload?{'Content-Type':'application/json','Content-Length':payload.length}:{})}},response=>{

      if(!/^application\/json(?:;|$)/i.test(response.headers['content-type']||'')){response.destroy();return reject(err('BACKEND_RESPONSE_INVALID',503));}

      response.on('data',b=>{size+=b.length;if(size>1048576)response.destroy(err('BACKEND_RESPONSE_TOO_LARGE',503));else chunks.push(b);});

      response.on('error',reject);response.on('end',()=>{try{resolve({status:response.statusCode,body:JSON.parse(Buffer.concat(chunks).toString())});}catch{reject(err('BACKEND_RESPONSE_INVALID',503));}});

    });

    const deadline=setTimeout(()=>request.destroy(err('BACKEND_TIMEOUT',503)),4300);

    request.once('close',()=>clearTimeout(deadline));request.on('error',reject);request.end(payload);

  });

}



