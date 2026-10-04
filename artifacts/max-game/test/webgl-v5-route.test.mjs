import test from 'node:test';
import assert from 'node:assert/strict';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createBrowserPersistence} from '../public/site-game/browser-persistence.mjs';

// Contract fixtures for measured CSS centres; this does not simulate/test Flexbox.
const rows={
 'blogger.channel':{'open-max':{x:-1364,y:0},'blogger.channel':{x:-708,y:0},'blogger.comments':{x:708,y:0},'blogger.statistics':{x:1364,y:0}},
 'blogger.comments':{'open-max':{x:-2020,y:0},'blogger.channel':{x:-1364,y:0},'blogger.comments':{x:-708,y:0},'blogger.statistics':{x:708,y:0}}
};
async function fixture(){
 let time=1000,serial=0,controller;const data=new Map(),pending=[];
 const app=createMissionSessionApplication({catalog:MISSION_CATALOG,now:()=>time,persistence:createBrowserPersistence({storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},key:'v5-route-test'})});
 await app.createSession({sessionId:'v5'});
 const facade={snapshot:await app.inputOwnerChanged('v5',{active:true}),command(type,fields={}){
  const s=controller.snapshot.state,p=app.sendCommand({schemaVersion:1,type,commandId:`c${++serial}`,sessionId:s.sessionId,contentRevision:s.contentRevision,expectedRevision:s.revision,...fields});pending.push(p);return p;
 },act(screenId,actionId,revision){return this.command('ACT',{taskId:controller.snapshot.state.taskId,screenId,actionId,expectedRevision:revision});},contact(id,type,inside){const p=app.handleContact('v5',{contactId:id,sequence:++serial,type,inside});pending.push(p);return p;}};
 controller=new V5RevealJourney(sharedRevealContent(MISSION_CATALOG),facade,(_nodes,active,device)=>Object.fromEntries(Object.entries(rows[active.step]).map(([id,p])=>[id,{...p,x:p.x+Math.sign(p.x)*(device.width-360)/2}])));controller.configure(1760,1024,256);
 const sync=async()=>{while(pending.length)await pending.shift();controller.accept(await app.getSnapshot('v5'));};
 const advance=async(ms)=>{time+=ms;controller.accept((await app.pollTime('v5')).snapshot);};
 controller.select('blogger');await sync();controller.down('hand');await sync();await advance(800);finishMotion(controller);
 return {app,c:controller,sync,advance};
}
function finishMotion(c){for(let i=0;i<8;i++)c.tick(.1,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true,reduced:true});}
const nextAction=c=>c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')||c.descriptor.actions.find(a=>a.actionId==='channel.choose-private')||c.descriptor.actions[0];

test('phone drag translates both sides, aligns Y, and preserves 400px edge gaps',async()=>{
 const f=await fixture(),c=f.c;try{
  const before=c.nodes.map(n=>c.pose(n)),phone=c.phone;
  assert.equal(c.movePhone(phone.x+220,phone.y+80),true);
  c.nodes.forEach((n,i)=>{const p=c.pose(n);assert.equal(p.worldX-before[i].worldX,220);assert.equal(p.worldY-before[i].worldY,80);assert.equal(p.worldY-100,c.phone.y);});
  const row=[c.pose(c.nodes[0]),c.pose(c.nodes[1]),{worldX:c.phone.x},c.pose(c.nodes[2]),c.pose(c.nodes[3])],widths=[256,256,c.phoneMetrics.width,256,256];
  for(let i=1;i<row.length;i++)assert.ok(Math.abs(row[i].worldX-widths[i]/2-(row[i-1].worldX+widths[i-1]/2)-400)<.001);
 }finally{await f.app.close();}
});
test('accepted answer restores dragged icons without moving phone; stale repeat is rejected',async()=>{
 const f=await fixture(),c=f.c;try{
  c.movePhone(c.phone.x+300,60);const phone={...c.phone},token=c.token();
  c.move('open-max',111,222);assert.equal(c.pose(c.nodes[0]).worldX,111);
  assert.equal(c.answer(nextAction(c).actionId,token),true);await f.sync();
  assert.deepEqual(c.phone,phone);assert.equal(c.manualNodes.blogger,undefined);
  assert.equal(c.pose(c.nodes[0]).worldY-100,phone.y);assert.equal(c.answer(nextAction(c).actionId,token),false);
  assert.deepEqual(c.phone,phone);
 }finally{await f.app.close();}
});
test('task exit retains phone anchor, repacks next task, restart clears presentation anchor',async()=>{
 const f=await fixture(),c=f.c;try{
  c.movePhone(c.phone.x+180,45);const phone={...c.phone};
  for(let i=0;i<18&&c.snapshot.state.status!=='result';i++){assert.equal(c.answer(nextAction(c).actionId,c.token()),true);await f.sync();}
  assert.equal(c.snapshot.state.status,'result');await f.advance(800);finishMotion(c);
  assert.equal(c.activeId,'blogger.comments');assert.deepEqual(c.phone,phone);assert.equal(c.phoneAnchorManual,true);
  for(const n of c.nodes){assert.equal(c.pose(n).worldY-100,phone.y);assert.ok(Math.abs(c.pose(n).worldX-phone.x-(rows['blogger.comments'][n.step].x+Math.sign(rows['blogger.comments'][n.step].x)*(c.phoneMetrics.width-360)/2))<.001);}
  await c.restart();await f.sync();assert.equal(c.phoneAnchor,null);assert.equal(c.phoneAnchorManual,false);assert.equal(c.phase,'palm');
 }finally{await f.app.close();}
});
