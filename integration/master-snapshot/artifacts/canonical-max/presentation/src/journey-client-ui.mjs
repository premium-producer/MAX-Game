import {taskMediaMarkup,taskDevice} from './journey-media.mjs';
import {isIdTask} from './journey-id.mjs';
import {idTaskMarkup} from './journey-id-ui.mjs';
import {serviceBrandMarkup} from './journey-brand.mjs';
import {CLIENT_BRIEFS,CLIENT_DIFFERENCES,CLIENT_TASKS,clientTaskFor} from './journey-client.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const action=(text,attr)=>`<button class="pill app-option client-action" ${attr}>${esc(text)}</button>`;
function shell(title,copy,phone,{difference='',brief=false,device='phone',story=false}={}){
 const chrome=device==='pc'?'<div class="pc-chrome" aria-hidden="true"><svg viewBox="0 0 64 16" class="pc-window-dots"><circle cx="8" cy="8" r="4"/><circle cx="28" cy="8" r="4"/><circle cx="48" cy="8" r="4"/></svg><span>MAX бизнес</span></div>':'';
 return `<section class="task-dialog context-popup client-task ${story?'story-task':''}" role="dialog" aria-modal="false" aria-label="${esc(title)}"><div class="instruction glass-control"><div class="instruction-copy" data-task-content><span class="eyebrow">${brief?'ОТКРОЙ ВОЗМОЖНОСТИ MAX':'ВОЗМОЖНОСТИ MAX'}</span><h2>${esc(title)}</h2><p>${esc(copy)}</p>${difference?`<p class="client-difference">${esc(difference)}</p>`:''}</div><span class="task-icon tile" aria-hidden="true"></span></div><div class="demo-app" data-device="${device}">${chrome}<span class="phone-camera" aria-hidden="true"></span><div class="app-top">${serviceBrandMarkup()}<span>Учебный экран</span></div><div class="phone-content" data-task-content>${phone}</div><span class="phone-home" aria-hidden="true"></span></div><button class="close pill" data-close aria-label="Закрыть задание">×</button></section>`;
}
export function clientBriefMarkup(s,content){
 const m=content.missions.find(m=>m.id===s.mission),brief=CLIENT_BRIEFS[s.mission]||{title:m.title,text:'Презентационная миссия: откройте MAX, соберите путь и выполните задания. Госуслуги показаны как учебное взаимодействие: нажмите подтверждение и вернитесь в MAX. Реальной авторизации и передачи данных нет.'};
 const items=m.steps.map(step=>`<li>${esc(step.label)}${CLIENT_DIFFERENCES[step.id]?`<small>${step.id==='account'?'Сфера бизнеса внутри шага · в DOCX отдельно':'Расхождение: есть в DOCX, нет в новом перечне'}</small>`:''}</li>`).join('');
 return shell(brief.title,brief.text,`<h3>Твой путь</h3><ol class="client-path">${items}${m.branches?'<li>Один инструмент: канал, бот или витрина</li>':''}</ol><div class="client-actions">${action(s.briefs?.[s.mission]?'Вернуться к пути':'Наметить путь','data-brief-done')}</div>`,{brief:true});
}
export function clientTaskMarkup(s,content,{deviceAware=false,guidedReveal=false}={}){
 if(s.task==='open-max')return clientBriefMarkup(s,content);
 const o=s.runs[s.mission]?.find(o=>o.step===s.task);if(!o)return '';
 if(isIdTask(o.step))return idTaskMarkup(s,o,{guidedReveal});
 const mission=content.missions.find(m=>m.id===s.mission),step=[...mission.steps,...(mission.branches||[]).map(b=>b.step)].find(step=>step.id===o.step);
 const tasks=CLIENT_TASKS[o.step],task=o.done?tasks.at(-1):clientTaskFor(o);
 const selected=o.step==='account'&&o.stage>=2?`Сфера: ${tasks[1].options[o.answers[1]??0]}`:'';
 const title=o.done?task.result:task.title;
 const imageAction=guidedReveal&&o.step==='channel'&&o.stage===0&&!o.done;
 const actions=imageAction?'':`<div class="client-actions">${o.done?'<p class="client-done">Задание выполнено</p><p class="client-next">Закрой окно и выбери следующий шаг на поле.</p>':task.options.map((label,i)=>action(label,`data-answer="${i}"`)).join('')}</div>`;
 const progress=guidedReveal?'':`<div class="app-progress" aria-label="Шаг ${Math.min(o.stage+1,tasks.length)} из ${tasks.length}">${tasks.map((_,i)=>`<i class="${i<=o.stage?'on':''}"></i>`).join('')}</div>`;
 const phone=`<h3>${esc(title)}</h3>${progress}${taskMediaMarkup(o,{guidedReveal})}${selected?`<p class="client-selection">${esc(selected)}</p>`:''}${actions}<div class="task-notice" role="status">${esc(o.done?'Готово':s.notice||'Выполни действие на экране')}</div>`;
 return shell(step.detail||step.label,o.done?'Этот шаг пройден. Продолжи путь на остальных объектах.':task.copy,phone,{difference:CLIENT_DIFFERENCES[o.step]||'',device:deviceAware?taskDevice(o).kind:'phone',story:['hotel','benefit','age','demo-benefit'].includes(o.step)});
}
