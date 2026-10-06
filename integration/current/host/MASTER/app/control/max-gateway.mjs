import {randomUUID, createHash} from 'node:crypto';

import {performance} from 'node:perf_hooks';

import {Mutex} from './vendor/async-mutex/index.mjs';



const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const validId=value=>typeof value==='string'&&ID.test(value);

const fault=(code,status=403)=>Object.assign(Error(code),{code,status});

export const MAX_LEASE_MS=5000;

const clock=()=>Math.floor(performance.timeOrigin+performance.now());

const same=(a,b)=>['nodeId','hostBootId','leaseId','ownerGeneration','assignmentId','sessionId','contentRevision'].every(k=>a[k]===b[k])&&a.datasetIdentity?.instanceKey===b.datasetIdentity?.instanceKey;



/** Role access grant, not a physical output lease or a business presented ACK.

 * Existing SQLite transactions serialize claims. Canonical SessionPort remains

 * the sole game authority and validates its own input lease and MASTER gate.

 */

export class MaxAuthority {

  constructor(db,master,{canonical,presentationMaster=master,now=clock,gatewayBootId=randomUUID(),ownedMasterBootId=null}={}){
    if(ownedMasterBootId!==null&&!validId(ownedMasterBootId))throw fault('OWNED_MASTER_BOOT_INVALID',503);

    this.db=db;this.master=master;this.presentationMaster=presentationMaster;this.canonical=canonical;this.now=now;this.gatewayBootId=gatewayBootId;
    this.ownedMasterBootId=ownedMasterBootId;this.closed=false;this.activeOperation=null;this.drain=null;

    this.mutex=new Mutex(fault('MAX_GATEWAY_CLOSED',503));

    db.exec(`CREATE TABLE IF NOT EXISTS max_role_leases(dataset TEXT,role TEXT,node TEXT,host_boot TEXT,master_boot TEXT,gateway_boot TEXT,lease TEXT,generation INTEGER,expires_ms INTEGER,PRIMARY KEY(dataset,role)) STRICT`);

    db.exec(`CREATE TABLE IF NOT EXISTS max_role_operation_guard(role TEXT PRIMARY KEY,dataset TEXT NOT NULL,master_boot TEXT NOT NULL,gateway_boot TEXT NOT NULL,operation_id TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('inflight','quarantined')),reason TEXT NOT NULL) STRICT`);

    db.exec(`CREATE TABLE IF NOT EXISTS max_history_grants(dataset TEXT NOT NULL,node TEXT NOT NULL,session TEXT NOT NULL,assignment TEXT NOT NULL,content_revision TEXT NOT NULL,PRIMARY KEY(dataset,node,session)) STRICT`);

  }

  exclusive(work){

    if(this.closed)return Promise.reject(fault('MAX_GATEWAY_CLOSED',503));

    return this.mutex.runExclusive(async()=>{if(this.closed)throw fault('MAX_GATEWAY_CLOSED',503);return work();});

  }

  assertResolved(ctx){

    const row=this.db.prepare("SELECT * FROM max_role_operation_guard WHERE role='MAX_RIGHT'").get();

    if(!row)return;

    // Only a freshly owned backend boot proves the old canonical child was

    // terminated. Neither a new gateway UUID nor a changed dataset is proof.

    if(row.master_boot!==ctx.bootId&&this.ownedMasterBootId===ctx.bootId){

      this.db.prepare("DELETE FROM max_role_operation_guard WHERE role='MAX_RIGHT'").run();return;

    }

    throw fault('MAX_CANONICAL_QUARANTINED',503);

  }

  assertNotQuarantined(){

    const row=this.db.prepare("SELECT * FROM max_role_operation_guard WHERE role='MAX_RIGHT'").get();

    if(row&&(row.state!=='inflight'||row.operation_id!==this.activeOperation))throw fault('MAX_CANONICAL_QUARANTINED',503);

  }

  /** Synchronous monotonic deadline check; safe for an independent SSE timer. */

