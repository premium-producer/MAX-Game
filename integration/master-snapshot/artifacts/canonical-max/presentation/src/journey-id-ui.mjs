import {icon} from './journey-icons.mjs';
import {ID_TASKS,ID_IMAGES} from './journey-id.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regions={0:[[28,388,304,60]],1:[[20,624,320,64]],3:[[8,632,344,64],[8,704,344,64]],4:[[8,632,344,64],[8,704,344,64]],5:[[8,632,344,64],[8,704,344,64]],6:[[16,636,328,60],[16,704,328,60]],7:[null,[8,720,130,54]]};
export function idTaskMarkup(s,o,{guidedReveal=false}={}){
 const last=ID_TASKS.length-1,stage=Math.min(o.stage,last),task=ID_TASKS[stage];
 const buttons=o.done?'':(regions[stage]||[]).map((r,i)=>r?`<button class="id-hotspot" data-answer="${i}" aria-label="${esc(task.options[i])}" style="left:${r[0]/3.6}%;top:${r[1]/8}%;width:${r[2]/3.6}%;height:${r[3]/8}%"></button>`:'').join('');
 const finalAction=stage===last?`<button class="pill id-final-action" ${o.done?'data-close':'data-answer="0"'}>${o.done?'Вернуться на поле':'Продолжить'}</button>`:'';
 return `<section class="task-dialog context-popup client-task id-task" role="dialog" aria-modal="false" aria-label="Создать Цифровой ID"><div class="instruction glass-control"><div class="instruction-copy" data-task-content><span class="eyebrow">${guidedReveal?'УЧЕБНЫЙ ЭКРАН':`УЧЕБНЫЙ ЭКРАН · ${stage+1} / ${ID_TASKS.length}`}</span><h2>${esc(task.title)}</h2><p>${esc(o.done?'Задание выполнено. Продолжите путь на остальных объектах.':task.copy)}</p>${s.notice?`<p role="status">${esc(s.notice)}</p>`:''}</div><span class="task-icon tile" aria-hidden="true"></span></div><div class="demo-app"><div class="phone-content" data-task-content><div class="id-screen"><img draggable="false" class="id-screen-image" src="${ID_IMAGES[stage]}" alt="${esc(task.title)} — экран ${stage+1}">${buttons}</div>${finalAction}</div></div><button class="close pill" data-close aria-label="Закрыть задание">${icon('close')}</button></section>`;
}
