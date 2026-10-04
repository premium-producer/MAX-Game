import {frameStamp,previewRect} from './output-plan.js';
import {GAME_PREVIEW_FPS,gamePreviewSize,paintGamePreview} from './game-preview.js';
import {frameDelay,FrameTiming} from './frame-timing.js';
import {maxGameLayout} from './max-game-layout.js';
import {MaxSharedBackground} from './max-shared-background.js';
import {maxServiceState} from './max-game-settings.js';
import {readGlassControls} from './max-panel-optics.js';
const token=location.hash.slice(1),game=document.getElementById('game'),stamp=document.getElementById('stamp').getContext('2d'),peers=new Map(),views=new Map();
let state,program,background,frame=0,closed=false,started=false,timer,lastStatus=0,lastPreview=0,busy=false,previewBusy=false,active=false;
async function post(route,data){const r=await fetch('/api/worker/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Worker-Token':token},body:JSON.stringify(data)});if(!r.ok)throw Error('MAX service '+r.status);return r.json();}
async function fail(e){if(closed)return;closed=true;clearTimeout(timer);console.error(e);await post('status',{error:e.message}).catch(()=>{});}
async function configure(){program=await window.vkNativeOutput.configure({width:state.renderProfile.width,height:state.renderProfile.height,spout:active&&state.outputs?.spout===true,ndi:false});}
async function updatePreviews(){
 if(previewBusy||closed||!views.size||performance.now()-lastPreview<1000/GAME_PREVIEW_FPS)return;
 previewBusy=true;lastPreview=performance.now();
 try{for(const view of views.values()){
  if(closed)break;
  try{const result=await window.vkNativeOutput.preview({rect:view.rect});if(!closed&&views.get(view.key)===view)paintGamePreview(view,result);}catch(error){if(!closed)console.warn('MAX preview: '+error.message);}
 }}finally{previewBusy=false;}
}
const timing=new FrameTiming();
async function draw(){
 if(closed||busy)return;busy=true;const startedAt=performance.now();
 try{
  const ready=game.contentDocument?.documentElement.dataset.gameReady==='true';
  if(ready){
   const doc=game.contentDocument,revision=doc.documentElement.dataset.glassRevision;
   if(background.controlDocument!==doc||background.controlRevision!==revision){
    background.glass.setControls(readGlassControls(doc));background.controlDocument=doc;background.controlRevision=revision;
   }
   background.menuZones=Array.from(game.contentDocument.querySelectorAll('.circle'),zone=>Boolean(zone.querySelector('.mission-choices')));
   frame++;await background.draw(frame);stamp.putImageData(new ImageData(new Uint8ClampedArray(frameStamp(program.epoch,frame)),64,2),0,0);
   await window.vkNativeOutput.present(frame);
   timing.record(startedAt,performance.now());
   // Preview is bounded and resized off the main thread; never await it here.
   void updatePreviews();
  }
  if(performance.now()-lastStatus>1000){lastStatus=performance.now();const size=program.plan.logicalSize;
   const response=await post('status',{ready:ready&&frame>=3,frame,renderSize:size,sceneSize:size,timing:timing.latest,nativeOutputs:await window.vkNativeOutput.status()});
   if(response.outputActive!==active){active=response.outputActive;await configure();}
  }
  timer=setTimeout(draw,frameDelay(startedAt,performance.now()));
 }catch(e){await fail(e);}finally{busy=false;}
}
function drop(id){const p=peers.get(id);if(!p)return;p.close();peers.delete(id);if(--p.view.refs===0){p.view.stream.getTracks().forEach(t=>t.stop());views.delete(p.view.key);}}
const events=new EventSource('/api/worker/events?token='+encodeURIComponent(token));
events.addEventListener('config',async e=>{try{state=JSON.parse(e.data);maxGameLayout(state.renderProfile.width,state.renderProfile.height);active=state.outputActive??active;
 await configure();game.contentWindow?.postMessage(maxServiceState(state),location.origin);
 if(!started){started=true;background=new MaxSharedBackground(document.getElementById('background'));background.sync(state);await background.load(program);game.addEventListener('load',()=>game.contentWindow.postMessage(maxServiceState(state),location.origin));game.src='/max-game/?surface=right&service=1';draw();}else background?.sync(state);
 }catch(error){fail(error);}});
events.addEventListener('game-pointer',e=>{
 const pointer=JSON.parse(e.data);
 if(pointer.phase==='cancel'&&game.contentWindow)game.contentWindow.dispatchEvent(new game.contentWindow.Event('max-service-pointer-cancel'));
 if(state?.clock.playing||pointer.phase==='cancel')window.vkNativeOutput.pointer(pointer).catch(fail);
});
events.addEventListener('field',e=>background?.receive(JSON.parse(e.data)));
events.addEventListener('walk-mask',e=>background?.receiveWalk(JSON.parse(e.data)));
events.addEventListener('subscribe',async e=>{const {peerId,roi}=JSON.parse(e.data);try{
 const rect=previewRect(roi,...program.plan.logicalSize),key=JSON.stringify(rect);let view=views.get(key);
 if(!view){if(views.size>=2)throw Error('MAX: не больше двух ROI');const canvas=document.createElement('canvas'),size=gamePreviewSize(rect);[canvas.width,canvas.height]=size;view={key,rect,size,refs:0,context:canvas.getContext('2d'),stream:canvas.captureStream(GAME_PREVIEW_FPS)};views.set(key,view);}
 const pc=new RTCPeerConnection({iceServers:[]});pc.view=view;view.refs++;peers.set(peerId,pc);for(const track of view.stream.getTracks())pc.addTrack(track,view.stream);
 pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))drop(peerId);};
 await pc.setLocalDescription(await pc.createOffer());
 if(pc.iceGatheringState!=='complete')await new Promise(resolve=>{const timeout=setTimeout(done,4000);function done(){clearTimeout(timeout);pc.removeEventListener('icegatheringstatechange',check);resolve();}function check(){if(pc.iceGatheringState==='complete')done();}pc.addEventListener('icegatheringstatechange',check);});
 if(peers.has(peerId))await post('signal',{peerId,description:pc.localDescription});
 }catch(error){drop(peerId);console.error(error);}});
events.addEventListener('signal',async e=>{const d=JSON.parse(e.data);try{await peers.get(d.peerId)?.setRemoteDescription(d.description);}catch{drop(d.peerId);}});
events.addEventListener('peer-close',e=>drop(JSON.parse(e.data).peerId));
addEventListener('pagehide',()=>{closed=true;clearTimeout(timer);events.close();for(const id of [...peers.keys()])drop(id);background?.dispose();});
