// One task, nine active screens; the four source PIN screens are omitted. No real identity or credentials are collected.
export const ID_FLOW_VERSION=2;
export const isIdTask=step=>step==='create-id'||step==='demo-id';
export const ID_SOURCE_FRAMES=[1,2,3,4,5,6,11,12,13];
export const ID_IMAGES=ID_SOURCE_FRAMES.map(n=>`./assets/digital-id/create-${String(n).padStart(2,'0')}.svg`);
const screen=(title,copy,options,extra={})=>({title,copy,options,correct:'*',scene:'digital-id-source',idScreen:true,...extra});
export const ID_TASKS=[
 screen('Цифровой ID','Нажмите «Создать QR» на экране MAX.',['Создать QR']),
 screen('Документы с Госуслуг','Добавьте документы с Госуслуг. В игре используются только учебные экраны.',['Добавить документы']),
 screen('Переход в Госуслуги','Открываются Госуслуги.',['Продолжить'],{autoMs:1100}),
 screen('Согласие для Минцифры','В учебном примере предоставьте согласие для Минцифры. Реальной авторизации и передачи данных нет.',['Предоставить','Отклонить'],{correct:0,rejectNotice:'Согласие не предоставлено. Можно закрыть задание или продолжить демонстрацию.'}),
 screen('Согласие для MAX','Теперь отдельное учебное согласие для MAX. Данные никуда не передаются.',['Предоставить','Отклонить'],{correct:0,rejectNotice:'Согласие не предоставлено. Можно закрыть задание или продолжить демонстрацию.'}),
 screen('Подтверждение входа','Подтвердите учебный вход через Госуслуги.',['Подтвердить','Отклонить'],{correct:0,rejectNotice:'Вход не подтверждён. Можно закрыть задание или продолжить демонстрацию.'}),
 screen('Быстрый вход','Можно включить учебный вход по биометрии или выбрать «Не сейчас».',['Включить','Не сейчас']),
 screen('Биометрия','Демонстрация системного экрана. Сканер и камера не включаются.',['Продолжить','Отменить'],{autoMs:1600}),
 screen('Цифровой ID создан','QR Цифрового ID готов. Продолжите задания на поле. Это учебный экран, не действующий документ.',['Продолжить'],{result:'Цифровой ID создан'})
];
export function idAdvance(stage,choice){return stage===6&&choice===1?8:stage+1;}
export function restoreIdObject(o){
 if(!isIdTask(o.step))return o;
 if(o.idFlowVersion===ID_FLOW_VERSION)return o;
 // Keep progress from the 13-screen flow: an interrupted PIN moves to biometrics.
 if(o.idFlowVersion===1){
  const oldStage=Math.max(0,Math.min(13,Math.floor(Number(o.stage)||0)));
  const stage=o.done?ID_TASKS.length:oldStage<6?oldStage:Math.max(6,oldStage-4);
  const answers=[...(o.answers||[]).slice(0,6),...(o.answers||[]).slice(10)];
  return {...o,idFlowVersion:ID_FLOW_VERSION,stage,answers};
 }
 // Legacy numeric stages refer to unrelated filler screens. Keep completed work,
 // restart only an unfinished ID task, preserving the rest of the mission.
 return {...o,idFlowVersion:ID_FLOW_VERSION,stage:o.done?ID_TASKS.length:0,answers:[]};
}
export class IdPlayback{
 constructor(){this.pending=new Map();}
 tick(index,object,delta,active){
  if(!active||!object||object.done||!isIdTask(object.step)){this.pending.delete(index);return false;}
  const task=ID_TASKS[object.stage];if(!task?.autoMs){this.pending.delete(index);return false;}
  const key=`${object.step}:${object.stage}`;let state=this.pending.get(index);
  if(!state||state.key!==key){state={key,elapsed:0,sent:false};this.pending.set(index,state);}
  state.elapsed+=Math.min(Math.max(0,delta),.1)*1000;
  if(state.elapsed<task.autoMs||state.sent)return false;state.sent=true;return true;
 }
}
