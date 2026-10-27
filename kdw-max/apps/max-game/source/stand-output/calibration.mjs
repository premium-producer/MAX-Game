import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import PerspT from 'perspective-transform';

// Accepted current BFM_PLAY_AREA: FLAT_SCREEN x2192.025..4096;
// heightToPixel(1.8)..heightToPixel(1), logical4096x1280.
// This authored reachable band is not a physical sensor measurement.
export const DEFAULT_LOGICAL_SIZE=Object.freeze([4096,1280]);
export const DEFAULT_TARGET_RECT=Object.freeze({left:2192.025,top:614.9918510053234,right:4096,bottom:1020.5188384358148});
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
const copy=value=>structuredClone(value);
const sourceKey=value=>typeof value==='string'?value:JSON.stringify(value,Object.keys(value??{}).sort());
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);

export function calibrationTargets(rect=DEFAULT_TARGET_RECT,insetPx=32){
 if(!Object.values(rect).every(Number.isFinite)||!Number.isFinite(insetPx)||insetPx<0||rect.right-rect.left<=2*insetPx||rect.bottom-rect.top<=2*insetPx)fail('INVALID_TARGET_RECT');
 const l=rect.left+insetPx,r=rect.right-insetPx,t=rect.top+insetPx,b=rect.bottom-insetPx;
 return [{id:'top-left',x:l,y:t},{id:'top-right',x:r,y:t},{id:'bottom-right',x:r,y:b},{id:'bottom-left',x:l,y:b},{id:'center',x:(l+r)/2,y:(t+b)/2}];
}

export function validateQuad(points){
 if(!Array.isArray(points)||points.length!==4||!points.every(finitePoint))fail('INVALID_QUADRILATERAL');
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),scale=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 if(!(scale>1e-8)||scale>1e6)fail('DEGENERATE_QUADRILATERAL');
 let winding=0;
 for(let i=0;i<4;i++){
  const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];
  if(Math.hypot(b[0]-a[0],b[1]-a[1])<scale*1e-5)fail('DEGENERATE_QUADRILATERAL');
  const cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
  if(Math.abs(cross)<scale*scale*1e-5||winding&&Math.sign(cross)!==winding)fail('NONCONVEX_QUADRILATERAL');
  winding=Math.sign(cross);
 }
 return copy(points);
}

// The external library owns both solve and point transformation. Normalized
// destination units improve conditioning; multiplication is only pixel mapping.
export function solveCalibration(rawPoints,targetPoints,logicalSize=DEFAULT_LOGICAL_SIZE){
 validateQuad(rawPoints);validateQuad(targetPoints);
 if(!Array.isArray(logicalSize)||logicalSize.length!==2||!logicalSize.every(n=>Number.isFinite(n)&&n>0&&n<=32768))fail('INVALID_LOGICAL_SIZE');
 const destination=targetPoints.map(([x,y])=>[x/logicalSize[0],y/logicalSize[1]]),solver=PerspT(rawPoints.flat(),destination.flat());
 if(solver.coeffs.length!==9||!solver.coeffs.every(Number.isFinite)||!solver.coeffsInv.every(Number.isFinite))fail('INVALID_TRANSFORM');
 const denominators=rawPoints.map(([x,y])=>solver.coeffs[6]*x+solver.coeffs[7]*y+1);
 if(denominators.some(d=>Math.abs(d)<1e-8)||denominators.some(d=>Math.sign(d)!==Math.sign(denominators[0])))fail('PROJECTIVE_POLE');
 const map=(x,y)=>{
  if(![x,y].every(Number.isFinite))fail('INVALID_POINT');
  if(Math.abs(solver.coeffs[6]*x+solver.coeffs[7]*y+1)<1e-8)fail('PROJECTIVE_POLE');
  const [xNorm,yNorm]=solver.transform(x,y);
  if(![xNorm,yNorm].every(Number.isFinite))fail('INVALID_TRANSFORM');
  return {x:xNorm*logicalSize[0],y:yNorm*logicalSize[1],xNorm,yNorm,inside:xNorm>=0&&xNorm<=1&&yNorm>=0&&yNorm<=1};
 };
 const cornerErrorPx=Math.max(...rawPoints.map(([x,y],i)=>{const p=map(x,y);return Math.hypot(p.x-targetPoints[i][0],p.y-targetPoints[i][1]);}));
 // Library catches some singular inverses and returns identity: this residual
 // check rejects that fallback rather than trusting coefficients alone.
 if(cornerErrorPx>0.5)fail('CORNER_MAPPING_ERROR');
 return {map,coefficients:[...solver.coeffs],cornerErrorPx};
}

