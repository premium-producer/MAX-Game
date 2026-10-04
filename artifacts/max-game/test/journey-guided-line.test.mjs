import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clientContent} from '../src/journey-client.mjs';
import {taskFor} from '../src/journey-tasks.mjs';
import {GuidedLineJourney,LINE_PHONE,LINE_LINK_STYLE,phoneLaneCurves} from '../src/journey-guided-line.mjs';
import {GuidedJourney} from '../src/journey-guided.mjs';
import {signalLinkKey,JOURNEY_LINK_STYLE} from '../src/journey-links.mjs';
import {TaskContentTransition} from '../src/journey-popup-motion.mjs';
const content=clientContent(JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url))));
function begin(id='blogger'){const g=new GuidedLineJourney(content);g.select(id);g.start();g.tick(0,{settled:true});g.down(1);for(let i=0;i<8;i++)g.tick(.1);return g;}
function finish(g){g.tick(0,{settled:true});for(let i=0;i<5;i++)g.tick(.1,{settled:true});g.tick(0);while(g.phase==='task'){const task=taskFor(g.current,content);g.answer(task.correct==='*'?0:task.correct);}assert.equal(g.phase,'result');}
test('five lanes have distinct boundary ports, stable keys and wider bundles',()=>{
 const a={x:0,y:400,w:128,h:128,radius:30},b={x:400,y:0,w:392,h:800,radius:38};
 const {curves,base}=phoneLaneCurves(a,b);
 assert.equal(curves.length,5);assert.equal(new Set(curves.map(c=>`${c.end.x}:${c.end.y}`)).size,5);
 for(const c of curves){assert.ok(c.end.x>=b.x&&c.end.x<=b.x+b.w);assert.ok(c.end.y>=b.y&&c.end.y<=b.y+b.h);for(const p of [c.start,c.end,c.c1,c.c2])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
 assert.deepEqual(phoneLaneCurves(a,b,base).curves,curves);
 assert.equal(new Set(curves.map((_,i)=>signalLinkKey(1,2,i))).size,5);
 assert.equal(signalLinkKey(1,2),signalLinkKey(2,1));assert.equal(signalLinkKey(1,2),'1:2');
 assert.ok(LINE_LINK_STYLE.lineWidth>JOURNEY_LINK_STYLE.lineWidth);assert.equal(LINE_LINK_STYLE.strandCount,5);
});
test('world phone and continuation retain free placement across restore',()=>{
 const g=begin();g.movePhone(1710,-65);const save=g.serialize(),restored=new GuidedLineJourney(content,save);
 assert.deepEqual(restored.phone,{x:1710,y:-65});assert.equal(restored.continuation.worldX,1710+LINE_PHONE.gap);
 assert.equal(restored.phase,'paused');assert.equal(restored.session.task,null);
 assert.equal(new GuidedLineJourney(content,new GuidedJourney(content).serialize()).phase,'menu');
});
test('next opportunity is beyond the manually placed phone and previous captions',()=>{
 const g=begin();g.movePhone(2000,80);finish(g);for(let i=0;i<8;i++)g.tick(.1);g.tick(0);
 assert.equal(g.phase,'reveal');assert.equal(g.current.worldX,2420);assert.equal(g.current.worldY,80);assert.equal(g.phone.x,2840);
});
test('closing a result and restoring cannot place the next step inside the phone',()=>{
 const g=begin();g.movePhone(2500,55);finish(g);g.close();
 const restored=new GuidedLineJourney(content,g.serialize());assert.equal(restored.current.worldX,2920);assert.equal(restored.current.worldY,55);
});
test('all six missions and business branches preserve existing answers and completion',()=>{
 for(const mission of content.missions)for(const branch of mission.branches?['channel','bot','store']:[null]){
  const g=begin(mission.id);let safety=0;
  while(g.phase!=='complete'&&safety++<20){finish(g);for(let i=0;i<8;i++)g.tick(.1);g.tick(0);if(g.phase==='branch'){assert.equal(g.choose(branch),true);g.tick(0);}}
  assert.equal(g.phase,'complete',`${mission.id}/${branch}`);assert.ok(g.session.completed.includes(mission.id));
 }
});
test('persistent phone recovers from cancelled content without a jump or stale commit',()=>{
 const m=new TaskContentTransition();let commits=0;m.start(()=>commits++);m.tick(.05);const before=m.value;
 m.restore();assert.equal(m.value,before);let last=m.value;
 for(let i=0;i<12;i++){m.tick(.03);assert.ok(m.value>=last);last=m.value;}
 assert.equal(m.value,1);assert.equal(m.busy,false);assert.equal(commits,0);
});
