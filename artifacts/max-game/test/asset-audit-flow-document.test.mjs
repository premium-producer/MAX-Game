import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAuditCatalog} from '../scripts/build-asset-audit.mjs';
import {migrateFlowDocument,validateFlowDocument,DEFAULT_AUTO_DELAY_MS} from '../src/asset-audit/flow-document.mjs';

const hash='a'.repeat(64);
function fixture(){
 const screen=(id,outcome,extra={})=>({screenId:id,assetId:`asset-${id}`,asset:{sha256:hash,width:100,height:200},instruction:`Help ${id}`,automaticMs:null,
  actions:[{actionId:`${id}.go`,label:`Go ${id}`,placement:'hotspot',rect:[1,2,30,40],outcome}],...extra});
 const catalog={contentRevision:'source-v1',missions:[{missionId:'mission',tasks:[{taskId:'task',startScreenId:'a',screens:[
  screen('a',{kind:'navigate',screenId:'b'}),screen('b',{kind:'complete-task'})]}]}]};
 const legacy={schemaVersion:2,contentRevision:catalog.contentRevision,records:[],screens:[]};
 return {catalog,legacy,document:migrateFlowDocument(legacy,catalog)};
}
const interaction=(id,target,extra={})=>({interactionId:id,kind:'button',label:id,order:10,enabled:true,target,...extra});

test('real accepted export migrates every record and flag without mutation or asset loss',()=>{
 const catalog=createAuditCatalog(),legacy=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/annotations.json',import.meta.url),'utf8'));
 const before=JSON.stringify({catalog,legacy}),doc=migrateFlowDocument(legacy,catalog);
 assert.equal(legacy.records.length,73);assert.equal(legacy.screens.length,33);
 assert.equal(doc.tasks.length,15);assert.equal(doc.tasks.flatMap(t=>t.screens).length,84);
 const screens=new Map(doc.tasks.flatMap(t=>t.screens.map(s=>[s.screenId,s])));
 for(const r of legacy.records){
  const s=screens.get(r.screenId),i=s.interactions.find(i=>i.interactionId===r.actionId);
  assert.equal(s.assetId,r.assetId);assert.equal(s.assetSha256,r.assetSha256);
  assert.equal(i.kind,r.placement==='hotspot'?'hotspot':'button');
  if(r.placement==='hotspot')assert.deepEqual(i.rect,r.rect);else assert.equal(i.label,r.label);
 }
 for(const flag of legacy.screens){const s=screens.get(flag.screenId);assert.equal(s.enabled,flag.enabled);assert.equal(s.final,flag.final);}
 assert.equal(JSON.stringify({catalog,legacy}),before);
});

test('v1 migration preserves original text and manual navigation; return values are detached',()=>{
 const {catalog,legacy}=fixture();legacy.schemaVersion=1;delete legacy.screens;
 const doc=migrateFlowDocument(legacy,catalog),validated=validateFlowDocument(doc,catalog,{publish:true});
 assert.equal(doc.tasks[0].screens[0].help.text,'Help a');assert.equal(DEFAULT_AUTO_DELAY_MS,500);
 validated.tasks[0].screens[0].help.text='Changed';assert.equal(doc.tasks[0].screens[0].help.text,'Help a');
 assert.deepEqual(migrateFlowDocument(doc,catalog),doc);
});

test('legacy auto retains exact delay, disables manual action, reviewed auto becomes manual',()=>{
 const {catalog,legacy}=fixture();const screen=catalog.missions[0].tasks[0].screens[0];screen.automaticMs=0;
 let doc=migrateFlowDocument(legacy,catalog);let items=doc.tasks[0].screens[0].interactions;
 assert.equal(items[0].enabled,false);assert.equal(items[1].interactionId,'auto:a.go');assert.equal(items[1].delayMs,0);
 assert.throws(()=>validateFlowDocument(doc,catalog,{publish:true}),/положительной/);
 legacy.records.push({screenId:'a',assetId:'asset-a',assetSha256:hash,actionId:'a.go',label:'Go a',placement:'below-screen',reviewed:true});
 doc=migrateFlowDocument(legacy,catalog);items=doc.tasks[0].screens[0].interactions;
 assert.equal(items.length,1);assert.equal(items[0].enabled,true);assert.equal(items[0].kind,'button');
});

test('legacy final converts navigation while disabled screens remain explicitly in draft',()=>{
 const {catalog,legacy}=fixture();legacy.screens=[{taskId:'task',screenId:'a',assetId:'asset-a',assetSha256:hash,enabled:true,final:true},
 {taskId:'task',screenId:'b',assetId:'asset-b',assetSha256:hash,enabled:false,final:false}];
 const doc=migrateFlowDocument(legacy,catalog);assert.equal(doc.tasks[0].screens.length,2);
 assert.deepEqual(doc.tasks[0].screens[0].interactions[0].target,{kind:'complete-task'});
 validateFlowDocument(doc,catalog,{publish:true});
});

test('Ajv strict validation rejects unknown fields, coercion, non-finite geometry and limits without input mutation',()=>{
 const {catalog,document}=fixture();
 for(const mutate of [d=>{d.extra=true;},d=>{d.tasks[0].screens[0].enabled='true';},d=>{d.tasks[0].screens[0].interactions[0].rect[0]=NaN;},
 d=>{d.tasks[0].helpText='x'.repeat(10001);},d=>{d.tasks[0].screens[0].interactions[0].delayMs=2;}]){
  const doc=structuredClone(document);mutate(doc);const before=structuredClone(doc);assert.throws(()=>validateFlowDocument(doc,catalog));assert.deepEqual(doc,before);
 }
});

