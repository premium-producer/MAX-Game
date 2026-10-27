import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import PerspT from 'perspective-transform';
import {CalibrationSession,MemoryStore,FileStore,calibrationTargets,DEFAULT_TARGET_RECT,DEFAULT_LOGICAL_SIZE,validateQuad,solveCalibration} from './calibration.mjs';
import {BFM_PLAY_AREA} from '../client/src/bfm-play-area.mjs';

const sourceIdentity='HokuyoTracker2@10.0.0.11:59947';
const rectRaw=[[.1,.1],[.9,.1],[.9,.9],[.1,.9]];
function create(options={}){let clock=0;const session=new CalibrationSession({sourceIdentity,now:()=>clock,...options});return {session,tick:n=>clock+=n};}
function sample(session,[x,y],contactId=9){for(let i=0;i<5;i++)session.update({contactId,x,y});}
function corners(session,raw=rectRaw){session.start();for(const p of raw){sample(session,p);session.capture();session.release(9);}return session;}
function verified(session,center=[.5,.5]){corners(session);sample(session,center);session.capture();session.release(9);return session;}
const near=(actual,wanted,epsilon=.1)=>assert.ok(Math.abs(actual-wanted)<=epsilon,`${actual} differs from ${wanted}`);

test('reachable default targets match current BFM band and omit globalX/service rows',()=>{
 assert.deepEqual(DEFAULT_TARGET_RECT,BFM_PLAY_AREA);assert.deepEqual(DEFAULT_LOGICAL_SIZE,[4096,1280]);
 const targets=calibrationTargets();assert.deepEqual(targets.map(t=>t.id),['top-left','top-right','bottom-right','bottom-left','center']);
 for(const target of targets)assert.ok(target.x>BFM_PLAY_AREA.left&&target.x<BFM_PLAY_AREA.right&&target.y>BFM_PLAY_AREA.top&&target.y<BFM_PLAY_AREA.bottom);
});
test('actual ready solver maps projective quadrilateral, center and mirrored source',()=>{
 const raw=[[.1,.1],[.9,.15],[.8,.9],[.2,.8]],targets=calibrationTargets().slice(0,4).map(t=>[t.x,t.y]);
 const solved=solveCalibration(raw,targets);assert.ok(solved.cornerErrorPx<.1);
 const independent=PerspT(targets.map(([x,y])=>[x/4096,y/1280]).flat(),raw.flat()),t=calibrationTargets()[4],source=independent.transform(t.x/4096,t.y/1280),center=solved.map(...source);
 near(center.x,t.x);near(center.y,t.y);
 const mirror=solveCalibration(raw.map(([x,y])=>[1-x,y]),targets);near(mirror.map(1-source[0],source[1]).x,t.x);
});
test('invalid finite, repeated, collinear, crossed and nearly collapsed quadrilaterals reject',()=>{
 for(const raw of [[[0,0],[1,0],[1,1],[NaN,1]],[[0,0],[0,0],[1,1],[0,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,1],[1,0],[0,1]],[[0,0],[1,0],[1,1e-7],[0,1e-7]]])assert.throws(()=>validateQuad(raw));
});
test('first contact owns capture; enough raw stable samples and release are required',()=>{
 const {session}=create();session.start();assert.equal(session.update({contactId:9,x:.1,y:.1}),true);assert.equal(session.update({contactId:10,x:.9,y:.1}),false);
 assert.throws(()=>session.capture(),{code:'NOT_ENOUGH_FRESH_SAMPLES'});sample(session,[.1,.1]);session.capture();assert.equal(session.state().index,1);
 assert.throws(()=>session.capture(),{code:'RELEASE_REQUIRED'});assert.equal(session.update({contactId:9,x:.9,y:.1}),false);assert.equal(session.release(10),false);
 assert.equal(session.state().awaitingRelease,true);session.release(9);assert.equal(session.state().samples,0);sample(session,[.9,.1]);session.capture();assert.equal(session.state().index,2);
});
test('stale and jittery contacts cannot become calibration points',()=>{
 const {session,tick}=create();session.start();sample(session,[.1,.1]);tick(1001);assert.throws(()=>session.capture(),{code:'NOT_ENOUGH_FRESH_SAMPLES'});
 session.release();sample(session,[.1,.1]);session.update({contactId:9,x:.2,y:.2});assert.throws(()=>session.capture(),{code:'UNSTABLE_CONTACT'});assert.equal(session.state().index,0);
});
test('center check is independent and mandatory, retry needs release',()=>{
 const {session}=create();corners(session);assert.equal(session.state().phase,'verify');assert.equal(session.state().index,4);assert.equal(session.map(.5,.5),null);
 assert.throws(()=>session.save(),{code:'CENTER_CHECK_REQUIRED'});sample(session,[.6,.5]);assert.equal(session.capture().lastError,'CENTER_CHECK_FAILED');assert.equal(session.state().canSave,false);
 assert.throws(()=>session.capture(),{code:'RELEASE_REQUIRED'});session.release();sample(session,[.5,.5]);session.capture();assert.equal(session.state().canSave,false);
 session.release();assert.equal(session.state().canSave,true);near(session.state().centerErrorPx,0,.1);const saved=session.save(0);assert.equal(saved.phase,'idle');assert.equal(saved.revision,1);
 near(session.map(.5,.5).x,calibrationTargets()[4].x);assert.equal(session.map(.5,.5).revision,1);
});
test('cancel and failed capture preserve saved calibration and mapping',()=>{
 const {session}=create();verified(session).save();const saved=session.state().savedCalibration,mapped=session.map(.5,.5);
 session.start(1);sample(session,[.2,.2]);session.capture();session.cancel();assert.deepEqual(session.state().savedCalibration,saved);assert.deepEqual(session.map(.5,.5),mapped);
 session.start(1);assert.throws(()=>session.update({contactId:9,x:Infinity,y:0}),{code:'INVALID_CONTACT'});assert.deepEqual(session.state().savedCalibration,saved);
});
test('wrong source cancels pending session without changing good calibration',()=>{
 const {session}=create();verified(session).save();session.start(1);assert.throws(()=>session.update({contactId:9,x:.1,y:.1,sourceIdentity:'other-sensor'}),{code:'SOURCE_CHANGED'});
 assert.equal(session.state().phase,'idle');assert.equal(session.state().revision,1);assert.ok(session.map(.5,.5));
});
test('two operator sessions use revision CAS and retain pending candidate on conflict',()=>{
 const store=new MemoryStore(),a=create({store}).session,b=create({store}).session;verified(a);verified(b);a.save(0);
 assert.throws(()=>b.save(0),{code:'REVISION_CONFLICT'});assert.equal(b.state().phase,'verify');assert.equal(store.read().revision,1);
 assert.throws(()=>b.start(0),{code:'REVISION_CONFLICT'});b.cancel();b.start(1);assert.equal(b.state().revision,1);
});
test('reloaded good calibration matches source identity/dimensions; raw screen clipping remains explicit',()=>{
 const store=new MemoryStore(),session=create({store}).session;verified(session).save(0);
 const recovered=create({store}).session;near(recovered.map(.5,.5).x,calibrationTargets()[4].x);
 const foreign=create({store,sourceIdentity:'foreign'}).session;assert.equal(foreign.map(.5,.5),null);
 const mapped=recovered.map(-2,-2);assert.equal(mapped.inside,false);assert.ok(mapped.x<0);
});
test('file store atomic overwrite, CAS conflicts and lock contention do not destroy prior save',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'max-lidar-calibration-')),filename=path.join(directory,'calibration.json');
 try{
  const store=new FileStore(filename),session=create({store}).session;verified(session).save(0);const before=fs.readFileSync(filename,'utf8');assert.equal(store.read().revision,1);
  assert.throws(()=>store.compareAndSwap(0,null),{code:'REVISION_CONFLICT'});assert.equal(fs.readFileSync(filename,'utf8'),before);
  fs.writeFileSync(filename+'.lock','');assert.throws(()=>store.compareAndSwap(1,null),{code:'CALIBRATION_STORE_BUSY'});fs.unlinkSync(filename+'.lock');assert.equal(fs.readFileSync(filename,'utf8'),before);
  assert.equal(store.compareAndSwap(1,store.read().calibration).revision,2);assert.equal(fs.readdirSync(directory).length,1);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('corrupt persistence fails closed; uncalibrated map never invents an identity transform',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'max-lidar-calibration-')),filename=path.join(directory,'calibration.json');
 try{fs.writeFileSync(filename,'{"schemaVersion":1,"revision":-1,"calibration":null}');assert.throws(()=>new FileStore(filename).read(),{code:'INVALID_CALIBRATION_STORE'});}finally{fs.rmSync(directory,{recursive:true,force:true});}
 assert.equal(create().session.map(.5,.5),null);
});
