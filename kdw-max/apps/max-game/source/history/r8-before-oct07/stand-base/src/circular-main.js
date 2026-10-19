import {createWebGLField} from './webgl-field.js';
import {loadMissionCatalog,parseMissionCatalog,serializeMissionCatalog} from './mission-config.mjs';
import {configureMissions,ITEM_TYPES,OBJECT_SETTINGS} from './mission-game.mjs';
import {evaluateMission} from './mission-evaluation.mjs';
import {PreparedAssets,collectAssetSources,prepareFonts} from './asset-preparation.mjs';
import {loadEarthContours} from './earth-contours.mjs';
import {loadUiShellConfig} from './ui-shell-config.mjs';
import {WALL,INTERACTION_BAND,CIRCLES,setZoneLayout,zoneContains,zoneSignalScale,newZone,circleMission,insideCircle,placeInZone,moveInZone,removeInZone,updateZoneHold} from './circle-model.mjs';

const arena=document.querySelector('#arena'),world=document.querySelector('#world'),ui=document.querySelector('#circles'),status=document.querySelector('#loading');
let field,assets,catalog,content,paused=false,gestureZone=null,selectedZone=null,preview=null,signature='',lastFrame=0;
let layoutMode=new URLSearchParams(location.search).get('layout')==='single'?'single':'two';
setZoneLayout(layoutMode);
const sessions=new Map();
let zones=CIRCLES.map((c,i)=>newZone(i));
let endpoints={},viewMission={number:0,endpoints},allPlacements=[],lastNetwork={states:{},links:[]};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function glassChanged(){document.documentElement.dataset.glassRevision=String(Number(document.documentElement.dataset.glassRevision||0)+1);}
function fit(){const scale=Math.min(innerWidth/WALL.width,innerHeight/WALL.height);arena.style.transform=`translate(-50%,-50%) scale(${scale})`;field?.resize();for(const z of zones)z.hold=null;glassChanged();}
function sourceFor(z){return content.missions.find(m=>m.number===z.mission);}
function stepsFor(z){const m=sourceFor(z);return [...m.steps,...(m.branches?[m.branches.find(b=>b.id===z.branch).step]:[])];}
function missionFor(z){return circleMission(catalog.byNumber[z.mission],z.index);}
function syncScene(){
 endpoints={};allPlacements=[];
 for(const z of zones){if(!z.mission)continue;const m=missionFor(z);for(const [id,p] of Object.entries(m.endpoints))endpoints[`z${z.index}-${id}`]=p;
 allPlacements.push(...z.placements.map(p=>({...p,...(preview?.id===p.id?preview.geo:{}),signalRadius:OBJECT_SETTINGS[p.type].signalRadius*zoneSignalScale(z.index)})));}
 viewMission={number:0,endpoints};signature='';
 field?.update({placements:allPlacements,endpoints,network:lastNetwork,selectedItem:selectedZone===null?null:zones[selectedZone].selected});
 field?.setTapControls({enabled:true,selectedId:selectedZone===null?null:zones[selectedZone].selectedId});
}
function renderZone(i){
 glassChanged();
 const z=zones[i],c=CIRCLES[i],host=ui.children[i];
 host.dataset.screen=z.mission?'mission':'menu';host.dataset.complete=String(z.complete);
 if(!z.mission){host.innerHTML=`<div class="circle-copy"><span class="eyebrow">${i+1} / ВОЗМОЖНОСТИ MAX</span><h2>Выбери миссию</h2><p>Собери свой маршрут</p></div><div class="mission-choices">${content.missions.map(m=>`<button data-mission="${m.number}"><span>${m.number}</span><strong>${escape(m.title)}</strong></button>`).join('')}</div>`;return;}
 const m=sourceFor(z),steps=stepsFor(z),types=catalog.byNumber[z.mission].topology.paths[0].steps.map(s=>s.type);
 host.innerHTML=`<div class="circle-copy"><button class="back" data-menu>← Миссии</button><h2>${escape(m.title)}</h2><p>${escape(m.description)}</p>${m.branches?`<div class="branches" role="group" aria-label="Инструмент продвижения">${m.branches.map(b=>`<button data-branch="${b.id}" aria-pressed="${b.id===z.branch}">${escape(b.label)}</button>`).join('')}</div>`:''}</div>
 <div class="circle-actions">${z.complete?`<p class="success">Маршрут собран</p><p class="result">${escape(m.result)}</p><button class="repeat" data-restart>Ещё раз</button>`:`<p class="hint">${z.selectedId?'Перемести узел тапом по полю':z.selected?'Коснись поля между А и Б':'Выбери действие → коснись поля'}</p><div class="inventory">${steps.map((step,n)=>`<button data-type="${types[n]}" aria-label="${escape(step.label)}" aria-pressed="${z.selected===types[n]}" ${z.placements.some(p=>p.type===types[n])?'disabled':''}><b>${n+1}</b><span>${escape(step.label)}</span></button>`).join('')}</div><div class="tools"><button data-restart>Заново</button>${z.selectedId?'<button data-remove>Убрать узел</button>':''}</div>`}</div>`;
 host.dataset.complete=String(z.complete);
}
function render(){zones.forEach((z,i)=>renderZone(i));}
function choose(index,number){zones[index]=newZone(index,number);if(selectedZone===index)selectedZone=null;preview=null;renderZone(index);syncScene();}
function commit(index,next){if(next===zones[index])return;zones[index]=next;preview=null;renderZone(index);syncScene();}
function onFrame(){
 if(!field||paused||document.hidden)return;
 const now=Date.now();if(now-lastFrame<33)return;lastFrame=now;
 const run={mission:0,placements:allPlacements};
 const full=field.captureConnections(run,viewMission,null,now,false,WALL.width);
 const network={states:{},links:[]};
 for(let i=0;i<zones.length;i++){
  const z=zones[i];if(!z.mission)continue;
  const m=missionFor(z),placements=allPlacements.filter(p=>Math.floor(p.id/100000)===i+1);
  const nodes={};for(const p of placements)if(full.nodes[p.id])nodes[p.id]=full.nodes[p.id];
  for(const name of ['A','B'])if(full.nodes[`endpoint:z${i}-${name}`])nodes[`endpoint:${name}`]=full.nodes[`endpoint:z${i}-${name}`];
  const snapshot={...full,mission:z.mission,placements,nodes,interacting:gestureZone===i&&full.interacting};
  const result=evaluateMission(m,placements,OBJECT_SETTINGS,now,350,snapshot);
  const next=updateZoneHold(z,snapshot,result,now,paused||gestureZone===i||Boolean(preview&&Math.floor(preview.id/100000)===i+1));
  zones[i]=next;if(next.complete!==z.complete){if(selectedZone===i)selectedZone=null;renderZone(i);}
  Object.assign(network.states,result.states);
  network.links.push(...result.links.map(l=>({...l,a:String(l.a).startsWith('endpoint:')?`endpoint:z${i}-${String(l.a).slice(9)}`:l.a,b:String(l.b).startsWith('endpoint:')?`endpoint:z${i}-${String(l.b).slice(9)}`:l.b})));
 }
 const key=JSON.stringify([network.states,network.links.map(l=>[l.a,l.b,l.correct])]);
 if(key!==signature){signature=key;lastNetwork=network;field.update({placements:allPlacements,network,endpoints,selectedItem:selectedZone===null?null:zones[selectedZone].selected});}
}
ui.addEventListener('click',event=>{
 if(paused)return;const host=event.target.closest('[data-zone]');if(!host)return;const i=Number(host.dataset.zone),z=zones[i],b=event.target.closest('button');if(!b)return;
 if(b.dataset.mission){choose(i,Number(b.dataset.mission));return;}
 if(b.hasAttribute('data-menu')){choose(i,null);return;}
 if(b.hasAttribute('data-restart')){choose(i,z.mission);return;}
 if(b.hasAttribute('data-remove')){commit(i,removeInZone(z,z.selectedId));return;}
 if(b.dataset.branch){const source=sourceFor(z);if(!source.branches?.some(v=>v.id===b.dataset.branch))return;const type=catalog.byNumber[z.mission].topology.paths[0].steps.at(-1).type;commit(i,{...z,branch:b.dataset.branch,complete:false,hold:null,selected:null,selectedId:null,placements:z.placements.filter(p=>p.type!==type)});return;}
 if(b.dataset.type&&!b.disabled){selectedZone=i;z.selected=z.selected===b.dataset.type?null:b.dataset.type;z.selectedId=null;z.hold=null;renderZone(i);syncScene();}
});
window.addEventListener('pointerdown',event=>{
 if(paused)return;const rect=arena.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*WALL.width,y=(event.clientY-rect.top)/rect.height*WALL.height;
 gestureZone=CIRCLES.findIndex(c=>zoneContains(c.index,x,y));if(gestureZone<0)gestureZone=null;
 if(gestureZone!==null&&zones[gestureZone].mission&&selectedZone!==gestureZone){selectedZone=gestureZone;syncScene();}
},true);
window.addEventListener('pointerup',()=>{gestureZone=null;});
function cancel(){field?.cancelPointer();gestureZone=null;preview=null;for(const z of zones)z.hold=null;syncScene();}
window.addEventListener('pointercancel',cancel);
window.addEventListener('max-service-pointer-cancel',cancel);
window.addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='max-service-state')return;if(['two','single'].includes(event.data.layoutMode))switchLayout(event.data.layoutMode);paused=event.data.playing===false;if(paused)cancel();field?.setServicePaused(paused);document.documentElement.dataset.servicePaused=String(paused);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
window.addEventListener('resize',fit);
window.addEventListener('keydown',event=>{if(event.key==='Escape'){selectedZone=null;zones.forEach(z=>{z.selected=null;z.selectedId=null;});render();cancel();}});

