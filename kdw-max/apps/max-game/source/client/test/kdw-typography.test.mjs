import test from 'node:test';
import assert from 'node:assert/strict';
import {typographyText,typographyMarkup,instructionText} from '../src/kdw-typography.mjs';
import {v5CopyMarkup} from '../src/kdw-ui-copy.mjs';
import {sharedTaskMarkup,sharedInstructionRetention} from '../src/kdw-shared-ui.mjs';
test('Russian short words, particles, dashes and units have meaningful nonbreaking groups',()=>{
 assert.equal(typographyText('Создадим канал для вашего бизнеса – и поделимся важными обновлениями, акциями и новостями'),'Создадим канал для\u00a0вашего бизнеса\u00a0– и\u00a0поделимся важными обновлениями, акциями и\u00a0новостями');
 assert.equal(typographyText('И в MAX, но не в чате; из-за дождя. Кто бы знал? Так ли это? 350 ₽ и 5 кг'),'И\u00a0в\u00a0MAX, но\u00a0не\u00a0в\u00a0чате; из-за\u00a0дождя. Кто\u00a0бы знал? Так\u00a0ли это? 350\u00a0₽ и\u00a05\u00a0кг');
});
test('explicit newlines, URLs, word boundaries and idempotence survive',()=>{
 const s='в\nMAX\r\nс вами: https://max.ru/a?x=5 и mail@max.ru; кино, каналы, свои, Лиза, 9:41';
 const t=typographyText(s);assert.equal(t,'в\nMAX\r\nс\u00a0вами: https://max.ru/a?x=5 и mail@max.ru; кино, каналы, свои, Лиза, 9:41');
 assert.equal(typographyText(t),t);assert.equal(typographyText('и, конечно; не...'), 'и, конечно; не...');
});
test('trusted markup preserves attributes, existing breaks and escaping',()=>{
 const html='<p title="и в MAX">в &quot;MAX&quot; и &lt;script&gt;<br>а дальше</p>';
 assert.equal(typographyMarkup(html),'<p title="и в MAX">в\u00a0&quot;MAX&quot; и &lt;script&gt;<br>а\u00a0дальше</p>');
 const message=v5CopyMarkup('А теперь отправим сообщение! Выберем формат: голосовое сообщение или видеосообщение');assert.ok(message.includes('<br>'));assert.ok(message.includes('или\u00a0видеосообщение'));
 assert.ok(v5CopyMarkup('<img src=x onerror=alert(1)>').includes('&lt;img'));assert.ok(!v5CopyMarkup('<img src=x>').includes('<img'));
 const branded=v5CopyMarkup('Подтвердить льготу с Цифровым ID для посещения музея');
 assert.ok(branded.includes('<span class="v5-copy-nowrap">с\u00a0Цифровым\u00a0ID</span>'));
 assert.equal(typographyMarkup(branded),branded);
});
test('shared panels format output without mutating state or restarting retained text',()=>{
 const s={state:{status:'task',screenId:'screen'},view:{instruction:{text:'Создадим канал для вашего бизнеса – и поделимся новостями'},actions:[]}},before=structuredClone(s);
 const html=sharedTaskMarkup(s,{title:'Канал'});assert.ok(html.includes('для\u00a0вашего'));assert.ok(html.includes('и\u00a0поделимся'));assert.deepEqual(s,before);
 const texts={'.eyebrow':'ВОЗМОЖНОСТИ MAX',h2:'Канал',p:typographyText(s.view.instruction.text)},copy={querySelector:sel=>({textContent:texts[sel]})};
 const popup={dataset:{task:'task'},querySelector:sel=>sel==='.instruction'?{hidden:false,querySelector:()=>copy}:copy};
 assert.deepEqual(sharedInstructionRetention(popup,{taskId:'task',title:'Канал',body:s.view.instruction.text}),{header:true,body:true});
});
test('authored reference lines preserve semantic breaks, source data and panel retention',()=>{
 for(const [input,expected] of [
  ['Настроим тип канала – приватный или публичный','Настроим тип канала –\nприватный или публичный'],
  ['Канал создан! Начинаем делиться самым важным','Канал создан!\nНачинаем делиться самым важным']
 ]){
  assert.equal(instructionText(input),expected);assert.equal(instructionText(expected),expected);
  const s={state:{status:'task'},view:{instruction:{text:input},actions:[]}},before=structuredClone(s);
  assert.ok(sharedTaskMarkup(s,{title:'Канал'}).includes(typographyText(expected)));assert.deepEqual(s,before);
  const texts={'.eyebrow':'ВОЗМОЖНОСТИ MAX',h2:'Канал',p:typographyText(expected)},copy={querySelector:sel=>({textContent:texts[sel]})};
  const popup={dataset:{task:'task'},querySelector:sel=>sel==='.instruction'?{hidden:false,querySelector:()=>copy}:copy};
  assert.deepEqual(sharedInstructionRetention(popup,{taskId:'task',title:'Канал',body:input}),{header:true,body:true});
 }
 assert.equal(instructionText('Другая\nподпись'),'Другая\nподпись');
});
