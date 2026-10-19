export const V5_SPLASH_LOGO='./brand/assets/logos/max-primary-white.svg';
// Original brand asset; this presentation screen has no game actions.
const device=(presence=1)=>`<div class="demo-app v5-startup-screen" data-device="phone"><div class="phone-content" data-task-content data-path-presence="${presence}"><img src="${V5_SPLASH_LOGO}" alt="MAX" draggable="false"></div></div>`;
export const v5SplashMarkup=(presence=1)=>`<section class="client-task">${device(presence)}</section>`;
export const v5SplashWarmup=(width=392)=>({html:`<section class="route-phone client-task" style="left:0;top:0;width:${width}px;height:800px">${device()}</section>`});
