// Current editorial rules: two semantic lines per task; a whole-route summary
// for the last task. Navigation belongs to the button, not the reference panel.
export const TASK_COMPLETIONS=Object.freeze({
 'blogger.channel':'Канал создан!\nНачинаем делиться самым важным',
 'blogger.comments':'Ответили на комментарий!\nПродолжаем общение с подписчиками',
 'digital-id.create-id':'Цифровой ID готов!\nНужные подтверждения всегда рядом',
 'digital-id.hotel':'Мишка заселился в отель!\nТеперь можно отдохнуть',
 'digital-id.benefit':'Льгота подтверждена!\nМишке доступен студенческий билет',
 'communication.call':'Звонок состоялся!\nБлизкие на связи, даже издалека',
 'communication.message':'Сообщения отправлены!\nОбщайтесь на максимум!',
 'communication.reaction':'Стикер отправлен!\nДобавили эмоций в переписку',
 'business.platform':'Профиль подтверждён!\nНачинаем знакомить клиентов с бизнесом',
 'business.channel':'Поздравляем!\nО вас узнало больше людей и выросло количество заказов',
 'business.bot':'Чат-бот готов!\nПоможет с заказами и вопросами'
});
export const MISSION_COMPLETIONS=Object.freeze({
 blogger:'Миссия пройдена!\nТеперь вы знаете, как создавать канал, общаться с подписчиками и следить за статистикой',
 'digital-id':'Миссия пройдена!\nТеперь вы знаете, как создавать Цифровой ID, заселяться в отель, подтверждать льготу и возраст',
 communication:'Миссия пройдена!\nТеперь вы знаете, как совершать видеозвонки, отправлять голосовые и видеосообщения, делиться стикерами и историями',
 business:'Миссия пройдена!\nТеперь вы знаете, как регистрировать бизнес в MAX, создавать канал и чат-бота, собирать витрину товаров'
});
export const COMPLETION_SCREENS=Object.freeze({
 'blogger.channel.created':'blogger.channel',
 'blogger.comments.result':'blogger.comments',
 'blogger.comments.returned-post':'blogger.comments',
 'blogger.statistics.statistics':'blogger.statistics',
 'digital-id.create-id.ready':'digital-id.create-id',
 'digital-id.hotel.result':'digital-id.hotel',
 'digital-id.benefit.result':'digital-id.benefit',
 'digital-id.age.result':'digital-id.age',
 'communication.call.result':'communication.call',
 'communication.message.video-sent':'communication.message',
 'communication.reaction.sent':'communication.reaction',
 'communication.story.ready':'communication.story',
 'business.platform.ready':'business.platform',
 'business.channel.result':'business.channel',
 'business.bot.result':'business.bot',
 'business.store.result':'business.store'
});
export const completionCopy=taskId=>TASK_COMPLETIONS[taskId]??MISSION_COMPLETIONS[taskId?.split('.')[0]]??'';
export function applyCompletionCopy(catalog){
 for(const [id,taskId]of Object.entries(COMPLETION_SCREENS)){
  const screen=catalog.tasks[taskId]?.screens[id];
  if(screen)screen.instruction=completionCopy(taskId);
 }
 for(const [id,copy]of Object.entries(MISSION_COMPLETIONS))if(catalog.missions[id])catalog.missions[id].completionText=copy;
 catalog.completionCopyRevision='completion-copy-20261023';
 return catalog;
}
