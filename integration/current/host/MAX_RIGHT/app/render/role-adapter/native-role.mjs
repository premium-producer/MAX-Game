import {renderSettings} from './role-settings.mjs';
// The root resolver owns authentication, lease/fence/expiry and master clock.
// This module owns only its exact renderer child after explicit authorization.
export function createNativeRenderRole(loaded,{authorizeBinding,startRenderer,onNativeFrame}={}){
 renderSettings(loaded.config);if(typeof authorizeBinding!=='function')throw Error('TRUSTED_BINDING_RESOLVER_REQUIRED');
 let child=null,key=null,state='waiting-trusted-binding',busy=false,closed=false,closing,generation=0,startupController;
 const authorize=async(binding,action)=>{
  const result=await authorizeBinding({binding,action,nodeId:loaded.config.nodeId,role:loaded.config.role,hostBootId:loaded.hostBootId});
  if(result?.allowed!==true||typeof result.bindingKey!=='string'||!result.bindingKey.trim()||result.bindingKey.length>256)throw Error('TRUSTED_BINDING_REJECTED');
  return result.bindingKey;
 };
 const run=async fn=>{if(closed||busy)throw Error('NATIVE_ROLE_UNAVAILABLE');busy=true;try{return await fn();}finally{busy=false;}};
 const closeChild=async()=>{startupController?.abort();const owned=child;child=null;key=null;if(owned)await owned.close();};
 return {
  capabilities:['render.trusted-binding.v1','render.prepared-assets.v2'],
  get readiness(){const renderer=child?.readiness?.renderer??'not-started';return {application:key&&['failed','stopped'].includes(renderer)?'native-output-failed':state,renderer,spout:'not-checked',td:'not-checked'};},
  snapshot:()=>({state,bindingActive:key!==null,maxGameOverlay:false,physicalOutput:false,renderer:child?.snapshot?.()??null}),
  start:({binding,options,assetsManifest})=>run(async()=>{
   if(key)throw Error('NATIVE_BINDING_ALREADY_ACTIVE');const currentGeneration=++generation,next=await authorize(binding,'start');if(closed||currentGeneration!==generation)throw Error('NATIVE_ROLE_REVOKED');state='native-starting';startupController=new AbortController();
   try{
    const factory=startRenderer??(await import('./start-role-renderer.mjs')).startRoleRenderer;
    let owned;
    owned=await factory(loaded,{signal:startupController.signal,onNativeFrame:frame=>{
     if(closed||currentGeneration!==generation||key!==next||child!==owned)return;
     return onNativeFrame?.(frame);
    }});if(closed||currentGeneration!==generation){await owned.close();throw Error('NATIVE_ROLE_REVOKED');}child=owned;
    const result=await child.start({bindingKey:next,options,assetsManifest});if(closed||currentGeneration!==generation)throw Error('NATIVE_ROLE_REVOKED');key=next;state='presentation-bound';return result;
   }catch(error){await closeChild();if(!closed)state='waiting-trusted-binding';throw error;}
  }),
  update:({binding,frame,frameId})=>run(async()=>{const current=await authorize(binding,'update');if(current!==key||!child)throw Error('NATIVE_STALE_BINDING');return child.update({bindingKey:key,frame,frameId});}),
  resources:({binding,assetsManifest})=>run(async()=>{const current=await authorize(binding,'resources');if(current!==key||!child)throw Error('NATIVE_STALE_BINDING');return child.resources({bindingKey:key,assetsManifest});}),
  stop:({binding})=>run(async()=>{const current=await authorize(binding,'stop');if(current!==key||!child)throw Error('NATIVE_STALE_BINDING');try{return await child.stop({bindingKey:key});}finally{await closeChild();if(!closed)state='waiting-trusted-binding';}}),
  // Root calls revoke on lease loss; no private polling/expiry scheduler.
  async revoke(){generation++;await closeChild();if(!closed)state='waiting-trusted-binding';},
  close(){return closing??=(async()=>{closed=true;generation++;state='stopped';await closeChild();})();},
 };
}
