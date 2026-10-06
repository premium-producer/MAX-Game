import {performance} from 'node:perf_hooks';
import {projectIdleBootstrap} from './idle-bootstrap.mjs';

/** Poll only authenticated read-only bootstrap. Local freshness permission is
 * deliberately not an exclusive output lease or a business presentation ACK. */
export async function startRenderIdleClient(loaded,{request,createRole,createPresenter,onNativeFrame,now=()=>performance.now()}={}){
  const policy=loaded.config.renderIdlePolicy;
  if(!policy||policy.onClockExpired!=='revoke'||policy.maxClockAgeMs<1000||typeof loaded.hostBootId!=='string')throw Error('IDLE_CLIENT_POLICY_REQUIRED');
  request??=(await import('../transport.mjs')).requestMaster;
  createRole??=(await import('../render/role-adapter/native-role.mjs')).createNativeRenderRole;
  createPresenter??=(await import('../render/idle-adapter/idle-presenter.mjs')).createIdlePresenter;
  const lifetime=new AbortController();let closed=false,current=null,expires=0,timer,pending,startPending,closing,lastError=null,sequence=0,terminal=false;
  const role=createRole(loaded,{onNativeFrame:frame=>{
    if(closed||current===null||now()>=expires)return;
    return onNativeFrame?.(frame);
  },authorizeBinding:async({binding,nodeId,role,hostBootId})=>{
    if(closed||binding!==current||now()>=expires||nodeId!==loaded.config.nodeId||role!==loaded.config.role||hostBootId!==loaded.hostBootId)throw Error('IDLE_PERMISSION_EXPIRED');
    return {allowed:true,bindingKey:current};
  }});
  const presenter=createPresenter({role,policy,now});
  function validate(value,rttMs){
    if(value?.protocol!=='production-idle-bootstrap-v1'||value.nodeId!==loaded.config.nodeId||value.role!==loaded.config.role)throw Error('IDLE_BOOTSTRAP_IDENTITY');
    const projected=projectIdleBootstrap({health:{ready:true,service:'stand-local-master',bootId:value.masterBootId,instanceKey:value.datasetIdentity?.instanceKey},
      peer:{nodeId:value.nodeId,role:value.role},clockSnapshot:value.clockSnapshot,visualRevision:value.visualRevision,policy:value.policy});
    for(const key of ['composition','outputs','authorization','capabilities','policy'])if(JSON.stringify(value[key])!==JSON.stringify(projected[key]))throw Error('IDLE_BOOTSTRAP_CONTRACT');
    if(JSON.stringify(value.policy)!==JSON.stringify(policy)||!Number.isFinite(rttMs)||rttMs<0||rttMs>=policy.maxClockAgeMs)throw Error('IDLE_BOOTSTRAP_STALE');
    return [value.datasetIdentity.instanceKey,value.masterBootId,value.nodeId,loaded.hostBootId,value.visualRevision].join('|');
  }
  async function revoke(){current=null;expires=0;await presenter.revoke();if(startPending)await startPending.catch(()=>{});}
  async function refresh(){
    if(closed||terminal)return;if(pending)return pending;
    pending=(async()=>{
      try{
        const sent=now();const response=await request(loaded,{method:'GET',path:'/production/render/bootstrap',signal:lifetime.signal});
        if(closed)return;
        const received=now(),rttMs=received-sent;if(response.status!==200)throw Error('IDLE_BOOTSTRAP_UNAVAILABLE');
        const value=response.data,key=validate(value,rttMs);
        presenter.updateShow?.(value.maxShow??null);
        const same=key===current;
        if(same&&value.clockSnapshot.sequence<=sequence)throw Error('IDLE_BOOTSTRAP_SEQUENCE');
        const state=presenter.snapshot().state;
        if(!same||!['idle-running','idle-starting','idle-clock-stale'].includes(state)){
          await revoke();if(closed)return;
          current=key;sequence=0;
        }
        expires=sent+policy.maxClockAgeMs;
        if(now()>=expires)throw Error('IDLE_BOOTSTRAP_EXPIRED_DURING_DRAIN');
        sequence=value.clockSnapshot.sequence;lastError=null;
        const args={binding:current,clockSnapshot:{...value.clockSnapshot,serverTimeMs:value.clockSnapshot.serverTimeMs+Math.max(0,now()-received),rttMs}};
        if(['idle-running','idle-starting','idle-clock-stale'].includes(presenter.snapshot().state))presenter.updateClock(args);
        else if(!startPending){
          startPending=presenter.start(args).catch(()=>{lastError='IDLE_RENDER_START_FAILED';}).finally(()=>{startPending=null;});
        }
      }catch(error){
        if(!closed){lastError='IDLE_BOOTSTRAP_UNAVAILABLE';try{await revoke();}catch{terminal=true;lastError='IDLE_REVOKE_FAILED';}}
      }finally{pending=null;}
    })();return pending;
  }
  const poll=async()=>{try{await refresh();}catch{terminal=true;lastError='IDLE_POLL_FAILED';}if(!closed&&!terminal)timer=setTimeout(poll,Math.min(1000,policy.maxClockAgeMs/4));};
  void poll();
  return {capabilities:['render.idle-clock.v1'],get readiness(){return {...presenter.readiness,...(lastError?{application:terminal?'idle-failed':'idle-backend-unavailable'}:{})};},
    snapshot:()=>({...presenter.snapshot(),lastError,businessMarkers:false,physicalOutput:false}),refresh,
    close(){return closing??=(async()=>{closed=true;current=null;expires=0;clearTimeout(timer);lifetime.abort();await presenter.close();await pending;await startPending;})();}};
}
