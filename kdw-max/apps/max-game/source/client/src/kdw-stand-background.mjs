import {lumiReferenceBackground} from './journey-lumi-reference-background.mjs';
if(!globalThis.kdwBackgroundOutput)throw Error('Background requires the desktop host');
const background=lumiReferenceBackground(document.querySelector('canvas'),{offscreen:true});
globalThis.kdwBackgroundOutput.onFrame(packet=>{
 background.tick(packet.delta,{active:true,reduced:packet.reduced});
 globalThis.kdwBackgroundOutput.ack();
});
addEventListener('pagehide',()=>background.dispose(),{once:true});
