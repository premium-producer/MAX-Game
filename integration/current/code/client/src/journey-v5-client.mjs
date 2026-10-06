import {createGradientController} from './bfm-gradient-controller.mjs';

// One fixed 16:9 coordinate space: the browser transform scales paint and input
// together. Same device/route geometry as v5, with room for the widest asset.
export const V5_CLIENT_SCENE=Object.freeze({width:3200,height:1800});
export function createV5ClientPresentation(){
 const gradients=createGradientController(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const configure=()=>gradients.configure({speed:30,spread:.15,phaseSpread:360,paused:document.hidden||reduced.matches});
 document.addEventListener('visibilitychange',configure);reduced.addEventListener('change',configure);configure();
 return {gradients,dispose(){document.removeEventListener('visibilitychange',configure);reduced.removeEventListener('change',configure);gradients.dispose();}};
}
