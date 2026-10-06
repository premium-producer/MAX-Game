import fs from 'node:fs';
import path from 'node:path';
import {localMasterRequest} from './local-master-request.mjs';

/** Existing canonical control credential remains inside the MASTER process. */
export function presentationMasterRequest(root,port){
 const base=fs.realpathSync(root),secrets=fs.realpathSync(path.join(base,'secrets'));
 const file=fs.realpathSync(path.join(secrets,'canonical-control.token'));
 for(const [parent,child] of [[base,secrets],[secrets,file]]){
  const relative=path.relative(parent,child);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('PRESENTATION_CONTROL_CONFIG_INVALID');
 }
 const token=fs.readFileSync(file,'utf8');
 if(token.length<24||token.length>4096||/[\r\n]/.test(token))throw Error('PRESENTATION_CONTROL_CONFIG_INVALID');
 return ({method,path:target,body})=>{
  if(!(method==='GET'&&target==='/max/presentation'||method==='POST'&&['/max/presentation/attach','/max/presentation/ack','/max/canonical/presented'].includes(target)))throw Error('PRESENTATION_CONTROL_ROUTE_INVALID');
  return localMasterRequest(port,{method,path:target,body,headers:{'X-Local-Control':token}});
 };
}