  leaseRemaining(peer,binding){

    this.peer(peer);if(this.closed)throw fault('MAX_GATEWAY_CLOSED',503);

    this.assertNotQuarantined();

    if(!binding||binding.nodeId!==peer.nodeId||!validId(binding.hostBootId)||!validId(binding.leaseId)||!/^dataset-v1:[a-f0-9]{64}$/.test(binding.datasetIdentity?.instanceKey??''))throw fault('MAX_BINDING_REQUIRED');

    const row=this.db.prepare('SELECT * FROM max_role_leases WHERE dataset=? AND role=?').get(binding.datasetIdentity.instanceKey,peer.role);

    if(!row||row.gateway_boot!==this.gatewayBootId||row.node!==peer.nodeId||row.host_boot!==binding.hostBootId||row.lease!==binding.leaseId||row.generation!==binding.ownerGeneration)throw fault('STALE_MAX_BINDING',409);

    const remaining=row.expires_ms-this.now();if(remaining<=0)throw fault('STALE_MAX_BINDING',409);return remaining;

  }

  /** No new admissions; wait for the active critical section, do not pretend an

   * aborted HTTP request rolled back canonical work. Owner closes DB afterwards. */

  close(){

    if(!this.drain){this.closed=true;this.mutex.cancel();this.drain=this.mutex.runExclusive(()=>{});}

    return this.drain;

  }

  peer(peer){if(peer?.role!=='MAX_RIGHT'||!validId(peer.nodeId))throw fault('ROLE_NOT_ALLOWED');}

  async context(){

    const h=await this.master({method:'GET',path:'/health'});

    if(h.status!==200||h.body?.ready!==true||h.body?.service!=='stand-local-master'||!validId(h.body.bootId)||!/^dataset-v1:[a-f0-9]{64}$/.test(h.body.instanceKey??''))throw fault('BACKEND_NOT_READY',503);

    if(this.ownedMasterBootId!==null&&h.body.bootId!==this.ownedMasterBootId)throw fault('OWNED_MASTER_BOOT_CHANGED',503);

    const w=await this.master({method:'GET',path:'/max/state'});

    if(w.status!==200||!Object.hasOwn(w.body??{},'current'))throw fault('MAX_BACKEND_NOT_READY',503);

    const show=await this.master({method:'GET',path:'/max/show/state'});

    if(show.status!==200||show.body?.protocol!=='max-show-v1')throw fault('MAX_SHOW_UNAVAILABLE',503);

    const selected=await this.master({method:'GET',path:'/max/presentation/autoplay'});
    const policy=selected.body;
    if(selected.status!==200||policy?.protocol!=='max-selected-autoplay-v1'||typeof policy.enabled!=='boolean'||
      !Number.isSafeInteger(policy.revision)||policy.revision<0||!Number.isInteger(policy.screenDelayMs)||policy.screenDelayMs<500||policy.screenDelayMs>10000||policy.screenDelayMs%100!==0)throw fault('MAX_AUTOPLAY_UNAVAILABLE',503);
    const run=show.body.enabled&&show.body.run;

    const active=run&&run.phase!=='cancelled'&&run.gamePhase!=='cancelled'&&run.canonical;

    const current=active?{schemaVersion:4,assignmentId:run.runId,phase:'running',presented:false,canonical:run.canonical}:w.body.current;

    return {dataset:h.body.instanceKey,bootId:h.body.bootId,current,autoplay:active?null:policy,show:active?{runId:run.runId,phase:run.gamePhase,automatic:true,screenDelayMs:run.screenDelayMs??1000}:null};

  }

  project(row,ctx){

    const c=ctx.current;

    const active=!!(c?.schemaVersion===4&&validId(c.assignmentId)&&validId(c.canonical?.sessionId)&&!['completed','cancelled','expired','releasing'].includes(c.phase));

    return {role:'MAX_RIGHT',active,nodeId:row.node,hostBootId:row.host_boot,leaseId:row.lease,ownerGeneration:row.generation,

      datasetIdentity:{instanceKey:ctx.dataset},assignmentId:active?c.assignmentId:null,sessionId:active?c.canonical.sessionId:null,

      contentRevision:active?c.canonical.contentRevision:null,autoplay:ctx.autoplay??null,show:active?ctx.show:null,

      expiresAtMs:row.expires_ms,serverTimeMs:this.now(),phase:active?c.phase:null,presented:active&&c.presented===true};

  }

  claim(peer,body){return this.exclusive(()=>this.claimUnlocked(peer,body));}

