const controllers=new Set();let stamp=-1,frameId=0;
const contactObservers=new Set();
export function onActivityContact(listener){contactObservers.add(listener);return()=>contactObservers.delete(listener);}
export function reportActivityContact(event){for(const listener of contactObservers)listener(event);}
export function webglActivitiesEnabled(){const choice=new URLSearchParams(location.search).get('activityRenderer');return choice==='webgl'||(choice!=='dom'&&!!globalThis.kdwStandOutput);}
export function registerActivity(controller){controllers.add(controller);return()=>controllers.delete(controller);}
export function activityFrame(time=globalThis.document?.timeline?.currentTime??performance.now()){
 if(time===stamp)return;stamp=time;frameId++;
 for(const c of controllers)c.frame(time,frameId);
}
export const activityControllers=()=>controllers;
export function invalidateActivityGPU(){for(const c of controllers)c.invalidateGPU();}
