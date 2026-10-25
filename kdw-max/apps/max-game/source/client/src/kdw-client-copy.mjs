// Non-final reference copy from the client's 23 October review.
// Task/mission endings live separately in kdw-completion-copy.mjs.
export const CLIENT_INSTRUCTIONS = Object.freeze({
 'digital-id.create-id.start':'Создадим Цифровой ID —\nэто откроет больше возможностей!',
 'digital-id.create-id.confirm':'Подтвердим вход в MAX через Госуслуги',
 'digital-id.create-id.quick':'Включим вход по лицу или отпечатку пальца — по желанию',
 'digital-id.hotel.present':'Для заселения подтвердим личность — предъявим Цифровой ID',
 'digital-id.benefit.present':'Для покупки льготного студенческого билета\nпредъявим Цифровой ID',
 'digital-id.age.present':'Для покупок на кассе подтвердим возраст с помощью Цифрового ID',
 'business.channel.create':'Создадим канал для вашего бизнеса и поделимся важными обновлениями, акциями и новостями',
 'business.bot.filled':'Заполним данные о чат-боте — логотип, название, и выберем задачи, которые он будет решать',
 'business.bot.ready':'Чат-бот почти готов!\nОсталось только дождаться публикации'
});
export function applyClientCopy(catalog){
 for(const task of Object.values(catalog.tasks))for(const [id,screen] of Object.entries(task.screens)){
  if(CLIENT_INSTRUCTIONS[id])screen.instruction=CLIENT_INSTRUCTIONS[id];
 }
 catalog.clientCopyRevision='client-comments-20261023';
 return catalog;
}
