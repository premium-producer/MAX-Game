import {lumiReferenceBackground} from './journey-lumi-reference-background.mjs';
if(!globalThis.kdwBackgroundOutput)throw Error('Background requires the desktop host');
const background=lumiReferenceBackground(document.querySelector('canvas'),{offscreen:true});
// This window owns its display clock; IPC timing never drives animation.
let reduced=false,previous=performance.now(),frame=0,disposed=false;
globalThis.kdwBackgroundOutput.onFrame(packet=>{reduced=packet.reduced===true;});
function tick(now){
 if(disposed)return;
 background.tick(Math.max(0,Math.min(.05,(now-previous)/1000)),{active:true,reduced});
 previous=now;globalThis.kdwBackgroundOutput.ack();frame=requestAnimationFrame(tick);
}
frame=requestAnimationFrame(tick);
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);background.dispose();},{once:true});
