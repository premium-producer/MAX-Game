// Compatibility hooks are diagnostic-only. Preparation never mounts a screen.
let retryTimer=0,transitionPromise=null,sceneTransition=null;
export function installSceneTransition(handler){sceneTransition=handler;return()=>{if(sceneTransition===handler)sceneTransition=null;};}
export function showStandbyCover(){const marker=document.getElementById('loading');if(marker)marker.hidden=true;return marker;}
export function dismissStandbyCover(){clearTimeout(retryTimer);retryTimer=0;showStandbyCover();}
export function recoverBehindCover(retry=()=>location.reload()){
 showStandbyCover();if(retryTimer)return;
 let attempts=0;try{const saved=JSON.parse(sessionStorage.getItem('kdw-cover-retry')??'null');attempts=saved&&Date.now()-saved.at<60000?saved.attempts:0;sessionStorage.setItem('kdw-cover-retry',JSON.stringify({at:Date.now(),attempts:attempts+1}));}catch{}
 retryTimer=setTimeout(()=>{retryTimer=0;retry();},Math.min(15000,1500*2**Math.min(attempts,4)));
}
export function transitionReload(){
 if(transitionPromise)return transitionPromise;
 transitionPromise=Promise.resolve().then(()=>sceneTransition?sceneTransition():location.reload()).finally(()=>{transitionPromise=null;});return transitionPromise;
}
export const STANDBY_COVER_CSS='#loading{display:none!important;pointer-events:none!important}';