  async claimUnlocked(peer,body){

    this.peer(peer);

    if(!body||Object.keys(body).join(',')!=='hostBootId'||!validId(body.hostBootId))throw fault('BINDING_REQUEST_INVALID',400);

    const ctx=await this.context();this.assertResolved(ctx);const at=this.now();let row;

    this.db.exec('BEGIN IMMEDIATE');

    try{

      row=this.db.prepare('SELECT * FROM max_role_leases WHERE dataset=? AND role=?').get(ctx.dataset,peer.role);

      const alive=row&&row.master_boot===ctx.bootId&&row.gateway_boot===this.gatewayBootId&&row.expires_ms>at;

      if(alive&&(row.node!==peer.nodeId||row.host_boot!==body.hostBootId))throw fault('ROLE_ALREADY_OWNED',409);

      const renew=alive&&row.node===peer.nodeId&&row.host_boot===body.hostBootId;

      const generation=renew?row.generation:(row?.generation??0)+1;

      if(!Number.isSafeInteger(generation))throw fault('OWNER_GENERATION_EXHAUSTED',503);

      this.db.prepare(`INSERT INTO max_role_leases VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(dataset,role) DO UPDATE SET node=excluded.node,host_boot=excluded.host_boot,master_boot=excluded.master_boot,gateway_boot=excluded.gateway_boot,lease=excluded.lease,generation=excluded.generation,expires_ms=excluded.expires_ms`)

        .run(ctx.dataset,peer.role,peer.nodeId,body.hostBootId,ctx.bootId,this.gatewayBootId,renew?row.lease:randomUUID(),generation,at+MAX_LEASE_MS);

      row=this.db.prepare('SELECT * FROM max_role_leases WHERE dataset=? AND role=?').get(ctx.dataset,peer.role);

      const binding=this.project(row,ctx);

      if(binding.active){

        if(typeof binding.contentRevision!=='string'||!binding.contentRevision||binding.contentRevision.length>256)throw fault('MAX_CONTEXT_UNAVAILABLE',503);

        this.db.prepare('INSERT INTO max_history_grants VALUES(?,?,?,?,?) ON CONFLICT(dataset,node,session) DO NOTHING').run(ctx.dataset,peer.nodeId,binding.sessionId,binding.assignmentId,binding.contentRevision);

        const grant=this.db.prepare('SELECT * FROM max_history_grants WHERE dataset=? AND node=? AND session=?').get(ctx.dataset,peer.nodeId,binding.sessionId);

        if(grant.assignment!==binding.assignmentId||grant.content_revision!==binding.contentRevision)throw fault('MAX_SESSION_REBOUND',409);

      }

      this.db.exec('COMMIT');

    }catch(error){this.db.exec('ROLLBACK');throw error;}

    return {status:200,body:this.project(row,ctx)};

  }

  async validate(peer,binding,{session=true}={}){

    this.peer(peer);

    if(!binding||!validId(binding.hostBootId)||!validId(binding.leaseId)||binding.nodeId!==peer.nodeId)throw fault('MAX_BINDING_REQUIRED');

    this.leaseRemaining(peer,binding);

    const ctx=await this.context();

    this.leaseRemaining(peer,binding);

    const row=this.db.prepare('SELECT * FROM max_role_leases WHERE dataset=? AND role=?').get(ctx.dataset,peer.role);

    if(!row||row.master_boot!==ctx.bootId||row.gateway_boot!==this.gatewayBootId||row.expires_ms<=this.now())throw fault('STALE_MAX_BINDING',409);

    const actual=this.project(row,ctx);

    if(!same(actual,binding)||(session&&!actual.active))throw fault('STALE_MAX_BINDING',409);

    return actual;

  }