function mountZones(){
 document.documentElement.dataset.layout=layoutMode;
 const back=document.querySelector('#glass');back.replaceChildren();ui.replaceChildren();
 for(const c of CIRCLES){
  const rect=`left:${c.left}px;top:${c.top}px;width:${c.w}px;height:${c.h}px`;
  const glass=document.createElement('div');glass.className='glass';glass.style.cssText=rect;
  // Four glass shapes total in the dual layout; three in the single layout.
  glass.innerHTML=Array.from({length:layoutMode==='single'?3:2},(_,n)=>`<i class="glass-orb orb-${n+1}"></i>`).join('');back.append(glass);
  const host=document.createElement('section');host.dataset.zone=c.index;host.className='circle';host.setAttribute('aria-label',`Игровая зона ${c.index+1}`);host.style.cssText=rect+`;--band-top:${INTERACTION_BAND.top-c.top}px;--band-height:${INTERACTION_BAND.bottom-INTERACTION_BAND.top}px`;ui.append(host);
 }
}
function switchLayout(mode){
 if(mode===layoutMode)return;
 if(content){cancel();sessions.set(layoutMode,zones);}
 layoutMode=mode;setZoneLayout(mode);
 zones=sessions.get(mode)||CIRCLES.map(c=>newZone(c.index));
 selectedZone=null;gestureZone=null;preview=null;
 for(const z of zones){z.hold=null;z.selected=null;z.selectedId=null;}
 lastNetwork={states:{},links:[]};signature='';
 if(content){mountZones();render();syncScene();fit();}
}

