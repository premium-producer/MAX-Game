import https from 'node:https';
import tls from 'node:tls';

const actions=new Set(['enable','disable','start','capture','save','cancel']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const pin=value=>String(value).replaceAll(':','').toUpperCase();
const fail=(message,status=400)=>Object.assign(new Error(message),{status});

export function validateLidarCommand(body){
 if(!body||Object.keys(body).some(key=>!['commandId','expectedRevision','action'].includes(key))||!uuid.test(body.commandId??'')||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||!actions.has(body.action))throw fail('Invalid LiDAR command');
 return {commandId:body.commandId,expectedRevision:body.expectedRevision,action:body.action};
}

// One provisioned node and one fixed resource; never accept an operator URL or path.
export function requestLidar(node,credentials,{method='GET',body,timeout=2500,request=https.request}={}){
 if(!['GET','POST'].includes(method)||node.role!=='MAX_RIGHT')return Promise.reject(fail('LiDAR node rejected',409));
 return new Promise((resolve,reject)=>{
  const payload=method==='POST'?Buffer.from(JSON.stringify(body)):null;
  const req=request({host:node.host,port:node.port,path:'/node/v1/max-lidar',method,...credentials,
   agent:false,minVersion:'TLSv1.3',rejectUnauthorized:true,
   headers:payload?{'Content-Type':'application/json','Content-Length':payload.length}:{},
   checkServerIdentity:(host,peer)=>tls.checkServerIdentity(host,peer)||(pin(peer.fingerprint256)===pin(node.fingerprint)?undefined:Error('Peer fingerprint mismatch'))},res=>{
   let size=0;const chunks=[];
   res.on('data',chunk=>{size+=chunk.length;if(size>65536)res.destroy(Error('Oversized LiDAR response'));else chunks.push(chunk);});
   res.on('error',reject);
   res.on('end',()=>{try{
    const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(res.statusCode<200||res.statusCode>=300){const status=[400,409,422,503].includes(res.statusCode)?res.statusCode:502;resolve({status,body:{error:String(value.error??value.reason??'LiDAR request rejected').slice(0,200)}});return;}
    if(value.protocol!=='max-lidar-v1'||!Number.isSafeInteger(value.revision)||value.revision<0)throw Error('LiDAR protocol mismatch');
    resolve({status:res.statusCode,body:value});
   }catch(error){reject(error);}});
  });
  const deadline=setTimeout(()=>req.destroy(Error('LiDAR request timed out')),timeout);
  req.once('close',()=>clearTimeout(deadline));req.on('error',reject);req.end(payload??undefined);
 });
}

export class MaxLidarControl{
 constructor(fleet,{verifyHealth,request=requestLidar}={}){this.fleet=fleet;this.verifyHealth=verifyHealth;this.request=request;}
 async handle(method,body){
  const command=method==='POST'?validateLidarCommand(body):null;
  if(!['GET','POST'].includes(method))throw fail('Method rejected',405);
  const node=this.fleet.config.nodes.find(value=>value.role==='MAX_RIGHT');
  if(!node)throw fail('MAX_RIGHT is not provisioned',503);
  let health;
  try{health=this.verifyHealth(node,await this.fleet.request(node,this.fleet.credentials),this.fleet.config.releaseId);}
  catch{throw fail('MAX_RIGHT connection or identity is not confirmed',503);}
  try{return await this.request(node,this.fleet.credentials,{method,body:command?{...command,nodeId:node.nodeId,bootId:health.bootId}:undefined});}
  catch{throw fail('MAX_RIGHT LiDAR response unavailable; command outcome may be unknown',503);}
 }
}