function envelope(value){
 if(!value||value.schemaVersion!==1||!Number.isSafeInteger(value.revision)||value.revision<0||!Object.hasOwn(value,'calibration'))fail('INVALID_CALIBRATION_STORE');
 return value;
}
const emptyEnvelope=()=>({schemaVersion:1,revision:0,calibration:null});
export class MemoryStore{
 constructor(initial=emptyEnvelope()){this.value=copy(envelope(initial));}
 read(){return copy(this.value);}
 compareAndSwap(expectedRevision,calibration){
  if(this.value.revision!==expectedRevision)fail('REVISION_CONFLICT');
  this.value={schemaVersion:1,revision:expectedRevision+1,calibration:copy(calibration)};return this.read();
 }
}

export class FileStore{
 constructor(filename){this.filename=path.resolve(filename);}
 read(){try{return envelope(JSON.parse(fs.readFileSync(this.filename,'utf8')));}catch(error){if(error.code==='ENOENT')return emptyEnvelope();throw error;}}
 compareAndSwap(expectedRevision,calibration){
  fs.mkdirSync(path.dirname(this.filename),{recursive:true});
  const lockPath=this.filename+'.lock',temporary=this.filename+'.'+randomUUID()+'.tmp';let lock;
  try{lock=fs.openSync(lockPath,'wx');}catch(error){if(error.code==='EEXIST')fail('CALIBRATION_STORE_BUSY');throw error;}
  try{
   const current=this.read();if(current.revision!==expectedRevision)fail('REVISION_CONFLICT');
   const next={schemaVersion:1,revision:expectedRevision+1,calibration:copy(calibration)},fd=fs.openSync(temporary,'wx');
   try{fs.writeFileSync(fd,JSON.stringify(next,null,2)+'\n','utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   fs.renameSync(temporary,this.filename);return copy(next);
  }finally{
   if(fs.existsSync(temporary))fs.unlinkSync(temporary);fs.closeSync(lock);fs.unlinkSync(lockPath);
  }
 }
}

const median=values=>{const s=[...values].sort((a,b)=>a-b),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;};
export class CalibrationSession{
 constructor({store=new MemoryStore(),sourceIdentity,logicalSize=DEFAULT_LOGICAL_SIZE,targets=calibrationTargets(),minSamples=5,maxJitter=0.025,maxCenterErrorPx=40,maxAgeMs=1000,now=()=>performance.now()}={}){
  if(!sourceKey(sourceIdentity)||!Array.isArray(targets)||targets.length!==5||targets.some(t=>!finitePoint([t.x,t.y])))fail('INVALID_CALIBRATION_OPTIONS');
  if(!Number.isSafeInteger(minSamples)||minSamples<1||minSamples>120||![maxJitter,maxCenterErrorPx,maxAgeMs].every(n=>Number.isFinite(n)&&n>0))fail('INVALID_CALIBRATION_OPTIONS');
  if(!Array.isArray(logicalSize)||logicalSize.length!==2||!logicalSize.every(n=>Number.isFinite(n)&&n>0&&n<=32768)||targets.some(t=>t.x<0||t.x>logicalSize[0]||t.y<0||t.y>logicalSize[1]))fail('INVALID_LOGICAL_SIZE');
  validateQuad(targets.slice(0,4).map(t=>[t.x,t.y]));
  this.store=store;this.sourceIdentity=copy(sourceIdentity);this.logicalSize=[...logicalSize];this.targets=copy(targets);this.options={minSamples,maxJitter,maxCenterErrorPx,maxAgeMs};this.now=now;this.saved=this.store.read();this.resetPending();this.restoreSolver();
 }
 resetPending(){this.phase='idle';this.index=0;this.samples=[];this.contactId=null;this.awaitingRelease=false;this.points=[];this.pendingSolver=null;this.centerErrorPx=null;this.centerRaw=null;this.lastError=null;}
 restoreSolver(){
  const c=this.saved.calibration;this.savedSolver=null;
  if(c&&sourceKey(c.sourceIdentity)===sourceKey(this.sourceIdentity)&&JSON.stringify(c.logicalSize)===JSON.stringify(this.logicalSize))this.savedSolver=solveCalibration(c.rawPoints,c.targetPoints,c.logicalSize);
 }
 state(){
  return {phase:this.phase,index:this.index,targets:copy(this.targets),samples:this.samples.length,awaitingRelease:this.awaitingRelease,centerErrorPx:this.centerErrorPx,canSave:this.phase==='verify'&&this.centerErrorPx!==null&&this.centerErrorPx<=this.options.maxCenterErrorPx&&!this.awaitingRelease,savedCalibration:copy(this.saved.calibration),revision:this.saved.revision,contactId:this.contactId,lastError:this.lastError,sourceIdentity:copy(this.sourceIdentity),logicalSize:[...this.logicalSize]};
 }
 start(expectedRevision=this.saved.revision){
  const current=this.store.read();if(current.revision!==expectedRevision)fail('REVISION_CONFLICT');
  this.saved=current;this.restoreSolver();this.resetPending();this.phase='capture';return this.state();
 }
 update({contactId,x,y,sourceIdentity=this.sourceIdentity}){
  if(sourceKey(sourceIdentity)!==sourceKey(this.sourceIdentity)){this.cancel();fail('SOURCE_CHANGED');}
  if(!['string','number'].includes(typeof contactId)||contactId===''||typeof contactId==='number'&&!Number.isSafeInteger(contactId)||![x,y].every(Number.isFinite))fail('INVALID_CONTACT');
  if(this.phase==='idle'||this.awaitingRelease)return false;
  if(this.contactId!==null&&contactId!==this.contactId)return false;
  this.contactId=contactId;this.samples.push({x,y,at:this.now()});if(this.samples.length>120)this.samples.shift();return true;
 }
 release(contactId=this.contactId){
  if(this.contactId!==null&&contactId!==this.contactId)return false;
  this.contactId=null;this.samples=[];this.awaitingRelease=false;return true;
 }
 samplePoint(){
  if(this.awaitingRelease)fail('RELEASE_REQUIRED');
  const samples=this.samples.filter(s=>this.now()-s.at<=this.options.maxAgeMs);
  if(samples.length<this.options.minSamples)fail('NOT_ENOUGH_FRESH_SAMPLES');
  const p=[median(samples.map(s=>s.x)),median(samples.map(s=>s.y))];
  if(samples.some(s=>Math.hypot(s.x-p[0],s.y-p[1])>this.options.maxJitter))fail('UNSTABLE_CONTACT');
  return p;
 }
 capture(){
  if(this.phase==='idle')fail('CALIBRATION_NOT_STARTED');
  try{
   const p=this.samplePoint();
   if(this.phase==='capture'){
    const next=[...this.points,p];
    if(next.length===4)this.pendingSolver=solveCalibration(next,this.targets.slice(0,4).map(t=>[t.x,t.y]),this.logicalSize);
    this.points=next;this.index=this.points.length;
    if(this.index===4)this.phase='verify';
   }else{
    const mapped=this.pendingSolver.map(...p),t=this.targets[4];this.centerRaw=p;this.centerErrorPx=Math.hypot(mapped.x-t.x,mapped.y-t.y);
    if(this.centerErrorPx>this.options.maxCenterErrorPx){this.lastError='CENTER_CHECK_FAILED';this.awaitingRelease=true;return this.state();}
   }
   this.awaitingRelease=true;this.lastError=null;return this.state();
  }catch(error){this.lastError=error.code??error.message;throw error;}
 }
 save(expectedRevision=this.saved.revision){
  if(!this.state().canSave)fail('CENTER_CHECK_REQUIRED');
  const calibration={schemaVersion:1,sourceIdentity:copy(this.sourceIdentity),logicalSize:[...this.logicalSize],rawPoints:copy(this.points),targetPoints:this.targets.slice(0,4).map(t=>[t.x,t.y]),coefficients:[...this.pendingSolver.coefficients],cornerErrorPx:this.pendingSolver.cornerErrorPx,centerCheck:{raw:copy(this.centerRaw),target:[this.targets[4].x,this.targets[4].y],errorPx:this.centerErrorPx,maxErrorPx:this.options.maxCenterErrorPx},savedAt:new Date().toISOString()};
  this.saved=this.store.compareAndSwap(expectedRevision,calibration);this.restoreSolver();this.resetPending();return this.state();
 }
 cancel(){this.resetPending();return this.state();}
 map(x,y){return this.savedSolver?{...this.savedSolver.map(x,y),revision:this.saved.revision}:null;}
 preview(x,y){return this.pendingSolver?this.pendingSolver.map(x,y):null;}
}
