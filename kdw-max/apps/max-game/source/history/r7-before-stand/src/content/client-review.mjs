import {MISSION_CATALOG} from './mission-catalog.mjs';

// Compatibility projection for historical Site consumers. The shared catalog
// owns content and route order; this module contains no game rules.
const aliases={'digital-id.create-id':'id.create','digital-id.hotel':'id.hotel','digital-id.benefit':'id.benefit','digital-id.age':'id.age','communication.message':'communication.messages','business.store':'business.miniapp'};
export const reviewTaskId=id=>aliases[id]??id;
export const canonicalTaskId=id=>Object.keys(aliases).find(key=>aliases[key]===id)??id;
export const CLIENT_REVIEW_REVISION=MISSION_CATALOG.contentRevision;
export const CLIENT_REVIEW_TASKS=Object.freeze(Object.fromEntries(Object.values(MISSION_CATALOG.tasks).map(task=>{
 const screens=Object.values(task.screens),available=screens.filter(screen=>screen.assetId),missing=[...new Set(screens.map(screen=>screen.missing).filter(Boolean))];
 const taskId=reviewTaskId(task.taskId);
 return [taskId,Object.freeze({taskId,canonicalTaskId:task.taskId,title:task.title,device:screens[0].deviceKind,
  media:available.map(screen=>MISSION_CATALOG.assets[screen.assetId].path),
  coverage:missing.length?(available.length?'partial':'missing'):'complete',gap:missing.length?missing.join('; '):null})];
})));
const descriptions={blogger:'Создайте канал, ответьте подписчику и изучите статистику.',
 'digital-id':'Один ID — разные возможности.',communication:'Звонок, голосовое и видео, эмоции и история.',
 business:'Сфера, верификация, канал, бот и мини-приложение для бизнеса.',
 'benefit-test':'Тестовая миссия: знакомство с цифровым документом.',
 'business-test':'Тестовая миссия: полный демонстрационный путь бизнеса.'};
export const CLIENT_REVIEW_MISSIONS=Object.freeze(Object.values(MISSION_CATALOG.missions).map(m=>Object.freeze({
 id:m.missionId==='digital-id'?'id':m.missionId,canonicalMissionId:m.missionId,title:m.title,
 description:descriptions[m.missionId],taskIds:m.taskIds.map(reviewTaskId),branchTaskIds:[],
 art:m.missionId==='blogger'?'channel':['digital-id','benefit-test'].includes(m.missionId)?'id':null,test:m.test
})));
export const siteMenuMissions=CLIENT_REVIEW_MISSIONS.map(m=>({id:m.id,title:m.title,description:m.description,art:m.art,test:m.test,
 steps:m.taskIds.map(id=>CLIENT_REVIEW_TASKS[id].title),hasGaps:m.taskIds.some(id=>CLIENT_REVIEW_TASKS[id].coverage!=='complete')}));
