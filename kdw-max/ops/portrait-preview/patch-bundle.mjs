// PORTRAIT-LAYOUT-C preview: applies the source changes of this branch to the
// shipped, minified www/webgl-v5/app.js in memory. Used only by preview.mjs until
// the bundle is rebuilt with `npm run build:max`; the file on disk is not changed.
import {PORTRAIT_CSS,portraitIdleLayout} from '../../apps/max-game/source/client/src/kdw-pixel-map.mjs';
import {columnCompositionRects} from '../../apps/max-game/source/client/src/kdw-composition-layout.mjs';

export function patchBundle(source) {
let s = source;
const once = (needle, replacement) => {
  const i = s.indexOf(needle);
  if (i < 0 || s.indexOf(needle, i + 1) >= 0) throw Error('needle not unique: ' + needle.slice(0, 80));
  s = s.slice(0, i) + replacement + s.slice(i + needle.length);
};

// 1. kdw-pixel-map.mjs: same minified names (um, a8, Qr, r8, C9, eA, o8, $u, c8, Am, d8, l8).
const start = s.indexOf('var um=Object.freeze({width:3072');
const end = s.indexOf('var z9=new WeakMap');
if (start < 0 || end < start) throw Error('pixel-map region not found');
const pixelMap = `
${portraitIdleLayout.toString().replace('function portraitIdleLayout(','function __kdwPortraitIdle(')}
var __kdwPortrait=typeof location<"u"&&new URLSearchParams(location.search).get("display")==="portrait";
var um=__kdwPortrait?Object.freeze({name:"portrait",width:1080,height:1920,left:0,gameWidth:1080,right:0,safeFraction:.04}):Object.freeze({name:"landscape",width:3072,height:1536,left:560,gameWidth:1760,right:752,safeFraction:.07});
function a8(n){return n.get("view")==="pixel-map"}
function Qr(n,e){let P=um,f=P.safeFraction,t=Math.min(n/P.width,e/P.height),s=(n-P.width*t)/2,i=(e-P.height*t)/2,a={left:s+P.left*t,top:i,width:P.gameWidth*t,height:P.height*t};a.right=a.left+a.width,a.bottom=a.top+a.height;let r={left:a.left+a.width*f,top:a.top+a.height*f,width:a.width*(1-2*f),height:a.height*(1-2*f)};return r.right=r.left+r.width,r.bottom=r.top+r.height,{scale:t,left:s,top:i,width:P.width*t,height:P.height*t,touch:a,safe:r}}
function r8(n,e){let t=Object.values(n.tasks).flatMap(d=>Object.values(d.screens)),s=Math.max(392,...t.map(d=>e({kind:d.deviceKind,asset:n.assets[d.assetId]}).width));
 if(__kdwPortrait){let P=um,f=P.safeFraction,r=Math.min(P.gameWidth*(1-2*f)/800,P.height*(1-2*f)/1400),o=P.width/r,c=P.height/r,w=P.gameWidth*(1-2*f)/r,h=P.height*(1-2*f)/r;return{width:o,height:c,scale:r,zone:{left:(P.left+P.gameWidth*f)/r,top:(c-h)/2,w,h},portrait:!0}}
 let i=Math.ceil(Math.max(2048,s+760+64+64)/64)*64,a=1280,r=Math.min(1760*.86/i,1536*.86/a),o=3072/r,c=1536/r,f={left:(560+1760*.07)/r,top:(c-a)/2,w:i,h:a};return{width:o,height:c,scale:r,zone:f}}
function C9(n){if(n.h>n.w)return __kdwPortraitIdle(n);
 let i=177.99816473537075,a=n.w*.65,r=a*550/960,o=a+80,c=n.w-o,f=c/2,d=2*296+64,l=Math.max(r,d),u=100,A=(n.h-i-u-l)/2,h=A+i+u;return{centre:{x:n.w/2,y:n.h/2},gap:64,iconSize:200,rowShift:0,missionOrder:["digital-id","business","blogger","communication"],logo:{x:(n.w-560)/2,y:A,width:560,height:i},video:{x:0,y:h+(l-r)/2,width:a,height:r},icons:Array.from({length:4},(m,p)=>({x:o+f*(p%2+.5)-200/2,y:h+(l-d)/2+Math.floor(p/2)*360}))}}
function eA(){return typeof document>"u"||document.documentElement.dataset.pixelMap!=="true"?null:Qr(innerWidth,innerHeight).safe}
function o8(n,e){let{safe:t,touch:s}=Qr(n,e);return{...t,top:s.top,bottom:s.bottom,height:s.height}}
var $u={};function c8(n){$u=n??{}}
function Am(n){if(!n)return!1;n.style.setProperty("--kdw-keyboard-width",$u.width??1),n.style.setProperty("--kdw-keyboard-height",$u.height??1);let e=eA(),t=Math.min(innerWidth/um.width,innerHeight/um.height),s=($u.x??0)*t,i=($u.y??0)*t;if(!e)return n.style.left=\`calc(50% + \${s}px)\`,n.style.bottom=-i+"px",!1;let lift=__kdwPortrait?e.height*(1-.721):e.height*.23;return Object.assign(n.style,{left:(e.left+e.right)/2+s+"px",top:"auto",bottom:innerHeight-e.bottom+lift-i+"px"}),n.style.setProperty("--kdw-scale",__kdwPortrait?Math.min(e.width/1600,e.height*.24/900):Math.min(e.width/1600,e.height/900)),!0}
`;
const original = s.slice(start, end);
const d8Start = original.indexOf('function d8(){');
if (d8Start < 0) throw Error('d8 not found');
s = s.slice(0, start) + pixelMap + original.slice(d8Start) + s.slice(end);

// 2. kdw-composition-layout.mjs: column arrangement (variant C) before uF.
once('function uF({device:n,reference:e=null,button:t=null,icons:s=[],timers:i=[]},a={},r=null,o=n?.height*390/800,c="reference"){if(!n||!Object.keys(a).length)return{device:n,reference:e,button:t,icons:s,timers:i};',
  `${columnCompositionRects.toString().replace('function columnCompositionRects(','function __kdwColumn(')}
function uF({device:n,reference:e=null,button:t=null,icons:s=[],timers:i=[]},a={},r=null,o=n?.height*390/800,c="reference",F=null){if(!n||!Object.keys(a).length)return{device:n,reference:e,button:t,icons:s,timers:i};if(a.arrangement==="column"&&F)return __kdwColumn({device:n,reference:e,button:t,icons:s,timers:i},a,F,o);`);

// 3. Call site: portrait arrangement, cardsScale 1 by default, host frame.
once('{...X.relative,deviceScale:(X.relative.deviceScale??1)*fF(X.relative,ne?.kind??Ge,ne?.screen??ye)},{x:Be.x+Be.width/2,y:Be.y+Be.height/2},Re,e.get("transitionLayout")==="device"?"device":"reference")',
  '{...X.relative,...(__kdwPortrait?{arrangement:"column"}:{}),deviceScale:(X.relative.deviceScale??1)*fF(__kdwPortrait?{cardsScale:1,...X.relative}:X.relative,ne?.kind??Ge,ne?.screen??ye)},{x:Be.x+Be.width/2,y:Be.y+Be.height/2},Re,e.get("transitionLayout")==="device"?"device":"reference",{x:Be.x,y:Be.y,width:Be.width,height:Be.height})');

// 4. Offsets unit and brand top follow the profile.
if ([...s.matchAll(/=[A-Za-z_$][\w$]*\.width\/3072,/g)].length !== 1) throw Error('composition unit site not unique');
s = s.replace(/(=[A-Za-z_$][\w$]*)\.width\/3072,/g, '$1.width/um.width,');
once('top:1536*.07/s.scale+"px"', 'top:um.height*um.safeFraction/s.scale+"px"');
// kdw-pixel-map.mjs installPixelMapInput: profile attribute and the compact portrait styles.
once('function d8(){let n=document.documentElement;n.dataset.pixelMap="true";',
  'function d8(){let n=document.documentElement;n.dataset.pixelMap="true";n.dataset.pixelMapProfile=um.name;if(__kdwPortrait&&!document.getElementById("kdw-portrait-style")){let st=document.createElement("style");st.id="kdw-portrait-style",st.textContent=' + JSON.stringify(PORTRAIT_CSS) + ',document.head.append(st)}');
// kdw-composition-layout.mjs: the palm-screen plates are not part of the mission row.
once('Ce=N.filter(Be=>Be.el.matches(".v5-device-timer"))',
  'Ce=N.filter(Be=>Be.el.matches(__kdwPortrait?".v5-device-timer:not([data-scan-wait-timer],[data-scan-queue-count])":".v5-device-timer"))');
// kdw-stand-adapter.mjs: portrait MAX logo in the top right corner, hidden in the menu.
once('s){let g=n.querySelector(".v5-brand"),b=Qr(f,d);',
  's){if(__kdwPortrait){let L=n.querySelector(".kdw-portrait-brand");L||(n.insertAdjacentHTML("beforeend",\'<div class="kdw-portrait-brand" aria-hidden="true" hidden><img src="./brand/assets/logos/max-primary-white.svg" alt="" style="display:block;width:100%;height:100%"></div>\'),L=n.querySelector(".kdw-portrait-brand"));let H=44,W=H*440.4539794921875/140;Object.assign(L.style,{position:"absolute",left:s.zone.left+"px",top:s.zone.top+6+"px",width:W+"px",height:H+"px",pointerEvents:"none",zIndex:"5"})}let g=n.querySelector(".v5-brand"),b=Qr(f,d);');
once('update(f){if(c.hidden=!f||f.state.status==="menu",s){let d=n.querySelector(".v5-brand");d&&(d.hidden=f?.state.status==="menu")}}',
  'update(f){if(c.hidden=!f||f.state.status==="menu",s){let d=n.querySelector(".v5-brand");d&&(d.hidden=f?.state.status==="menu");let L=n.querySelector(".kdw-portrait-brand");L&&(L.hidden=!f||f.state.status==="menu")}}');
// journey-v5-device-timer.mjs: palm wait timer and queue in a row above the palm.
once('function DP({left:n,top:e,width:t,height:s}){let i=n+t/2,a=e+s/2,',
  'function DP({left:n,top:e,width:t,height:s}){let i=n+t/2,a=e+s/2;if(__kdwPortrait){let q={left:i-wr.width-24,top:e-64-wr.height,...wr};return{timer:{...q,left:i+24},queue:q}}let ');
// kdw-contact-area.mjs (not in git): the touch radius is authored for the 3072-wide display.
once('(globalThis.innerWidth??3072)/3072', '(globalThis.innerWidth??um.width)/um.width');

return s;
}