  async handle(peer,{method,path,body,binding}){
    if(method==='POST'&&path==='/production/max/binding')return this.claim(peer,body);

    if(typeof path!=='string'||path.length>1024||!/^\/[A-Za-z0-9/._:-]+$/.test(path)||path.includes('//')||path.split('/').some(x=>x==='.'||x==='..'))throw fault('ROUTE_NOT_ALLOWED');

    // This route is reachable only through the authenticated role gateway,
    // never through the browser's /bridge/presented preparedness endpoint.
    // The Node renderer sends it after the existing native texture publisher
    // acknowledges a frame carrying the current visible game's identity.
    if(path==='/production/max/game/presented'){
      if(method!=='POST')throw fault('ROUTE_NOT_ALLOWED');
      return this.exclusive(async()=>{
        const trusted=await this.validate(peer,binding,{session:true});
        const expected=['assignmentId','sessionId','contentRevision','publishedFrame','rendererBootId','sender'];
        if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==expected.length||expected.some(k=>!Object.hasOwn(body,k))||
          !validId(body.assignmentId)||!validId(body.sessionId)||!validId(body.rendererBootId)||typeof body.contentRevision!=='string'||!body.contentRevision||body.contentRevision.length>256||
          !Number.isSafeInteger(body.publishedFrame)||body.publishedFrame<1||!['VKStand-max-right-MAX_RIGHT-content','VKStand-max-right-MAX_RIGHT-program','VK-PROD-MAX_RIGHT-content','VK-PROD-MAX_RIGHT-program'].includes(body.sender))throw fault('MAX_GAME_PRESENTED_INVALID',400);
        if(body.assignmentId!==trusted.assignmentId||body.sessionId!==trusted.sessionId||body.contentRevision!==trusted.contentRevision)throw fault('MAX_GAME_PRESENTED_STALE',409);
        const ctx=await this.context();this.assertResolved(ctx);
        const row=this.db.prepare('SELECT * FROM max_role_leases WHERE dataset=? AND role=?').get(ctx.dataset,peer.role);
        if(!row||!same(this.project(row,ctx),trusted))throw fault('STALE_MAX_BINDING',409);
        if(trusted.show?.automatic===true||ctx.show?.automatic===true)throw fault('MAX_GAME_PRESENTED_AUTOMATIC',409);
        const current=ctx.current,canonical=current?.canonical;
        if(current?.assignmentId!==trusted.assignmentId||current?.paused===true||!['delivery','awaiting_touch','playing'].includes(current?.phase)||canonical?.sessionId!==trusted.sessionId||canonical?.contentRevision!==trusted.contentRevision||
          !Number.isSafeInteger(canonical?.generation)||canonical.generation<1)throw fault('MAX_GAME_PRESENTED_UNAVAILABLE',409);
        const presentation=await this.presentationMaster({method:'GET',path:'/max/presentation'});
        if(presentation?.status!==200||presentation.body?.desiredMode!=='standard'||presentation.body?.effectiveMode!=='standard'||presentation.body?.backgroundOnly===true)throw fault('MAX_GAME_PRESENTED_MODE_UNAVAILABLE',409);
        await this.validate(peer,binding,{session:true});
        const result=await this.presentationMaster({method:'POST',path:'/max/canonical/presented',body:{assignmentId:trusted.assignmentId,sessionId:trusted.sessionId,contentRevision:trusted.contentRevision,generation:canonical.generation}});
        await this.validate(peer,binding,{session:true});
        return result;
      });
    }
    const presentation = path.match(/^\/production\/max\/presentation(?:\/(attach|ack))?$/);

    if(presentation) {

      if(!(method==='GET'&&!presentation[1]||method==='POST'&&presentation[1]))throw fault('ROUTE_NOT_ALLOWED');

      return this.exclusive(async()=>{

        const trusted=await this.validate(peer,binding,{session:false});

        let payload=body;

        if(method==='POST') {

          if(!body||!validId(body.rendererBootId))throw fault('RENDERER_BOOT_INVALID',400);

          // Bind browser identity to the authenticated current role generation.

          // Reclaiming a role cannot replay acknowledgements from its predecessor.

          const rendererBootId=createHash('sha256').update(JSON.stringify([

            trusted.datasetIdentity.instanceKey,trusted.nodeId,trusted.hostBootId,

            trusted.leaseId,trusted.ownerGeneration,body.rendererBootId])).digest('hex');

          payload={...body,rendererBootId};

        }

        const result=await this.presentationMaster({method,path:'/max/presentation'+(presentation[1]?'/'+presentation[1]:''),body:payload});
        await this.validate(peer,binding,{session:false});

        return result;

      });

    }

