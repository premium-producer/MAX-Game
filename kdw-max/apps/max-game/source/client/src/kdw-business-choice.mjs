export const BUSINESS_OPTIONS=Object.freeze([{id:'cafe',label:'Кофейня'},{id:'flowers',label:'Цветочный магазин'},{id:'auto',label:'Автомастерская'}]);
export const BUSINESS_CHOICE_SCREEN='business.platform.business-type';
export function applyBusinessChoice(catalog){
 const task=catalog.tasks['business.platform'],legacyStartScreenId=task.startScreenId,assetId='kdw.native.business-choice';
 catalog.assets[assetId]={assetId,path:'assets/kdw-native/business-choice.svg',width:1280,height:800,mimeType:'image/svg+xml',sha256:'a8f9eef8f77ce9892e09deb2d698b8cc3e4fb6783db8dd4e88a6bc5315b9181e'};
 const screen={screenId:BUSINESS_CHOICE_SCREEN,deviceKind:'pc',assetId,instruction:'Выберите бизнес, который будете развивать с MAX',annotations:[],missing:null,automaticMs:null,
  actions:[...BUSINESS_OPTIONS,{id:'sports',label:'Спортивный магазин'},{id:'hotel',label:'Отель'},{id:'theater',label:'Театр'}].map((option,index)=>({actionId:'business.platform.choose-'+option.id,label:option.label,placement:'hotspot',rect:[64+392*index,294,368,368],outcome:{kind:'navigate',screenId:legacyStartScreenId,answer:{kind:'businessType',value:option.id}}}))};
 task.screens={[BUSINESS_CHOICE_SCREEN]:screen,...task.screens};task.startScreenId=BUSINESS_CHOICE_SCREEN;
 catalog.kdwBusinessChoice={screenId:BUSINESS_CHOICE_SCREEN,legacyStartScreenId};return catalog;
}
// Strict historical receipt replay: old accepted scans entered the previous first
// screen. Only that historical admission uses its former catalog start; all new
// commands use the current first screen, including after restarting an old run.
export function catalogForBusinessReceipt(catalog,receipt){
 const legacy=catalog.kdwBusinessPlatformLegacy,c=receipt?.command,snapshot=receipt?.reply?.snapshot;
 // The first release without ready briefly retained its old answer on restart.
 // Replay those accepted receipts exactly; new restarts always clear it.
 if(legacy&&c?.type==='RESTART_TASK'&&c.taskId==='business.platform'&&Object.hasOwn(snapshot?.progress?.business?.answers??{},'business.platform.ready'))return {...catalog,kdwBusinessRestartRetainLegacy:true};
 // The short-lived route without confirmation completed on verification.
 if(legacy&&c?.type==='ACT'&&c.screenId==='business.platform.verification'&&snapshot?.screenId===c.screenId&&snapshot?.status==='result'){
  const task=catalog.tasks['business.platform'],verification=structuredClone(legacy.verification);
  verification.actions[0].outcome={kind:'complete-task'};
  return {...catalog,kdwBusinessConfirmation:null,tasks:{...catalog.tasks,'business.platform':{...task,screens:{...task.screens,[c.screenId]:verification}}}};
 }
 if(legacy&&c?.type==='ACT'&&(c.screenId==='business.platform.ready'||(c.screenId==='business.platform.verification'&&snapshot?.screenId==='business.platform.ready'&&snapshot?.status==='task'))){
  const task=catalog.tasks['business.platform'];
  return {...catalog,kdwBusinessConfirmation:null,tasks:{...catalog.tasks,'business.platform':{...task,screens:{...task.screens,'business.platform.verification':legacy.verification,'business.platform.ready':legacy.ready}}}};
 }
 const old=catalog.kdwBusinessChoice?.legacyStartScreenId,s=receipt?.reply?.snapshot;
 if(old&&receipt.command?.type==='HOLD_CONFIRMED'&&s?.taskId==='business.platform'&&s.screenId===old)return {...catalog,tasks:{...catalog.tasks,'business.platform':{...catalog.tasks['business.platform'],startScreenId:old}}};
 return catalog;
}
