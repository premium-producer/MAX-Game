import {CHANNEL_CATALOG} from './channel-catalog.mjs';
import {MISSION_ASSETS} from './mission-assets.mjs';

// Semantic source content, based on the accepted client content map. No renderer.
const freeze = o => {if(o && typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
export const MISSION_CONTENT_REVISION='missions-20261002-v2';
const tasks={};
function task(id, title, rows, device='phone') {
 const screens={};
 rows.forEach((row,i)=>{
  const [key,asset,copy,labels=['Продолжить'],extra={}]=row, screenId=`${id}.${key}`;
  const next=i+1<rows.length?`${id}.${rows[i+1][0]}`:null;
  screens[screenId]={screenId,deviceKind:device,assetId:asset?`media.${asset}`:null,instruction:copy,annotations:[],missing:extra.missing??null,automaticMs:extra.automaticMs??null,
   actions:labels.map((label,j)=>({actionId:`${screenId}.action-${j+1}`,label,placement:'below-screen',outcome:extra.outcomes?.[j]??(extra.missing?{kind:next?'skip-screen':'skip-task',screenId:next}:next?{kind:'navigate',screenId:next}:{kind:'complete-task'})}))};
 });
 tasks[id]={taskId:id,title,startScreenId:`${id}.${rows[0][0]}`,screens};
}
tasks['blogger.channel']={taskId:'blogger.channel',title:'Канал',startScreenId:CHANNEL_CATALOG.startScreenId,screens:structuredClone(CHANNEL_CATALOG.screens),coreCatalog:CHANNEL_CATALOG};
for(const screen of Object.values(tasks['blogger.channel'].screens)){screen.missing=null;screen.automaticMs=null;}
task('blogger.comments','Общение с подписчиками',[
 ['post',91755,'Начнём общаться с подписчиками. Откройте комментарии.',['Комментарии']],
 ['input',91944,'Ответьте подписчику на его комментарий.',['Написать ответ']],
 ['reply',91998,'Подготовленный ответ можно отправить в обсуждение.',['Отправить']],
 ['sent',91854,'Ответ появился в обсуждении.',['К следующему заданию'],{automaticMs:0}]
]);
task('blogger.statistics','Статистика',[
 ['menu',91497,'Откройте статистику канала.',['Статистика']],
 ['statistics',91501,'Статистика проверена — канал растёт и развивается.',['К следующему заданию']]
]);
task('digital-id.create-id','Создать Цифровой ID',[
 ['start','id-01','Создайте Цифровой ID и откройте для себя больше возможностей.',['Создать QR']],
 ['documents','id-02','Добавьте документы с Госуслуг.',['Добавить документы']],
 ['redirect','id-03','',['Продолжить'],{automaticMs:1100}],
 ['consent','id-05','Разрешите использование документов для Цифрового ID в MAX.',['Предоставить','Отклонить'],{outcomes:[{kind:'navigate',screenId:'digital-id.create-id.confirm'},{kind:'incorrect'}]}],
 ['confirm','id-06','Подтвердите вход в MAX через Госуслуги.',['Подтвердить','Отклонить'],{outcomes:[{kind:'navigate',screenId:'digital-id.create-id.quick'},{kind:'incorrect'}]}],
 ['quick','id-11','Включите вход по лицу или отпечатку пальца — по желанию.',['Включить','Не сейчас'],{outcomes:[{kind:'navigate',screenId:'digital-id.create-id.biometry',answer:{kind:'biometry',value:'enabled'}},{kind:'navigate',screenId:'digital-id.create-id.ready',answer:{kind:'biometry',value:'skipped'}}]}],
 ['biometry','id-12','Включите вход по лицу или отпечатку пальца — по желанию.',['Продолжить'],{automaticMs:1600}],
 ['ready','id-13','Цифровой ID готов к работе! Один ID — разные возможности.',['Продолжить']]
]);
for(const [key,title,base,copy,action] of [
 ['hotel','Отель','hotel','Заселитесь в отель с Цифровым ID.','Заселиться через ID'],
 ['benefit','Льгота','museum','Подтвердите льготу при посещении музея.','Получить льготу через ID'],
 ['age','Подтверждение возраста','age','Подтвердите возраст с Цифровым ID.','Подтвердить возраст через ID']
])task(`digital-id.${key}`,title,[['arrival',`${base}-01-arrival`,copy,['Далее']],['present',`${base}-02-present-id`,copy,[action]]]);
task('communication.call','Видеозвонок',[
 ['chat',85871,'Совершим удобный звонок на максимум!',['Позвонить по видео']],
 ['calling',85847,'Свяжемся по видеозвонку.',['Продолжить'],{automaticMs:1100}],
 ['connected',85865,'Учебный видеозвонок начался. Камера и микрофон не включаются.',['Завершить звонок']]
]);
task('communication.message','Голосовое сообщение / видеокружок',[
 ['voice-start',74200,'А теперь отправим голосовое сообщение.',['Начать запись']],
 ['voice-recording',74231,'Приступим к записи голосового сообщения.',['Продолжить запись'],{automaticMs:0}],
 ['voice-stop',74262,'Остановите запись голосового сообщения.',['Остановить запись']],
 ['voice-preview',74293,'Отправьте голосовое сообщение.',['Отправить']],
 ['voice-sent',74215,'Голосовое сообщение отправлено. Теперь запишем видеосообщение.',['Продолжить'],{automaticMs:0}],
 ['video-start',73633,'Приступим к записи видеосообщения.',['Переключить формат']],
 ['video-ready',73648,'Запишите видеосообщение.',['Начать запись']],
 ['video-recording',73690,'Запись видеосообщения идёт.',['Продолжить запись'],{automaticMs:0}],
 ['video-stop',73731,'Остановите запись видеосообщения.',['Остановить запись']],
 ['video-preview',73772,'Отправьте видеосообщение.',['Отправить']],
 ['video-sent',73617,'Видеосообщение отправлено.',['К следующему заданию']]
]);
task('communication.reaction','Стикер / реакция',[['missing',null,'Поделитесь эмоцией в диалоге.',['Пропустить недоступный шаг'],{missing:'Нет клиентских экранов выбора и отправки эмоции'}]]);
task('communication.story','История',[
 ['audience',74309,'Добавьте историю и выберите, кто её увидит.',['Продолжить']],
 ['publish',74315,'Опубликуйте историю.',['Опубликовать']],
 ['missing',null,'Корректный финал публикации ещё не предоставлен.',['Пропустить недоступный шаг'],{missing:'Нет подтверждённого успешного финала истории'}]
]);
task('business.sector','Сфера бизнеса',[
 ['choose',null,'Выберите сферу бизнеса.',['Кофейня','Магазин','Услуги'],{missing:'Нет клиентского экрана выбора сферы',outcomes:['coffee','shop','services'].map(value=>({kind:'skip-task',answer:{kind:'business-sector',value}}))}]
],'pc');
task('business.platform','Платформа MAX для бизнеса',[
 ['login',null,'Войдём на платформу MAX для бизнеса и пройдём верификацию.',['Пропустить недоступный шаг'],{missing:'Нет оригинального экрана входа в платформу'}],
 ['verification',99709,'Подтвердите организацию.',['Продолжить'],{missing:'Оригинал содержит СберБизнес ID; корректный вариант без Сбера не предоставлен'}]
],'pc');
task('business.channel','Канал бизнеса',[
 ['create',100205,'Создайте новый канал для бизнеса.',['Создать новый канал']],
 ['continue',100211,'Продолжите создание канала в MAX.',['Создать канал']],
 ['missing',null,'Создайте канал и опубликуйте новости. Бизнес становится популярнее, заказов больше — пора автоматизировать их приём.',['Пропустить недоступный шаг'],{missing:'Нет подтверждённых экранов мобильного создания бизнес-канала, публикации и расписания'}]
],'pc');
task('business.bot','Бот для приёма заказов',[
 ['create',99725,'Создайте чат-бота для работы с клиентами.',['Заполнить учебный пример']],
 ['name',99734,'Заполните название чат-бота.',['Продолжить']],
 ['details',99750,'Подготовьте настройки бота.',['Продолжить']],
 ['ready',99766,'Создайте учебного чат-бота.',['Создать бота']],
 ['settings',99817,'Настройте возможности чат-бота.',['Настроить']],
 ['expanded',99846,'Настройте расширенные возможности бота.',['Продолжить']],
 ['save',100034,'Сохраните настройки бота.',['Сохранить']],
 ['advanced',99940,'Проверьте расширенные настройки бота.',['К приёму заказов']],
 ['missing','bot-delivery','Автоматизируйте ответы и приём заказов. Заказов стало больше — пора показать ассортимент товаров и услуг.',['Пропустить недоступный шаг'],{missing:'Нет подтверждённого процесса принятия нового заказа; доступен только контекст доставки'}]
],'pc');
task('business.store','Мини-приложение',[
 ['connect',100117,'Подключите мини-приложение к боту.',['Сохранить изменения']],
 ['missing',null,'Добавьте товар и откройте витрину для клиентов.',['Пропустить недоступный шаг'],{missing:'Нет клиентской карточки товара и товарной витрины'}]
],'pc');
const businessSequence=['business.sector','business.platform','business.channel','business.bot','business.store'];
const completionText={
 blogger:'Канал создан. Общение с подписчиками настроено. Статистика и рост канала изучены.',
 'digital-id':'Цифровой ID создан. Заселение в отель, подтверждение льготы и возраста — все ситуации пройдены.',
 communication:'Вы познакомились с возможностями общения в MAX.',
 business:'Ты подключил полную воронку продаж и теперь развиваешь свой бизнес в MAX. Ты стал успешным!',
 'benefit-test':'Цифровой ID создан. Применение льготы изучено.',
 'business-test':'Ты подключил полную воронку продаж и теперь развиваешь свой бизнес в MAX. Ты стал успешным!'
};
const m=(missionId,title,taskIds,test=false)=>({missionId,title,taskIds,test,completionText:completionText[missionId],qr:{assetId:'official.max-qr',url:'https://max.ru/',label:'Официальный сайт MAX'},missing:[...new Set(taskIds.flatMap(id=>Object.values(tasks[id].screens).map(s=>s.missing).filter(Boolean)))]});
export const MISSION_CATALOG=freeze({schemaVersion:1,contentRevision:MISSION_CONTENT_REVISION,assets:{...MISSION_ASSETS,...CHANNEL_CATALOG.assets},tasks,missions:{
 blogger:m('blogger','Стать блогером',['blogger.channel','blogger.comments','blogger.statistics']),
 'digital-id':m('digital-id','Все возможности с Цифровым ID',['digital-id.create-id','digital-id.hotel','digital-id.benefit','digital-id.age']),
 communication:m('communication','Общение на максимум',['communication.call','communication.message','communication.reaction','communication.story']),
 business:m('business','Продвижение бизнеса',businessSequence),
 'benefit-test':m('benefit-test','Получение льготы · тест',['digital-id.create-id','digital-id.benefit'],true),
 'business-test':m('business-test','Продвижение бизнеса · тест',businessSequence,true)
}});
export const BUSINESS_TASKS=freeze({channel:'business.channel',bot:'business.bot',store:'business.store'});