    const receipt=method==='GET'&&path.match(/^\/api\/max-game\/v1\/sessions\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\/receipts\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})$/);

    if(receipt)return this.exclusive(async()=>{

      this.peer(peer);if(this.closed)throw fault('MAX_GATEWAY_CLOSED',503);

      const ctx=await this.context();

      if(binding?.datasetIdentity?.instanceKey!==ctx.dataset||binding.nodeId!==peer.nodeId)throw fault('FOREIGN_MAX_HISTORY');

      const grant=this.db.prepare('SELECT * FROM max_history_grants WHERE dataset=? AND node=? AND session=?').get(ctx.dataset,peer.nodeId,receipt[1]);

      if(!grant)throw fault('FOREIGN_MAX_HISTORY');

      const result=await this.canonical({method,path,binding:{...binding,sessionId:grant.session,assignmentId:grant.assignment,contentRevision:grant.content_revision}});

      if((await this.context()).dataset!==ctx.dataset)throw fault('STALE_MAX_HISTORY',409);

      if(result.status===200&&(result.body?.schemaVersion!==1||result.body.sessionId!==receipt[1]||result.body.commandId!==receipt[2]||!['committed','unknown'].includes(result.body.status)))throw fault('INVALID_MAX_RECEIPT',503);

      return result;

    });

    const catalog=method==='GET'&&path==='/api/max-game/v1/catalog';

    const match=path.match(/^\/api\/max-game\/v1\/sessions\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})(?:\/(input-owner|commands|contacts|events|layouts\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}))?$/);

    const allowed=catalog||match&&(method==='GET'&&(!match[2]||match[2]==='events')||method==='POST'&&['input-owner','commands','contacts'].includes(match[2])||method==='PUT'&&match[2]?.startsWith('layouts/'));

    if(!allowed)throw fault('ROUTE_NOT_ALLOWED');

    return this.exclusive(async()=>{

    // Check the persisted unknown-result marker before entering canonical. This

    // also prevents a gateway-only restart from silently admitting a new owner.

    const ctx=await this.context();this.assertResolved(ctx);

    const trusted=await this.validate(peer,binding,{session:!catalog});

    if(match&&match[1]!==trusted.sessionId)throw fault('FOREIGN_MAX_SESSION');

    if(typeof this.canonical!=='function')throw fault('CANONICAL_UNAVAILABLE',503);

    // Session GET/stream establishment can restore a model or expire an input

    // lease. They share the same drain gate as POST/PUT. SSE lifetime does not.

    const guarded=!catalog;

    const operationId=guarded?randomUUID():null;

    if(guarded){

      this.db.prepare("INSERT INTO max_role_operation_guard VALUES('MAX_RIGHT',?,?,?,?, 'inflight','')").run(ctx.dataset,ctx.bootId,this.gatewayBootId,operationId);

      this.activeOperation=operationId;

    }

    let result;

    try{

      result=await this.canonical({method,path,body,binding:trusted});

      if(guarded&&!confirmedCanonicalResult(result,match))throw fault('CANONICAL_RESULT_UNKNOWN',503);

      if(guarded)this.db.prepare("DELETE FROM max_role_operation_guard WHERE role='MAX_RIGHT' AND operation_id=?").run(operationId);

    }catch(error){

      if(guarded){

        // Commit this marker before releasing the mutex. The in-flight row is

        // already durable if persisting the more explicit reason itself fails.

        try{this.db.prepare("UPDATE max_role_operation_guard SET state='quarantined',reason=? WHERE role='MAX_RIGHT' AND operation_id=?").run('CANONICAL_RESULT_UNKNOWN',operationId);}catch{}

        result?.cleanup?.();result?.stream?.destroy();

      }

      throw error;

    }finally{this.activeOperation=null;}

    try{await this.validate(peer,binding,{session:!catalog});}

    catch(error){result.cleanup?.();result.stream?.destroy();throw error;}

    return result;

    });

  }

}



function confirmedCanonicalResult(result,match){

  const status=result?.status,body=result?.body,route=match?.[2],sessionId=match?.[1];

  if(!Number.isInteger(status)||status<200||status>=500||status>=300&&status<400)return false;

  if(status>=400)return typeof body?.error?.code==='string'||body?.reply?.ok===false&&typeof body.reply.code==='string';

  if(route==='events')return status===200&&typeof result.stream?.pipe==='function'&&/^text\/event-stream(?:;|$)/i.test(result.headers?.['content-type']??'');

  if(route==='input-owner')return body?.released===true||typeof body?.ownerId==='string'&&Number.isSafeInteger(body.generation)&&typeof body.token==='string'&&Number.isFinite(body.expiresAt);

  if(route==='commands'||route?.startsWith('layouts/'))return typeof body?.reply?.ok==='boolean'&&body.snapshot?.schemaVersion===2&&body.snapshot.state?.sessionId===sessionId;

  return body?.schemaVersion===2&&body.state?.sessionId===sessionId;

}

