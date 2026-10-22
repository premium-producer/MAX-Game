import resources from './kdw-business-all-assets.json' with {type:'json'};
export const BUSINESS_ALL_ASSETS=resources.assets;
// Coordinates are in the supplied SVG viewBox, never the PNG preview size.
export const BUSINESS_ALL_ROUTE=Object.freeze({
 'business.platform.login':{number:1,common:true,actions:[[110,554,190,65,'Подключить'],[1100,40,230,70,'Войти на платформу']]},
 'business.platform.profile':{number:2,common:true,visitor:[748.818,22.3561,27.3241,27.3241],actions:[[318,256,260,52,'Юридическое лицо или ИП'],[318,316,260,52,'Самозанятый']]},
 'business.platform.verification':{number:3,common:true,visitor:[736.289,21.9834,26.8687,26.8687],actions:[[310,250,260,53,'Госуслуги'],[310,310,260,53,'Банковские сервисы']]},
 'business.platform.ready':{number:4,common:true,actions:[[0,0,455,78,'Профиль подтверждён']]},
 'business.channel.create':{number:5,actions:[[196,229,213,24,'Создать канал']]},
 'business.channel.continue':{number:6,actions:[[360,270,240,50,'Создать новый канал для бизнеса']]},
 'business.channel.open':{number:7,common:true,actions:[[6,728,348,40,'Начать']]},
 'business.channel.setup':{number:8,common:true,actions:[[6,674,290,41,'Поделиться номером']]},
 'business.channel.details':{number:9,common:true,actions:[[6,630,290,41,'Создать канал']]},
 'business.channel.description':{number:10,common:true,forward:true,actions:[[0,112,360,610,'Ввести название канала']]},
 'business.channel.type':{number:11,actions:[[6,673,290,41,'Создать канал']]},
 'business.channel.publish':{number:12,actions:[[6,589,290,41,'Перейти в канал']]},
 'business.bot.create':{number:14,source:5,actions:[[475,229,213,24,'Создать чат-бота']]},
 'business.bot.filled':{number:15,actions:[[32,373,258,23,'Создать']]},
 'business.bot.ready':{number:16,actions:[[345,225,36,24,'Открыть чат-бота']]},
 'business.bot.result':{number:17,actions:[[6,566,280,39,'С 10:00 до 16:00'],[6,607,280,39,'С 16:00 до 22:00'],[6,648,280,39,'Выбрать другой день']]},
 'business.store.dashboard':{number:18,source:5,actions:[[475,229,213,24,'Создать мини-приложение'],[21,122,125,29,'Чат-боты и мини-приложения']]},
 'business.store.settings':{number:19,actions:[[348,788,512,44,'Сохранить']]},
});
export function businessAllLayout(id,type='cafe'){
 const route=BUSINESS_ALL_ROUTE[id];if(!route)return null;
 const sector=route.common?'general':['cafe','flowers','auto'].includes(type)?type:'cafe';
 return {...resources.screens[`${sector}-${route.source??route.number}`],...route};
}
export function applyBusinessAll(catalog){
 Object.assign(catalog.assets,Object.fromEntries(Object.entries(BUSINESS_ALL_ASSETS).filter(([,a])=>a.mimeType==='image/svg+xml')));
 const task=catalog.tasks['business.store'],instruction=task.screens['business.store.start'].instruction;
 for(const [id,next,label]of [['business.store.dashboard','business.store.settings','Настроить мини-приложение'],['business.store.settings','business.store.start','Сохранить']])task.screens[id]={screenId:id,deviceKind:'pc',assetId:businessAllLayout(id).canvas,instruction,annotations:[],missing:null,automaticMs:null,actions:[{actionId:id+'.continue',label,placement:'below-screen',outcome:{kind:'navigate',screenId:next}}]};
 task.startScreenId='business.store.dashboard';
 for(const id of Object.keys(BUSINESS_ALL_ROUTE)){
  const screen=catalog.tasks[id.split('.').slice(0,2).join('.')].screens[id],layout=businessAllLayout(id);
  // Keep the established snack canvas/connector geometry and result timing.
  if(id!=='business.platform.ready')screen.assetId=layout.canvas;
  screen.actions[0].label=layout.actions[0][4];screen.annotations=[];
  for(const action of screen.actions){action.placement='hotspot';action.rect=id==='business.platform.ready'?[0,(559-895*78/455)/2,895,895*78/455]:layout.actions[0].slice(0,4);}
 }
 const choice=catalog.tasks['business.platform'].screens['business.platform.business-type'];
 choice.actions.forEach((a,i)=>{a.placement='hotspot';a.rect=i<3?[100+i*370,330,340,310]:[0,0,1,1];});
 catalog.kdwBusinessAll=1;return catalog;
}
