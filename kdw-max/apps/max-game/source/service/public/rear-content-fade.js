export const REAR_CONTENT_FADE=256;
export function rearContentOpacity(distance){const t=Math.max(0,Math.min(1,distance/REAR_CONTENT_FADE));return t*t*(3-2*t);}
export const REAR_CONTENT_FADE_GLSL=`float rearContentFade(float distance){return smoothstep(0.,${REAR_CONTENT_FADE.toFixed(1)},distance);}`;
export function rearForegroundMask(){return `linear-gradient(to right,${Array.from({length:9},(_,i)=>`rgba(0,0,0,${rearContentOpacity(i*REAR_CONTENT_FADE/8)}) ${i/8*REAR_CONTENT_FADE/4096*100}%`).join(',')},#000 100%)`;}
