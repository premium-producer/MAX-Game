import {isIdTask,ID_FLOW_VERSION,idAdvance,restoreIdObject} from './journey-id.mjs';
import {taskFor,tasksFor} from './journey-tasks.mjs';
import {routeSlots,routeChoices,routeAssignments,routeValid} from './journey-topology.mjs';
export function freshSession(){return {screen:'cta',mission:null,branch:null,branchChosen:false,runs:{},starts:{},plans:{},briefs:{},completed:[],task:null,picker:null,notice:''};}
export function stepsFor(content,id,branch=null){const m=content.missions.find(m=>m.id===id);return m?[...m.steps,...(m.branches?.some(b=>b.id===branch)?[m.branches.find(b=>b.id===branch).step]:[])]:[];}
export function runKey(s){return s.mission;}
export function objects(s){return s.runs[runKey(s)]||[];}
export function routeStart(s){return s.starts?.[s.mission]||null;}
export function unlocked(s,step){return (step?.requires||[]).every(id=>objects(s).some(o=>o.step===id&&o.done));}
export function availableSteps(s,content){return stepsFor(content,s.mission,s.branch).filter(step=>unlocked(s,step));}
export function routePhase(s){return s.plans?.[s.mission]||'building';}
export function planningSteps(s,content){return stepsFor(content,s.mission,s.branch).filter(step=>content.edition==='client'||(step.requires||[]).every(id=>objects(s).some(o=>o.step===id)));}
export function routePlanned(s,content){const m=content.missions.find(m=>m.id===s.mission);return Boolean(m&&(!m.branches||s.branch)&&stepsFor(content,s.mission,s.branch).every(step=>objects(s).some(o=>o.step===step.id))&&(content.edition!=='client'||routeValid(s)));}
export function canChooseBusiness(s,content){return s.screen==='field'&&s.mission==='business'&&objects(s).some(o=>o.step==='account'&&o.done)&&(content?.edition==='client'||objects(s).some(o=>o.step==='sector'&&o.done));}
export function canPlanBusiness(s,content){return s.screen==='field'&&s.mission==='business'&&(content?.edition==='client'?['account']:['sector','account']).every(id=>objects(s).some(o=>o.step===id));}
export function needsBusinessChoice(s,content){return canPlanBusiness(s,content)&&!s.branch;}
export function hasAvailableObjects(s,content){return routePhase(s)!=='ready'&&(content.edition==='client'?routeSlots(s).length>0:needsBusinessChoice(s,content)||planningSteps(s,content).some(step=>!objects(s).some(o=>o.step===step.id)));}
export function availabilityHint(s,content){
 const pending=availableSteps(s,content).find(step=>objects(s).some(o=>o.step===step.id&&!o.done));
 return pending?`Сначала выполните задание «${pending.label}»`:'Все объекты уже на поле';
}
export function showMissionCTA(s,content){return s.screen==='field'&&!s.picker&&!s.task&&!routeStart(s)&&!stepsFor(content,s.mission,s.branch).some(step=>objects(s).some(o=>o.step===step.id));}
export function isDone(s,content){const m=content.missions.find(m=>m.id===s.mission);if(!m||m.branches&&!s.branch)return false;const placed=objects(s);return stepsFor(content,s.mission,s.branch).every(step=>placed.some(o=>o.step===step.id&&o.done));}
export function reduce(s,a,content){
 const n=structuredClone(s);n.notice='';
 switch(a.type){
 case 'START': n.screen='missions';break;
 case 'MENU':n.screen='missions';n.task=null;n.picker=null;break;
 case 'MISSION':if(!content.missions.some(m=>m.id===a.id))return s;n.mission=a.id;n.screen='field';n.task=null;n.picker=null;n.runs[a.id]??=[];break;
 case 'BEGIN_ROUTE':{
  if(n.screen!=='field'||n.task||routeStart(n)||objects(n).length||!Number.isFinite(a.x)||!Number.isFinite(a.y)||!stepsFor(content,n.mission,n.branch).length)return s;
  n.starts??={};n.starts[n.mission]={step:'open-max',x:Math.max(0,Math.min(1,a.x)),y:Math.max(0,Math.min(1,a.y))};
  n.plans??={};n.plans[n.mission]=routePlanned(n,content)?'ready':'building';n.picker=null;
  break;
 }
 case 'BRIEF_DONE':if(content.edition!=='client'||n.task!=='open-max')return s;n.briefs??={};n.briefs[n.mission]=true;n.task=null;break;
 case 'CONTINUE_ROUTE':if(n.screen!=='field'||n.picker||routePhase(n)!=='ready'||!routePlanned(n,content))return s;n.plans[n.mission]='playing';break;
 case 'EDIT':{
  if(content.edition!=='client'||n.screen!=='field'||routePhase(n)==='playing'||n.task||n.picker)return s;
  const o=objects(n).find(o=>o.step===a.step);if(!o)return s;
  n.picker={x:o.x,y:o.y,slot:routeAssignments(n)[o.step],replace:o.step};
  const choices=routeChoices(n,o.step);if(choices.length===1)return reduce(n,{type:'PLACE',step:choices[0]},content);break;
 }
 case 'SWAP':{
  if(content.edition!=='client'||n.screen!=='field'||routePhase(n)==='playing'||n.task||n.picker)return s;
  const a1=objects(n).find(o=>o.step===a.step),a2=objects(n).find(o=>o.step===a.target);if(!a1||!a2||a1===a2)return s;
  const slots=routeAssignments(n),p={x:a1.x,y:a1.y};a1.slot=slots[a2.step];a2.slot=slots[a1.step];a1.x=a2.x;a1.y=a2.y;Object.assign(a2,p);
  a1.freePosition=true;a2.freePosition=true;
  n.plans[n.mission]=routePlanned(n,content)?'ready':'building';break;
 }
 case 'REVEAL':{
  const slot=routeSlots(n).find(v=>v.id===a.slot);
  if(content.edition!=='client'||!slot||slot.allowed.length!==1||n.picker||n.task||n.screen!=='field')return s;
  const picked=reduce(n,{type:'PICK',slot:a.slot,x:a.x,y:a.y},content);if(picked===n)return s;
  return reduce(picked,{type:'PLACE',step:slot.allowed[0]},content);
 }
 case 'PICK':if(n.screen!=='field'||n.task||!routeStart(n)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||!hasAvailableObjects(n,content))return s;
  if(content.edition==='client'&&a.slot&&!routeSlots(n).some(slot=>slot.id===a.slot))return s;
  n.picker={x:a.x,y:a.y,...(a.slot?{slot:a.slot}:{})};break;
 case 'CLOSE':n.task=null;n.picker=null;break;
 case 'PLACE':{
  if(content.edition==='client'){
   if(n.screen!=='field'||!n.picker||n.task||routePhase(n)==='playing'||!routeChoices(n,n.picker.replace).includes(a.step))return s;
   const assigned=routeAssignments(n),old=objects(n).find(o=>o.step===n.picker.replace),existing=objects(n).find(o=>o.step===a.step);
   const slot=old?{id:assigned[old.step]}:routeSlots(n).find(v=>v.id===n.picker.slot)||(!n.picker.slot?routeSlots(n)[0]:null);if(!slot)return s;
   if(existing){if(!old)return s;old.slot=assigned[existing.step];existing.slot=slot.id;const p={x:old.x,y:old.y};old.x=existing.x;old.y=existing.y;Object.assign(existing,p);old.freePosition=true;existing.freePosition=true;}
   else {
    if(old)n.runs[n.mission]=objects(n).filter(o=>o!==old);
    n.runs[n.mission].push({step:a.step,freePosition:true,...(isIdTask(a.step)?{idFlowVersion:ID_FLOW_VERSION}:{}),slot:slot.id,x:Math.max(0,Math.min(1,n.picker.x)),y:Math.max(0,Math.min(1,n.picker.y)),done:false,stage:0,answers:[]});
   }
   if(n.mission==='business'){n.branch=objects(n).find(o=>o.step.startsWith('business-'))?.step.slice(9)||null;n.branchChosen=Boolean(n.branch);}
   n.picker=null;n.plans[n.mission]=routePlanned(n,content)?'ready':'building';break;
  }
  const slot=content.edition==='client'&&n.picker?.slot?routeSlots(n).find(slot=>slot.id===n.picker.slot):null;
  if(n.picker?.slot&&content.edition==='client'&&(!slot||!slot.allowed.includes(a.step)))return s;
  if(a.branch){
   const branch=content.missions.find(m=>m.id===n.mission)?.branches?.find(b=>b.id===a.branch&&b.step.id===a.step);
   if(!n.picker||!canPlanBusiness(n,content)||!branch)return s;
   n.branch=branch.id;n.branchChosen=true;
  }
  if(n.screen!=='field'||!n.picker||!planningSteps(n,content).some(o=>o.id===a.step)||objects(n).some(o=>o.step===a.step))return s;
  n.runs[n.mission].push({step:a.step,...(isIdTask(a.step)?{idFlowVersion:ID_FLOW_VERSION}:{}),x:Math.max(0,Math.min(1,n.picker.x)),y:Math.max(0,Math.min(1,n.picker.y)),...(slot?{slot:slot.id}:{}),done:false,stage:0,answers:[]});n.picker=null;
  if(routePlanned(n,content)){n.plans??={};n.plans[n.mission]='ready';}break;
 }
 case 'OPEN':
  if(content.edition==='client'&&n.screen==='field'&&a.step==='open-max'&&routeStart(n)){n.task='open-max';n.picker=null;break;}
  if(n.screen!=='field'||routePhase(n)!=='playing'||!objects(n).some(o=>o.step===a.step)||!availableSteps(n,content).some(step=>step.id===a.step))return s;n.task=a.step;n.picker=null;break;
 case 'MOVE':{
  if(n.screen!=='field'||content.edition!=='client'&&routePhase(n)!=='playing'||n.task||n.picker||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.step!=='open-max'&&!stepsFor(content,n.mission,n.branch).some(o=>o.id===a.step))return s;
  const o=a.step==='open-max'?routeStart(n):objects(n).find(o=>o.step===a.step);if(!o)return s;
  o.x=Math.max(0,Math.min(1,a.x));o.y=Math.max(0,Math.min(1,a.y));o.freePosition=true;break;
 }
 case 'ANSWER':{
  const o=objects(n).find(o=>o.step===n.task),task=o&&taskFor(o,content);
  if(routePhase(n)!=='playing'||!task||o.done||!availableSteps(n,content).some(step=>step.id===o.step)||!Number.isInteger(a.choice)||!task.options[a.choice])return s;
  if(task.correct!=='*'&&a.choice!==task.correct){n.notice=task.rejectNotice||'Попробуй другое действие';break;}
  o.answers??=[];o.answers[o.stage]=a.choice;
  if(isIdTask(o.step)&&o.stage===6&&a.choice===1)o.answers[7]=0;
  o.stage=isIdTask(o.step)?idAdvance(o.stage,a.choice):o.stage+1;if(isIdTask(o.step))o.idFlowVersion=ID_FLOW_VERSION;if(o.stage===tasksFor(content)[o.step].length){o.done=true;if(content.edition!=='client')n.task=null;}
  if(isDone(n,content)){if(!n.completed.includes(n.mission))n.completed.push(n.mission);n.task=null;}break;
 }
 case 'BRANCH':if(!(n.picker&&canPlanBusiness(n,content)||canChooseBusiness(n,content))||!['channel','bot','store'].includes(a.branch))return s;n.branch=a.branch;n.branchChosen=true;n.task=null;n.plans??={};if(!routePlanned(n,content))n.plans[n.mission]='building';break;
 case 'FINAL':if(!content.missions.filter(m=>!m.presentation).every(m=>n.completed.includes(m.id)))return s;n.screen='final';n.task=null;n.picker=null;break;
 case 'RESET':return freshSession();
 default:return s;
 }return n;
}
export function restoreSession(value,content){
 const TASKS=tasksFor(content);
 try{const s=JSON.parse(value);if(s.version!==1)return freshSession();const n=freshSession();n.branch=['channel','bot','store'].includes(s.branch)?s.branch:null;
 for(const m of content.missions){const allowed=[...m.steps,...(m.branches||[]).map(b=>b.step)];n.runs[m.id]=[];for(const savedObject of s.runs?.[m.id]||[]){const o=restoreIdObject(savedObject);if(!allowed.some(x=>x.id===o.step)||n.runs[m.id].some(x=>x.step===o.step)||!Number.isFinite(o.x)||!Number.isFinite(o.y))continue;const total=TASKS[o.step].length;const stage=Math.max(0,Math.min(total,Math.floor(Number(o.stage)||0)));n.runs[m.id].push({step:o.step,...(o.freePosition===true?{freePosition:true}:{}),...(isIdTask(o.step)?{idFlowVersion:ID_FLOW_VERSION}:{}),x:Math.max(0,Math.min(1,o.x)),y:Math.max(0,Math.min(1,o.y)),stage,...(typeof o.slot==='string'?{slot:o.slot}:{}),done:stage===total,answers:TASKS[o.step].slice(0,stage).map((t,i)=>Number.isInteger(o.answers?.[i])&&t.options[o.answers[i]]!==undefined&&(t.correct==='*'||t.correct===o.answers[i])?o.answers[i]:t.correct==='*'?0:t.correct)});}}
 for(const m of content.missions){n.mission=m.id;const steps=[...m.steps,...(m.branches||[]).map(b=>b.step)];for(let pass=0;pass<steps.length;pass++)for(const step of steps){const o=objects(n).find(o=>o.step===step.id);if(o&&!unlocked(n,step)){o.stage=0;o.done=false;o.answers=[];}}}
 for(const m of content.missions){n.mission=m.id;if(m.branches){if(m.branches.some(b=>{n.branch=b.id;return isDone(n,content);} ))n.completed.push(m.id);}else if(isDone(n,content))n.completed.push(m.id);}
 n.branchChosen=s.branchChosen===true||(n.runs.business||[]).some(o=>o.step==='business-'+s.branch);n.branch=n.branchChosen&&['channel','bot','store'].includes(s.branch)?s.branch:null;
 for(const m of content.missions){n.mission=m.id;const phase=s.plans?.[m.id];n.plans[m.id]=phase==='playing'||!phase&&objects(n).some(o=>o.stage>0)?'playing':routePlanned(n,content)?'ready':'building';}
 for(const m of content.missions){
  const saved=s.starts?.[m.id],first=n.runs[m.id][0];
  if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))n.starts[m.id]={step:'open-max',...(saved.freePosition===true?{freePosition:true}:{}),x:Math.max(0,Math.min(1,saved.x)),y:Math.max(0,Math.min(1,saved.y))};
  else if(first)n.starts[m.id]={step:'open-max',x:Math.max(0,first.x-.18),y:first.y};
 }
 n.briefs=Object.fromEntries(content.missions.filter(m=>s.briefs?.[m.id]===true).map(m=>[m.id,true]));
 n.mission=null;return n;
 }catch{return freshSession();}
}
