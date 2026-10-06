import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {Group,Mesh,MeshBasicMaterial,PlaneGeometry,Scene,Texture} from 'three';
import {objectContextPresence,taskContentPresence} from '../../service/public/max-panel-optics.js';

for(const profile of ['source','client','stand']){
 const dir=profile==='source'?new URL('../src/',import.meta.url):new URL(`../../../integration/current/code/${profile}/src/`,import.meta.url);
 const main=(await readFile(new URL('journey-guided-main.js',dir),'utf8')).replaceAll('\r\n','\n');
 const renderer=await readFile(new URL('journey-webgl-ui.mjs',dir),'utf8');
 const {sharedInstructionRetention,sharedInstructionBody}=await import(new URL('journey-shared-ui.mjs',dir));
 const {syncV5InstructionVisibility}=await import(new URL('journey-v5-ui-copy.mjs',dir));
 const {V5DeviceMorph}=await import(new URL('journey-v5-device-morph.mjs',dir));
 const {V5_MISSION_CATALOG:catalog}=await import(new URL('journey-v5-backend.mjs',dir));
 test(`${profile}: a full rebuild coinciding with retained-header body swap seeds only the new body owner`,()=>{
  const host={dataset:{instructionHeaderStable:'true',instructionBodyStable:'false',contentPresence:'0',popupPresence:'1',uiPresence:'1'},querySelector:()=>null};
  const scene=new Scene(),plane=new PlaneGeometry(1,1),texture=new Texture();
  const element=(copy=false,connected=true)=>({tagName:'P',isConnected:connected,dataset:{},style:{removeProperty(){}},childNodes:[],matches:selector=>copy?selector==='.instruction-copy':selector.includes('[data-task-content]'),hasAttribute:attribute=>!copy&&['data-instruction-body','data-task-content'].includes(attribute),closest:selector=>selector==='.journey-zone'?host:selector==='.instruction-copy'?copyOwner:selector==='[data-task-content]'?copyOwner:selector==='[data-instruction-body]'?copy?null:newBody:null,contains:()=>false,querySelector:()=>null});
  const copyOwner=element(true),oldBody=element(false,false),newBody=element();copyOwner.contains=part=>part===newBody;
  newBody.childNodes=[{nodeType:3,textContent:'Верифицируем организацию',length:23,parentElement:newBody}];
  const headerMaterial=new MeshBasicMaterial({map:texture,transparent:true,opacity:1}),oldMaterial=new MeshBasicMaterial({map:texture,transparent:true,opacity:0});headerMaterial.userData.el=copyOwner;oldMaterial.userData.el=oldBody;
  const headerGroup=new Group(),oldGroup=new Group();headerGroup.add(new Mesh(plane,headerMaterial));oldGroup.add(new Mesh(plane,oldMaterial));scene.add(headerGroup,oldGroup);
  const context={root:{children:[copyOwner],dataset:{},querySelectorAll:()=>[]},scene,groups:new Map([[copyOwner,{el:copyOwner,group:headerGroup,version:''}],[oldBody,{el:oldBody,group:oldGroup,version:''}]]),materials:[headerMaterial,oldMaterial],pendingParts:new Set([newBody]),partsDirty:true,previousGroups:new Map(),retained:new Set(),retiredMaterials:[],used:new Set(),cache:new Map(),warmPhoneKeys:new Set(),startupTextureKeys:new Set(),preparedDeviceKeys:new Set(),navigation:new Map(),sizeSnapHosts:new Set(),introBurst:{attach(){}},motions:{prune(){}},reportResidency(){},births:new WeakMap(),time:0,THREE:{Group},Node:{TEXT_NODE:3,ELEMENT_NODE:1},getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1'}),rect:()=>({x:0,y:0,w:708,h:80}),
   movingSelector:renderer.match(/const movingSelector='([^']+)'/)[1],surfaceSelector:renderer.match(/const surfaceSelector='([^']+)'/)[1],
   text(node,parent){const m=new MeshBasicMaterial({map:texture,transparent:true,opacity:1}),mesh=new Mesh(plane,m);mesh.userData.textRun=node.textContent;context.materials.push(m);parent.add(mesh);}};
  const visitSource=renderer.slice(renderer.indexOf(' function visit('),renderer.indexOf(' function backTarget(')),rebuildSource=renderer.slice(renderer.indexOf(' function rebuild(){'),renderer.indexOf(' function rebuildParts(){'));
  const rebuild=runInNewContext(`${visitSource};${rebuildSource};rebuild`,context);rebuild();
  assert.equal(context.groups.get(copyOwner).group,headerGroup);assert.equal(headerGroup.children[0].material,headerMaterial);assert.equal(oldGroup.parent,null);assert.ok(!context.materials.includes(oldMaterial));assert.ok(context.retiredMaterials.includes(oldMaterial));
  const current=context.groups.get(newBody);assert.ok(current?.group.parent);assert.equal(current.group.children.length,1);assert.equal(current.group.children[0].material.userData.el,newBody);assert.equal(current.group.children[0].userData.textRun,'Верифицируем организацию');
  assert.equal(context.materials.length,2);assert.equal(context.groups.size,2);
  const alphaStart=renderer.indexOf('   for(const m of materials){',renderer.indexOf('   // Suppress a covered')),alphaSource=renderer.slice(alphaStart,renderer.indexOf('   scene.traverse(mesh=>',alphaStart));
  Object.assign(context,{objectContextPresence,taskContentPresence,contentTransitions:new Map(),feedbacks:new Map(),bfmVisual:false});const alpha=runInNewContext(`()=>{${alphaSource}}`,context);alpha();assert.equal(headerMaterial.opacity,1);assert.equal(current.group.children[0].material.opacity,0);
  host.dataset.contentPresence='1';alpha();assert.equal(headerMaterial.opacity,1);assert.equal(current.group.children[0].material.opacity,1);
  for(const m of [...context.materials,...context.retiredMaterials])m.dispose();plane.dispose();texture.dispose();
 });
 for(const hz of [30,60,120])test(`${profile}: same task heading retains DOM and material visibility through body swap at ${hz}Hz`,()=>{
  const task=catalog.tasks['business.platform'],oldText=task.screens['business.platform.profile'].instruction,newText=task.screens['business.platform.verification'].instruction;
  const host={dataset:{contentPresence:'1',popupPresence:'1',uiPresence:'1'},querySelector:()=>popup};
  const eyebrow={textContent:'ВОЗМОЖНОСТИ MAX'},title={textContent:task.title};
  const instruction={hidden:false,style:{},querySelector:()=>copy,getBoundingClientRect:()=>({height:200})};
  const copy={scrollHeight:147,currentBody:null,querySelector:selector=>selector==='.eyebrow'?eyebrow:selector==='h2'?title:copy.currentBody,replaceWith:()=>assert.fail('the immutable heading owner must survive'),matches:selector=>selector==='.instruction-copy',hasAttribute:()=>false,closest:selector=>selector==='.journey-zone'?host:null,contains:part=>part===copy.currentBody};
  const node=text=>({textContent:text,isConnected:true,parentElement:copy,hasAttribute:name=>name==='data-instruction-body',contains:()=>false,replaceWith(next){this.isConnected=false;copy.currentBody=next;next.parentElement=copy;}});
  const oldBody=node(oldText),newBody=node(newText);copy.currentBody=oldBody;
  const phone={replaceWith(){}},freshInstruction={hidden:false};
  const popup={dataset:{task:task.taskId},querySelector:selector=>selector==='.instruction'?instruction:selector==='.instruction-copy'?copy:selector==='.instruction-copy p'?copy.currentBody:phone};
  const fresh={querySelector:selector=>selector==='.instruction'?freshInstruction:selector==='.instruction-copy p'?newBody:phone};
  const controller={current:{step:task.taskId},steps:[{id:task.taskId,label:task.title}],session:{task:task.taskId,screen:'field'},phoneContentKey:'next',displaySnapshot:{state:{status:'task'},view:{instruction:{text:newText}}}};
  const parts=[];
  const context={controller,owner:controller,screenEpoch:0,epoch:0,popupContentToken:()=> 'next',preview:null,displayTask:task.taskId,token:'next',popupToken:'previous',inlinePhone:true,sharedBackend:true,bfmVisual:true,referenceVisual:false,host,
   sharedInstructionRetention,sharedInstructionBody,syncV5InstructionVisibility,document:{createElement:()=>({content:{firstElementChild:fresh},set innerHTML(value){}})},popupMarkup:()=>'',getComputedStyle:()=>({top:'100',paddingTop:'26',paddingBottom:'26'}),arena:{getBoundingClientRect:()=>({width:3200})},size:{width:3200},v5InstructionTop:h=>String(h),changed(){},foreground:{refreshParts:items=>parts.push(...items),refreshPart:()=>assert.fail('same-header updates must retain the whole header owner'),resizeInstruction(){},cancelInstruction(){},invalidate(){}}};
  const syncSource=main.slice(main.indexOf('function syncInstructionRetention(){'),main.indexOf('function syncLinePhone(){'));
  const sync=runInNewContext(`${syncSource};syncInstructionRetention`,context);sync();
  assert.equal(host.dataset.instructionHeaderStable,'true');assert.equal(host.dataset.instructionBodyStable,'false');
  const start=main.indexOf(' const commit=()=>{',main.indexOf('function syncPopup()'))+' const commit=()=>{'.length,end=main.indexOf('\n };\n if(old',start);
  const commit=runInNewContext(`()=>{${main.slice(start,end)}}`,context);
  const alphaStart=renderer.indexOf('   for(const m of materials){',renderer.indexOf('   // Suppress a covered'));
  const alphaSource=renderer.slice(alphaStart,renderer.indexOf('   scene.traverse(mesh=>',alphaStart));
  const owner=(el,body=false)=>{el.closest=selector=>selector==='[hidden]'?(instruction.hidden?instruction:null):selector==='.journey-zone'?host:selector==='.instruction-copy'||selector==='[data-task-content]'?copy:selector==='[data-instruction-body]'?(body?el:null):selector==='.context-popup,.picker'?popup:null;el.matches=()=>false;return el;};
  owner(eyebrow);owner(title);owner(oldBody,true);owner(newBody,true);
  const material=el=>{const m=new MeshBasicMaterial({transparent:true,opacity:1});Object.assign(m.userData,{el,baseOpacity:1,fade:1});return m;};
  const eyebrowMaterial=material(eyebrow),titleMaterial=material(title),bodyMaterial=material(oldBody),materials=[eyebrowMaterial,titleMaterial,bodyMaterial];
  const alpha=runInNewContext(`()=>{${alphaSource}}`,{materials,groups:new Map(),objectContextPresence,taskContentPresence,contentTransitions:new Map(),feedbacks:new Map(),bfmVisual:false});
  const dyStart=renderer.indexOf("    }else if(el.matches('[data-task-content]')){")+"    }else if(el.matches('[data-task-content]')){".length;
  const dySource=renderer.slice(dyStart,renderer.indexOf("    }else if(el.matches('.field-success'))",dyStart));
  const displacement=el=>runInNewContext(`(()=>{let dy;${dySource};return dy;})()`,{el,reduced:{matches:false}});
  const morph=new V5DeviceMorph();let committed=0;
  morph.start(()=>{assert.equal(morph.value,0);host.dataset.contentPresence='0';commit();bodyMaterial.userData.el=newBody;committed++;sync();assert.equal(host.dataset.instructionBodyStable,'false','reentrant sync cannot expose the newly swapped body before entrance');},false,{from:392,to:392});
  for(let frame=0;frame<hz*3&&morph.busy;frame++){
   if(frame===Math.floor(hz*.2)){const alphaBefore=morph.value;morph.tick(0);assert.equal(morph.value,alphaBefore);}
   morph.tick(1/hz);host.dataset.contentPresence=String(morph.value);host.dataset.contentPhase=morph.phase;alpha();
   assert.equal(eyebrowMaterial.opacity,1);assert.equal(titleMaterial.opacity,1);assert.equal(bodyMaterial.opacity,morph.value);
   assert.equal(popup.querySelector('.instruction-copy'),copy);assert.equal(copy.querySelector('h2'),title);
   assert.equal(copy.querySelector('p'),committed?newBody:oldBody);
   assert.equal(displacement(copy),0);assert.equal(displacement(committed?newBody:oldBody),(morph.phase==='out'?-5:7)*(1-morph.value));
  }
  assert.equal(committed,1);assert.equal(morph.busy,false);assert.equal(bodyMaterial.opacity,1);assert.ok(parts.includes(newBody));assert.ok(!parts.includes(copy));
  const affectedSource=renderer.match(/  const affected=[^\r\n]+/)[0];
  const affected=runInNewContext(`${affectedSource};affected`,{changedParts:[newBody]});assert.equal(affected(copy),false,'full rebuild must retain the immutable header group');
  assert.equal(sharedInstructionRetention(popup,{taskId:task.taskId,title:task.title,body:newText}).body,true);
  assert.equal(sharedInstructionRetention(popup,{taskId:'different-task',title:task.title,body:newText}).header,false);
  assert.equal(sharedInstructionRetention(popup,{taskId:task.taskId,title:'Другая возможность',body:newText}).header,false);
  assert.equal(sharedInstructionRetention(popup,{taskId:task.taskId,title:task.title,body:''}).header,false);
  controller.steps[0].label='Другая возможность';sync();assert.equal(host.dataset.instructionHeaderStable,'false');assert.equal(host.dataset.instructionBodyStable,'false');
  host.dataset.contentPresence='0';alpha();assert.ok(materials.every(m=>m.opacity===0));assert.equal(displacement(newBody),0,'a changing header owns the whole copy displacement once');
  controller.steps[0].label=task.title;controller.displaySnapshot.view.instruction.text='';sync();assert.equal(host.dataset.instructionHeaderStable,'false');assert.equal(host.dataset.instructionBodyStable,'false');
  instruction.hidden=true;alpha();assert.ok(materials.every(m=>m.opacity===0));
  instruction.hidden=false;controller.displaySnapshot.view.instruction.text=newText;sync();assert.equal(host.dataset.instructionHeaderStable,'true');assert.equal(host.dataset.instructionBodyStable,'true');alpha();assert.ok(materials.every(m=>m.opacity===1),'unchanged header and body remain stable during a phone-only transition');
  controller.current.step='different-task';controller.steps.push({id:'different-task',label:task.title});sync();assert.equal(host.dataset.instructionHeaderStable,'false');assert.equal(host.dataset.instructionBodyStable,'false');alpha();assert.ok(materials.every(m=>m.opacity===0));
  for(const m of materials)m.dispose();
 });
}
