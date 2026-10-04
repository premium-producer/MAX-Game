// Client screenshots keep their original content. These targets refer to 360×800 frames.
export const CHANNEL_SAVE_KEY='max-site-game:channel:v2';
const area=(id,label,rect,to)=>({id,label,rect,to});
export const CHANNEL_SCREENS={
 chats:{frame:91504,copy:'Приступаем к созданию канала в MAX. Нажмите «+» вверху экрана.',actions:[area('plus','Открыть меню создания',[308,54,48,48],'menu')]},
 menu:{frame:91516,copy:'Выберите «Создать канал».',actions:[area('channel','Создать канал',[12,164,336,56],'name')]},
 name:{frame:91547,copy:'Придумаем название канала и расскажем, о чём он будет. Нажмите поле названия — покажем учебный пример.',actions:[area('example','Заполнить учебный пример',[12,288,336,144],'filled')]},
 filled:{frame:91553,copy:'В примере канал называется «Фильмы и сериалы». Нажмите «Создать канал» внизу экрана.',actions:[area('create','Создать канал',[12,708,336,56],'privacy')]},
 privacy:{frame:91559,copy:'Выберите тип канала: приватный доступен по ссылке, публичный можно найти через поиск.',actions:[area('private','Приватный канал',[24,272,312,56],'privacy'),area('public','Публичный канал',[24,330,312,56],'public-confirm'),area('continue','Продолжить с приватным каналом',[20,708,320,60],'subscribers')]},
 'public-confirm':{frame:91662,copy:'Для публичного канала нужна новая ссылка. Нажмите «Продолжить с новой». Прежнюю ссылку можно сохранить, вернувшись к приватному каналу.',actions:[area('keep','Оставить прежнюю ссылку',[20,640,320,60],'privacy'),area('new','Продолжить с новой ссылкой',[20,712,320,60],'public-link')]},
 'public-link':{frame:91612,header:'Публичный канал создан',copy:'Придумайте уникальную ссылку публичного канала. Нажмите поле ссылки — покажем учебный пример.',actions:[area('link-example','Заполнить ссылку учебного примера',[24,348,312,52],'public-filled')]},
 'public-filled':{frame:91637,header:'Публичный канал создан',copy:'Ссылка films свободна. Нажмите «Продолжить».',actions:[area('continue-public','Сохранить публичную ссылку',[20,448,320,60],'subscribers')]},
 subscribers:{frame:91689,copy:'Канал уже создан. Приглашение подписчиков можно пропустить и вернуться к нему позже.',actions:[area('skip-invites','Пропустить приглашение подписчиков',[20,708,320,60],'created')]},
 created:{frame:91714,copy:'Канал создан! Теперь вы можете публиковать посты и общаться с подписчиками.',button:{label:'К следующему заданию',to:'complete'}},
};
export function channelNext(state,actionId){const screen=CHANNEL_SCREENS[state];return screen?.actions?.find(a=>a.id===actionId)?.to??(actionId==='button'?screen?.button?.to:null)??null;}
export function restoreChannel(raw){try{const value=JSON.parse(raw);if(value?.version!==2)return null;const screen=value.screen==='public-gap'?'public-link':value.screen;if(!Object.hasOwn(CHANNEL_SCREENS,screen))return null;return {version:2,screen,completed:value.completed===true&&screen==='created',type:screen.startsWith('public-')?'public':['subscribers','created'].includes(screen)&&value.type==='public'?'public':'private'};}catch{return null;}}

// Semantic request and visual transition have separate identities. Only the current
// request may commit; repeated taps cannot answer the incoming screen.
export class ChannelTransition {
 constructor(screen='chats',type='private'){this.screen=screen;this.type=screen.startsWith('public-')?'public':type;this.pending=null;this.serial=0;this.elapsed=0;this.phase='idle';}
 request(action){if(this.phase!=='idle')return null;const to=channelNext(this.screen,action);if(!to||to===this.screen)return null;this.pending=to;this.elapsed=0;this.phase=to==='complete'?'complete':'loading';return {id:++this.serial,to};}
 prepared(id){if(id!==this.serial||this.phase!=='loading')return false;this.phase='transition';this.elapsed=0;return true;}
 cancel(){this.serial++;this.pending=null;this.phase='cancelled';}
 retry(){if(this.phase!=='loading')return null;return {id:++this.serial,to:this.pending};}
 step(dt,reduced=false){if(this.phase!=='transition')return false;this.elapsed+=dt;if(!reduced&&this.elapsed<.7)return false;this.screen=this.pending;if(this.screen.startsWith('public-'))this.type='public';else if(this.screen==='privacy')this.type='private';this.pending=null;this.phase='idle';return true;}
 get progress(){return this.phase==='transition'?Math.min(1,this.elapsed/.7):0;}
}