async function boot(){
 document.documentElement.dataset.shaderGlass=String(new URLSearchParams(location.search).get('service')==='1');
 const [loaded,shell,client,contours]=await Promise.all([loadMissionCatalog('./config/client-webgl.json'),loadUiShellConfig(),fetch('./config/client-missions.json').then(r=>{if(!r.ok)throw Error('Client content unavailable');return r.json();}),loadEarthContours()]);
 const raw=serializeMissionCatalog(loaded);for(const value of Object.values(raw.system.objectSettings)){value.size=.65;value.signalRadius*=.64;}
 catalog=parseMissionCatalog(raw);content=client;configureMissions(catalog);
 mountZones();
 render();fit();assets=new PreparedAssets();await Promise.all([assets.load(collectAssetSources(catalog,ITEM_TYPES,contours,shell.rendering.earth.russiaContour,true)),prepareFonts(document.fonts)]);
 field=await createWebGLField({container:world,contourCatalog:contours,planar:true,planarPointAllowed:geo=>CIRCLES.some(c=>insideCircle(c.index,geo)),preparedAssets:assets,startPaused:true,placements:[],network:{states:{},links:[]},itemTypes:ITEM_TYPES,endpoints:{},selectedItem:null,
 maxDrawingBufferPixels:shell.rendering.maxDrawingBufferPixels,earthStyle:shell.rendering.earth,nodeIconBackdropStyle:shell.rendering.nodeIconBackdrop,signalLinkStyle:shell.rendering.signalLinks,onConnectionFrame:onFrame,
 onPlace:(type,geo)=>{if(paused||selectedZone===null)return;const i=selectedZone,z=zones[i];commit(i,placeInZone(z,type,geo,missionFor(z).inventory,Date.now()));},
 onSelectPlacement:id=>{const i=Math.floor(id/100000)-1;if(!zones[i]||zones[i].complete||paused)return;selectedZone=i;zones[i].selectedId=zones[i].selectedId===id?null:id;zones[i].selected=null;renderZone(i);syncScene();},
 onMove:(id,geo)=>{const i=Math.floor(id/100000)-1;if(!paused&&zones[i])commit(i,moveInZone(zones[i],id,geo,Date.now()));},
 onMovePreview:(id,geo)=>{const i=Math.floor(id/100000)-1;if(insideCircle(i,geo)){preview={id,geo};syncScene();}},onMoveCancel:cancel,
 placementRejection:(type,geo)=>selectedZone!==null&&!insideCircle(selectedZone,geo)?'outside':null,
 onRemove:id=>{const i=Math.floor(id/100000)-1;if(!paused&&zones[i])commit(i,removeInZone(zones[i],id));}});
 field.setScreenConnections(true);field.setTapControls({enabled:true});await field.prepareGPU();fit();field.setServicePaused(paused);field.start();status.hidden=true;document.documentElement.dataset.gameReady='true';
}
boot().catch(error=>{console.error(error);status.textContent=`Не удалось запустить MAX: ${error.message}`;});
window.addEventListener('pagehide',()=>{field?.dispose();assets?.dispose();},{once:true});
