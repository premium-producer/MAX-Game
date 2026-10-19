import {ID_TASKS} from './journey-id.mjs';
// Test scenarios demonstrate the proposed journey, not production integrations.
export const PRESENTATION_QR={url:'https://max.ru/',image:'./assets/presentation/max-site-qr.png',label:'Официальный сайт MAX · max.ru'};
const t=(title,copy,scene,options=['Продолжить'],extra={})=>({title,copy,scene,options,correct:'*',presentation:true,...extra});
export const PRESENTATION_TASKS={
 'demo-id':ID_TASKS,
 'demo-benefit':[
  t('В музее','Мишка подходит к музею. Нажмите «Далее» на телефоне. Создание ID и учебное подтверждение в Госуслугах уже пройдены.','Льгота в музее',['Далее']),
  t('Предъявление ID','Предъявите учебный Цифровой ID сотруднику музея, чтобы получить студенческую льготу. После выполнения появится QR-код официального сайта MAX.','Проверка статуса',['Получить льготу через ID'],{result:'Льгота получена в деморежиме'})],
 'demo-account':[
  t('MAX бизнес','Этап ID и Госуслуг добавлен для презентации и не означает реального требования для подключения бизнеса.','MAX бизнес',['Войти в MAX бизнес']),
  t('Бизнес-аккаунт','Подключите учебный бизнес-аккаунт. Реальный аккаунт не создаётся.','Подключение бизнеса',['Подключить бизнес-аккаунт'],{result:'Бизнес подключён в деморежиме'})],
 'demo-tool':[
  t('Инструмент продвижения','Выберите один инструмент. Все три проходить не нужно.','Выбор инструмента',['Канал','Бот для заказов','Витрина товаров']),
  t('Запуск инструмента','Выполните действие выбранного инструмента.','Продвижение'),
  t('Результат продвижения','Завершите выбранный сценарий.','Результат',['Показать QR'],{result:'Инструмент продвижения запущен'})]
};
const node=(id,label,requires=[])=>({id,label,detail:label,requires});
const base=[node('demo-id','Создать Цифровой ID')];
export const PRESENTATION_MISSIONS=[
 {id:'demo-benefit',number:5,start:'Открыть MAX',finish:'QR MAX',presentation:true,title:'Получение льготы · тест',cta:'Получить льготу',description:'Цифровой ID и Госуслуги → льгота → QR',steps:[...base,node('demo-benefit','Получить льготу',['demo-id'])],result:'MAX → Цифровой ID → Госуслуги (демо) → льгота. Путь завершён.',qr:PRESENTATION_QR},
 {id:'demo-business',number:6,start:'Открыть MAX',finish:'QR MAX',presentation:true,title:'Продвижение бизнеса · тест',cta:'Продвигать бизнес',description:'Цифровой ID и Госуслуги → бизнес → QR',steps:[...base,node('demo-account','Подключить бизнес',['demo-id']),node('demo-tool','Запустить продвижение',['demo-account'])],result:'MAX → Цифровой ID → Госуслуги (демо) → бизнес → инструмент. Путь завершён.',qr:PRESENTATION_QR}
];
export const presentationMission=id=>PRESENTATION_MISSIONS.find(m=>m.id===id);
export const presentationSteps=id=>presentationMission(id)?.steps.map(s=>s.id);
export function presentationTaskFor(object){
 const task=PRESENTATION_TASKS[object?.step]?.[object?.stage];if(!task)return null;
 if(object.step!=='demo-tool'||!object.stage)return task;
 const branch=object.answers?.[0]??0;
 const actions=[['Создание канала','Создайте канал компании.','Создать канал'],['Бот для заказов','Подключите бота для приёма заказов.','Запустить бота'],['Витрина товаров','Подключите мини-приложение с витриной.','Подключить витрину']];
 const finishes=[['План публикаций','Запланируйте первый пост.','Запланировать пост и показать QR'],['Первый заказ','Примите учебный заказ через бота.','Принять заказ и показать QR'],['Витрина готова','Откройте витрину для клиентов.','Открыть витрину и показать QR']];
 const [title,copy,option]=(object.stage===1?actions:finishes)[branch];return {...task,title,copy,scene:title,options:[option]};
}