test('identity and provenance remain exact; silent omission rejected',()=>{
 const {catalog,document}=fixture();
 for(const mutate of [d=>{d.sourceContentRevision='other';},d=>{d.tasks[0].screens.pop();},d=>{d.tasks[0].screens[0].assetSha256='b'.repeat(64);},
 d=>{d.tasks[0].screens[0].interactions=[];},d=>{d.missions.push(d.missions[0]);}]){
  const doc=structuredClone(document);mutate(doc);assert.throws(()=>validateFlowDocument(doc,catalog));
 }
 const doc=structuredClone(document),s=doc.tasks[0].screens[0];s.interactions=[];s.deletedSourceActionIds=['a.go'];
 validateFlowDocument(doc,catalog);assert.throws(()=>validateFlowDocument(doc,catalog,{publish:true}),/Нет пути/);
});

test('draft accepts incomplete, disabled and missing destinations; publication blocks each',()=>{
 const {catalog,document}=fixture();
 for(const target of [null,{kind:'screen',screenId:'missing'}]){
  const doc=structuredClone(document);doc.tasks[0].screens[0].interactions[0].target=target;
  validateFlowDocument(doc,catalog);assert.throws(()=>validateFlowDocument(doc,catalog,{publish:true}));
 }
 const doc=structuredClone(document);doc.tasks[0].screens[1].enabled=false;validateFlowDocument(doc,catalog);
 assert.throws(()=>validateFlowDocument(doc,catalog,{publish:true}),/отключено/);
 doc.tasks[0].startScreenId='missing';assert.throws(()=>validateFlowDocument(doc,catalog,{publish:true}),/стартового/);
});

test('closed cycle fails through graphlib reachability, manual return with exit succeeds',()=>{
 const {catalog,document}=fixture();const screens=document.tasks[0].screens;
 screens[1].interactions[0].target={kind:'screen',screenId:'a'};
 assert.throws(()=>validateFlowDocument(document,catalog,{publish:true}),/Нет пути/);
 screens[1].interactions.push(interaction('exit',{kind:'complete-task'}));validateFlowDocument(document,catalog,{publish:true});
});

test('user screen target cannot impersonate the internal graph exit sentinel',()=>{
 const {catalog,document}=fixture();
 document.tasks[0].screens[0].interactions[0].target={kind:'screen',screenId:'__flow_exit__'};
 validateFlowDocument(document,catalog);
 assert.throws(()=>validateFlowDocument(document,catalog,{publish:true}),/Назначение отсутствует или отключено: __flow_exit__/);
});

test('two hotspots, two buttons and a timer may coexist with independent destinations',()=>{
 const {catalog,document}=fixture(),screen=document.tasks[0].screens[0];
 screen.interactions.push({...screen.interactions[0],interactionId:'second',rect:[50,80,20,20],target:{kind:'complete-task'}},
  interaction('back',{kind:'screen',screenId:'a'}),interaction('finish',{kind:'complete-task'}),
  {interactionId:'auto',kind:'timer',enabled:true,delayMs:500,target:{kind:'screen',screenId:'b'}});
 validateFlowDocument(document,catalog,{publish:true});
});

test('overlap with different outcome blocks publication; same outcome or disabled is allowed',()=>{
 const {catalog,document}=fixture(),screen=document.tasks[0].screens[0];
 screen.interactions.push({...screen.interactions[0],interactionId:'duplicate',rect:[5,5,20,20]});
 validateFlowDocument(document,catalog,{publish:true});
 screen.interactions[1].target={kind:'complete-task'};assert.throws(()=>validateFlowDocument(document,catalog,{publish:true}),/Перекрывающиеся/);
 screen.interactions[1].enabled=false;validateFlowDocument(document,catalog,{publish:true});
});

test('protected answers and incorrect effects remain locked but may have multiple UI copies',()=>{
 const {catalog,legacy}=fixture(),source=catalog.missions[0].tasks[0].screens[0];
 source.actions[0].outcome.answer={kind:'channel-type',value:'private'};
 source.actions.push({actionId:'wrong',label:'Wrong',placement:'below-screen',outcome:{kind:'incorrect'}});
 const doc=migrateFlowDocument(legacy,catalog),screen=doc.tasks[0].screens[0];
 assert.equal(screen.interactions[0].semanticRef,'a.go');assert.deepEqual(screen.interactions[0].target,{kind:'screen',screenId:'b'});
 assert.equal(screen.interactions[1].semanticRef,'wrong');assert.equal(screen.interactions[1].target,null);
 screen.interactions.push({...screen.interactions[0],interactionId:'copy',rect:[60,80,10,10]});validateFlowDocument(doc,catalog,{publish:true});
 for(const mutate of [i=>{delete i.semanticRef;},i=>{i.target={kind:'complete-task'};},i=>{i.semanticRef='wrong';}]){
  const broken=structuredClone(doc);mutate(broken.tasks[0].screens[0].interactions[0]);assert.throws(()=>validateFlowDocument(broken,catalog),/Смысловое|смысловой/);
 }
});

test('timer cycle awaits explicit review even when manual exit exists',()=>{
 const {catalog,document}=fixture();
 document.tasks[0].screens[0].interactions.push({interactionId:'loop',kind:'timer',enabled:true,delayMs:500,target:{kind:'screen',screenId:'a'}});
 validateFlowDocument(document,catalog);
 assert.throws(()=>validateFlowDocument(document,catalog,{publish:true}),{code:'FLOW_AUTO_CYCLE'});
});
