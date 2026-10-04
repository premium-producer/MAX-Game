// Editorial catalogue, deliberately independent from the mutable game backend.
// The preserved full-interface plugin is the baseline, client comments are patches.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=p=>fs.readFile(new URL(p,import.meta.url),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const normalize=p=>p?.replace(/^\.\//,'');
const LATE='apps/max-game/docs/MISSIONS.md#общие-правки-клиента--дополнение-02102026';
const STEP={channel:'blogger.channel',comments:'blogger.comments',statistics:'blogger.statistics','create-id':'digital-id.create-id',hotel:'digital-id.hotel',benefit:'digital-id.benefit',age:'digital-id.age',call:'communication.call',message:'communication.message',group:'communication.group',reaction:'communication.reaction',story:'communication.story',account:'business.platform','business-channel':'business.channel','business-bot':'business.bot','business-store':'business.store','demo-id':'benefit-test.id','demo-benefit':'benefit-test.benefit','demo-account':'business-test.platform','demo-tool':'business-test.tools'};
const ICON={channel:'channel',comments:'comments',statistics:'statistics','create-id':'id',hotel:'hotel',benefit:'benefit',age:'age',call:'call',message:'message',group:'group',reaction:'reaction',story:'story',account:'sector','business-channel':'channel','business-bot':'bot','business-store':'store','demo-id':'id','demo-benefit':'benefit','demo-account':'sector','demo-tool':'sector'};
const labelKind={task:'Экран задания',result:'Результат задания',error:'Неверный ответ',branch:'Выбор инструмента',palm:'Начало · ладонь',ring:'Иконки вокруг ладони',line:'Иконки в линию',complete:'Финал миссии',menu:'Меню миссий'};

export async function restoredCatalog(){
 const [ui,auditText,reviewText,baselineText]=await Promise.all([read('../max-journey/internal/ui.html'),read('../../../reports/max-plugin-content-audit-20261002/comparison.json'),read('../../max-game/max-review.json'),read('./additions-baseline.json')]);
 const audit=JSON.parse(auditText),review=JSON.parse(reviewText),baseline=JSON.parse(baselineText);
 const expected=audit.sources.find(s=>s.path.endsWith('max-journey/internal/ui.html'));
 if(sha(Buffer.from(ui))!==expected.sha256)throw Error('The preserved full-interface plugin changed; audit its new revision first');
 const start=ui.indexOf('const DATA='),end=ui.indexOf(';\r\nconst $=',start)>=0?ui.indexOf(';\r\nconst $=',start):ui.indexOf(';\nconst $=',start);
 const old=JSON.parse(ui.slice(start+11,end));
 const html=Buffer.from(old.html,'base64').toString(),assetStart=html.indexOf('const offlineAssets='),assetEnd=html.indexOf(';\nconst asset=',assetStart);
 const offline=JSON.parse(html.slice(assetStart+20,assetEnd));
 const config=JSON.parse(Buffer.from(offline['config/client-missions.json'].split(',')[1],'base64'));
 const comments=new Map(review.commentMap.map(c=>[c.id,c]));
 const original=new Map(old.catalogs.reveal.map(s=>[s.id,s]));
 const tasks={},missions={},assets={},media={},all=[];
 const catalog={schemaVersion:2,contentRevision:'restored-client-review-20261002-v2',tasks,missions,assets,
  reviewSource:{fileKey:review.fileKey,exportedAt:review.exportedAt,legacyRevision:old.revision,policy:'legacy content + addressed client comments; removals retained in yellow',laterRequirements:LATE},legacyCoverage:[],commentLedger:[]};
 const missionIds=['blogger','digital-id','communication','business','demo-benefit','demo-business'];
 for(const mid of missionIds){
  const missionId={'demo-benefit':'benefit-test','demo-business':'business-test'}[mid]??mid;
  const source=config.missions.find(m=>m.id===mid),sample=old.catalogs.reveal.find(s=>s.mission===mid);
  missions[missionId]={missionId,legacyMissionId:mid,title:source?.title??sample.group,taskIds:[],test:mid.startsWith('demo-'),missing:[],completionText:source?.result??(mid==='demo-benefit'?'MAX → Цифровой ID → Госуслуги (демо) → льгота. Путь завершён.':'MAX → Цифровой ID → Госуслуги (демо) → бизнес → инструмент. Путь завершён.'),qr:{assetId:'official.max-qr',label:'Официальный сайт MAX',url:'https://max.ru/'}};
 }
 function register(assetPath,width,height){
  assetPath=normalize(assetPath);if(!assetPath)return null;
  const existing=Object.values(baseline.assets).find(a=>a.path===assetPath);
  const assetId=existing?.assetId??'legacy.'+assetPath.split('/').at(-1).replace(/\.(png|svg|webp)$/,'');
  if(assets[assetId])return assetId;
  const uri=offline[assetPath];if(!uri)throw Error('Missing preserved bytes: '+assetPath);
  const cut=uri.indexOf(','),mimeType=uri.slice(5,uri.indexOf(';')),bytes=Buffer.from(uri.slice(cut+1),'base64');
  if(mimeType==='image/png'){width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);}
  const hash=sha(bytes),declared=old.sources['artifacts/max-game/public/'+assetPath];
  if(declared&&hash!==declared)throw Error('Historical asset SHA mismatch: '+assetPath);
  assets[assetId]={assetId,path:assetPath,width:width??existing?.width??360,height:height??existing?.height??800,mimeType,sha256:hash,bytes:bytes.length};
  media[assetId]=mimeType==='image/svg+xml'?{svg:bytes.toString('utf8')}:{base64:bytes.toString('base64')};return assetId;
 }
 register('assets/presentation/max-site-qr.png');
 function ensureTask(missionId,id,title,iconKey){
  // Test missions have their own copy and old screen IDs; never alias their texts.
  if(!tasks[id]){tasks[id]={taskId:id,title,iconKey,screens:{}};missions[missionId].taskIds.push(id);}
  return tasks[id];
 }
 function patch(s,id,mode='exact',text){
  const c=comments.get(id);if(!c)throw Error('Unknown client comment '+id);
  s.review.comments=[...new Set([...s.review.comments,id])];
  if(mode==='remove'){s.instruction='';s.review.textRemoved=true;}
  else if(mode==='exact')s.instruction=c.message;
  else if(mode==='last-paragraph')s.instruction=c.message.split(/\n\s*\n/).at(-1).trim();
  else if(mode==='term')s.instruction=text;
  s.review.textChanged=true;s.instructionSource={kind:'client-comment',commentId:id,mode,originalComment:c.message,fileKey:review.fileKey};
 }
 function remove(s,reason,ids=[]){s.review.content='remove';s.review.reasons.push(reason);s.review.comments=[...new Set([...s.review.comments,...ids])];}
 function promote(s,reason,ids=[]){s.review.content='added';s.supplemental=false;s.review.reasons.push(reason);s.review.comments=[...new Set([...s.review.comments,...ids])];}
 function missing(s,reason){s.missing=reason;s.review.reasons.push(reason);}
 const exactByLegacy={
  'reveal-005':['1948114254','last-paragraph'],'reveal-006':['1948114254','last-paragraph'],
  'reveal-007':['1948125302'],'reveal-008':['1948125302'],'reveal-014':['1948126808'],'reveal-016':['1948128129'],
  'reveal-017':['1948132883'],'reveal-018':['1948132883'],'reveal-029':['1948143428'],'reveal-032':['1948144941'],
  'reveal-037':['1948755352'],'reveal-039':['1949245720','remove'],'reveal-044':['1949249148'],'reveal-046':['1949249679'],'reveal-047':['1949306461','remove'],'reveal-048':['1949250740'],
  'reveal-053':['1948760459'],'reveal-063':['1949259240','last-paragraph'],'reveal-065':['1949260033'],'reveal-069':['1949260371','remove'],
  'reveal-082':['1949263050'],'reveal-083':['1949263629'],'reveal-086':['1949263927'],
  'reveal-124':['1949355857'],'reveal-126':['1949366519'],'reveal-127':['1949366519'],'reveal-128':['1949366519']
 };
 for(const row of audit.oldScreens){
  const saved=original.get(row.id),oldMission=row.mission??'blogger',missionId={'demo-benefit':'benefit-test','demo-business':'business-test'}[oldMission]??oldMission;
  const mission=missions[missionId];if(!mission)throw Error('Unknown mission '+missionId);
  const step=row.step;let taskId;
  if(['menu','palm','ring','line'].includes(row.kind))taskId=missionId+'.intro';
  else if(row.kind==='complete')taskId=missionId+'.final';
  else if(row.kind==='branch')taskId=missionId+'.tool-choice';
  else taskId=oldMission==='demo-business'&&step==='demo-id'?'business-test.id':STEP[step];
  if(!taskId)throw Error('Unmapped old screen '+row.id);
  const title=row.kind==='complete'?'Финал миссии':taskId.endsWith('.intro')?'MAX · Начало':row.kind==='branch'?'Выбрать инструмент':row.name.split(' · ')[0];
  const task=ensureTask(missionId,taskId,title,ICON[step]??'missions');
  const node=saved.state.session.runs?.[oldMission]?.find(n=>n.step===step);
  let copy=row.originalTaskCopy??'',originalTitle=row.originalTaskTitle??'',options=row.originalOptions??[];
  if(step==='demo-tool'&&row.stage>0&&row.kind!=='result'){
   const branch=node?.answers?.[0]??0;
   const variants=row.stage===1?[['Создание канала','Создайте канал компании.'],['Бот для заказов','Подключите бота для приёма заказов.'],['Витрина товаров','Подключите мини-приложение с витриной.']]:[['План публикаций','Запланируйте первый пост.'],['Первый заказ','Примите учебный заказ через бота.'],['Витрина готова','Откройте витрину для клиентов.']];
   [originalTitle,copy]=variants[branch];
   options=[(row.stage===1?['Создать канал','Запустить бота','Подключить витрину']:['Запланировать пост и показать QR','Принять заказ и показать QR','Открыть витрину и показать QR'])[branch]];
  }
  if(row.kind==='result'){
   const lines=row.savedFigmaTextLines?.map(t=>t.text).join(' ').replace(/\s+/g,' ').trim(),at=lines?.indexOf('Задание выполнено.');
   copy=at>=0?lines.slice(at):['statistics','age','story','business-channel','business-bot','business-store','demo-benefit','demo-tool'].includes(step)?'Задание выполнено. Миссия пройдена.':'Задание выполнено. Открываем следующую возможность.';
   originalTitle=at>=0?lines.slice(0,at).replace(/^ВОЗМОЖНОСТИ MAX\s*/,'').trim():row.originalTaskResult??originalTitle;
  }
  const layout=['menu','palm','ring','line','complete','branch'].includes(row.kind);
  if(layout){copy=row.kind==='complete'?mission.completionText:row.kind==='branch'?'Открой одну возможность для своего бизнеса. Выбери канал, бота или мини-приложение в окне ПК.':'';originalTitle=row.name;}
  const s={screenId:'legacy.'+row.id,taskId,kind:row.kind,name:row.name,deviceKind:row.device?.kind??'phone',assetId:register(row.primaryAsset,row.media?.frames?.[row.mediaIndex??0]?.width,row.media?.frames?.[row.mediaIndex??0]?.height),instruction:copy,originalInstruction:copy,originalTitle,
   annotations:[],actions:row.kind==='task'&&row.default?options.map((label,i)=>({actionId:row.id+'.action-'+i,label,placement:'below-screen',outcome:{kind:'reference-only'}})):[],feedback:saved.state.session.notice??'',
   missing:null,supplemental:!row.default,presentationOnly:row.kind==='result',instructionSource:{kind:'preserved-plugin',revision:old.revision,screenId:row.id},
   source:{legacyId:row.id,nodeId:row.nodeId,mission:oldMission,step,stage:row.stage,mediaIndex:row.mediaIndex??0,revision:old.revision},
   review:{content:'unchanged',textChanged:false,titleRemoved:!layout,comments:!layout?['1948127657']:[],reasons:[]}};
  if(!layout)s.review.textChanged=true; // Global client request removes the old panel heading.
  if(layout){s.contentKind='layout';s.layoutKind=row.kind;s.layoutLabels=[{key:'max',label:'MAX'},...(config.missions.find(m=>m.id===oldMission)?.steps??saved.state.session.runs?.[oldMission]??[]).map(n=>({key:ICON[n.id??n.step]??'missions',label:n.label??old.catalogs.reveal.find(x=>x.mission===oldMission&&x.step===n.step)?.name.split(' · ')[0]??n.step}))];}
  if(!layout&&!s.assetId)missing(s,'В прежнем плагине нет клиентского изображения этого этапа. Содержание и текст сохранены.');
  if(exactByLegacy[row.id])patch(s,...exactByLegacy[row.id]);
  // Apply identical ID changes in the two originally separate test flows.
  if(step==='demo-id'){
   const p={0:['1948755352'],2:['1949245720','remove'],5:['1949249148'],6:['1949249679'],7:['1949306461','remove'],8:['1949250740']}[row.stage];
   if(row.kind!=='result'&&p)patch(s,...p);
  }
  if(['create-id','demo-id'].includes(step)&&row.stage===3)remove(s,'Клиент просил убрать экран согласия для Минцифры.',['1949301472']);
  if(row.id==='reveal-031')remove(s,'Пропустить этот экран статистики и перейти к финальному.',['1948144003']);
  if(step==='group')remove(s,'Групповой чат исключён поздним клиентским требованием.');
  if(oldMission==='demo-business'&&step==='demo-id')remove(s,'Цифровой ID исключён из тестового бизнес-пути.',['1949460299']);
  if(row.id==='reveal-082'||row.kind==='branch'||step==='demo-tool'&&row.stage===0)remove(s,'Выбор только одного варианта отменён: последовательное прохождение по поздним требованиям.');
  if(['reveal-006','reveal-008'].includes(row.id))promote(s,'Пропущенный обязательный этап создания канала вынесен из галереи.',['1948123062']);
  if(['reveal-009','reveal-010','reveal-011','reveal-012','reveal-013'].includes(row.id))promote(s,'Добавлен в последовательность по замечанию о пропущенной приватности.',['1948131466']);
  if(['reveal-011','reveal-012'].includes(row.id)){
   const annotated=Object.values(baseline.tasks['blogger.channel'].screens).find(x=>x.assetId===s.assetId);
   s.annotations=structuredClone(annotated?.annotations??[]);
  }
  if(step==='comments'&&['frame-91189.png','frame-91287.png','frame-91338.png','frame-91389.png'].some(f=>row.primaryAsset?.endsWith(f)))remove(s,'Заменить сценарий первого комментария автора: подписчик должен написать первым.',['1948135341']);
  if(step==='comments'&&['frame-91755.png','frame-91944.png','frame-91998.png','frame-91854.png'].some(f=>row.primaryAsset?.endsWith(f)))promote(s,'Ответ на уже существующий комментарий подписчика.',['1948135341']);
  if(['hotel','benefit','age','demo-benefit'].includes(step)&&row.kind==='task'&&row.stage===1){
   if(step==='hotel')s.review.comments.push('1948759765','1949251568','1949283636');
   if(['benefit','demo-benefit'].includes(step))s.review.comments.push('1949284692');
   if(step==='age')patch(s,'1949252510','term',copy.replace('чтобы подтвердить возраст','для подтверждения возраста'));
   s.review.reasons.push('Реальный интерфейс в лапах Мишки отложен пользователем; фотография сохранена.');
  }
  if(step==='demo-benefit'&&row.stage===0)patch(s,'1948760459');
  if(row.id==='reveal-051'){s.review.titleRemoved=true;s.review.reasons.push('Название «Заселение с Цифровым ID» учтено как правка заголовка; основное пояснение сохранено.');}
  if(['reveal-081','reveal-058'].includes(row.id))s.review.comments.push(row.id==='reveal-081'?'1949260730':'1949254543');
  if(row.primaryAsset?.endsWith('frame-99709.png')){
   remove(s,'Клиент просил убрать Сбер; старый исходник оставлен только для сверки.',['1948955950','1949356417']);
  }
  if(['reveal-126','reveal-127','reveal-128'].includes(row.id))remove(s,'Клиент просил заменить этот экран возможностей.',['1949364719']);
  if(row.id==='reveal-125')remove(s,'Вместо этого интерфейса нужен отдельный экран выбора сферы.',['1949358609']);
  if(step==='demo-account'&&row.stage===0)patch(s,'1949355857');
  if(row.kind==='complete'&&['business','demo-business'].includes(oldMission))remove(s,'Прежний финал одной ветки заменяется завершением всех трёх бизнес-инструментов.');
  // Text-only removals preserve their screen; missing content never gets manufactured.
  task.screens[s.screenId]=s;all.push(s);catalog.legacyCoverage.push({legacyId:row.id,screenId:s.screenId,taskId,missionId});
 }
 const byId=id=>all.find(s=>s.source?.legacyId===id);
 const assetFromBaseline=id=>{const a=baseline.assets[id];if(!a)throw Error('Missing addition asset '+id);return register(a.path,a.width,a.height);};
 function added(missionId,taskId,key,title,{assetId=null,copy='',copySource=null,missing:gap=null,comments:ids=[],reason='',before=null,kind='task'}={}){
  const task=ensureTask(missionId,taskId,title,taskId.includes('sector')?'sector':taskId.includes('bot')?'bot':taskId.includes('store')?'store':'channel');
  const screenId='added.'+missionId+'.'+key;
  const s={screenId,taskId,kind,name:title,deviceKind:taskId.includes('business')?'pc':'phone',assetId:assetId?assetFromBaseline(assetId):null,instruction:copy,originalInstruction:copySource?.originalInstruction??'',originalTitle:'',annotations:[],actions:[],missing:gap,supplemental:false,presentationOnly:kind==='result',
   instructionSource:copySource?.instructionSource??{kind:'preserved-copy',reason:'No new explanatory text authored'},review:{content:'added',textChanged:!!ids.length,titleRemoved:true,comments:ids,reasons:[reason].filter(Boolean)},source:{addition:true,requirements:LATE}};
  if(!s.assetId&&!s.missing)s.missing='Клиентский материал для нового этапа пока отсутствует.';
  if(before&&task.screens[before]){task.screens=Object.fromEntries(Object.entries(task.screens).flatMap(([id,value])=>id===before?[[screenId,s],[id,value]]:[[id,value]]));}else task.screens[screenId]=s;
  all.push(s);return s;
 }
 // Corrected comments finish, preserving the old result as a yellow reference.
 const commentResult=added('blogger','blogger.comments','comments-result','Результат · ответ подписчику',{assetId:'media.91854',copy:byId('reveal-028').originalInstruction,kind:'result',comments:['1948135341'],reason:'Результат с правильным исходником ответа подписчику.'});
 commentResult.actions=[];
 // Both formats now follow each other; keep the old format picker in yellow.
 const msg=tasks['communication.message'];
 const voiceStart=added('communication',msg.taskId,'voice-start','Голосовое сообщение · начало',{assetId:'media.74200',copy:'А теперь отправим сообщение!',comments:['1949263050','1949267292'],reason:'Начало последовательного сценария вместо выбора только одного формата.'});
 voiceStart.instructionSource={kind:'client-comment',commentId:'1949263050',mode:'first-sentence'};
 const videoStart=added('communication',msg.taskId,'video-start','Видеосообщение · начало',{assetId:'media.73633',copy:comments.get('1949263927').message,comments:['1949263927','1949267292'],reason:'Начало видео после полного голосового сообщения.'});
 const videoResult=added('communication',msg.taskId,'video-sent','Результат · видеосообщение отправлено',{assetId:'media.73617',copy:byId('reveal-100').originalInstruction,kind:'result',comments:['1949267292'],reason:'Отправленное видео в последовательном сценарии; прежний загрузочный кадр сохранён отдельно.'});
 const msgOrder=[byId('reveal-082'),voiceStart,byId('reveal-083'),byId('reveal-092'),byId('reveal-097'),byId('reveal-099'),videoStart,byId('reveal-086'),byId('reveal-093'),byId('reveal-094'),byId('reveal-098'),videoResult,byId('reveal-100')];
 byId('reveal-094').supplemental=false;
 msg.screens=Object.fromEntries([...msgOrder,...Object.values(msg.screens).filter(s=>!msgOrder.includes(s))].map(s=>[s.screenId,s]));
 for(const mid of ['business','business-test']){
  const sector=added(mid,mid+'.sector','sector','Выбор сферы бизнеса',{copy:'Выберите сферу бизнеса для будущих клиентов.',missing:'Нужен отдельный клиентский экран выбора сферы бизнеса.',comments:['1949358609'],reason:'Новый отдельный этап по клиентскому комментарию.'});
  sector.actions=['Кофейня','Магазин','Услуги'].map((label,i)=>({actionId:sector.screenId+'.'+i,label,placement:'below-screen',outcome:{kind:'reference-only'}}));
  const platform=mid==='business'?'business.platform':'business-test.platform';
  added(mid,platform,'platform-login','Вход на платформу',{copy:comments.get('1949355857').message,missing:'Нужен реальный экран входа на платформу MAX для бизнеса.',comments:['1949352863','1949355857'],reason:'Исходник верификации не заменяет экран входа.'});
  added(mid,platform,'verification-no-sber','Верификация без Сбера',{copy:comments.get('1949355857').message,missing:'Нужен корректный клиентский исходник верификации без СберБизнес ID.',comments:['1949356417'],reason:'Замена отмеченного жёлтым исходника.'});
  added(mid,platform,'business-tools','Доступные возможности для бизнеса',{copy:comments.get('1949366519').message,missing:'Нужен новый клиентский экран доступных бизнес-возможностей.',comments:['1949364719','1949366519'],reason:'Клиент просил заменить экран; текст применён сразу.'});
  const final=added(mid,mid+'.final','business-final','Итог полного бизнес-пути',{copy:baseline.missions[mid].completionText,reason:'Поздний клиентский сценарий: канал → бот → мини-приложение.',kind:'complete'});
  final.missing=null;final.contentKind='layout';final.layoutKind='complete';final.instructionSource={kind:'later-client-scenario',source:LATE};final.review.textChanged=true;
 }
 // Later business route requires all tools also in the test mission; keep its legacy rows.
 for(const id of ['business.channel','business.bot','business.store']){
  const target='business-test.'+id.split('.').at(-1),t=ensureTask('business-test',target,tasks[id].title,tasks[id].iconKey);
  for(const base of Object.values(tasks[id].screens)){
   const s=structuredClone(base);s.screenId='added.test.'+base.screenId;s.taskId=target;s.source={...base.source,addition:true,reusedLegacyId:base.source.legacyId};delete s.source.legacyId;
   s.review.content='added';s.review.reasons.push('Все три инструмента последовательно в тестовом бизнесе по поздним требованиям.');t.screens[s.screenId]=s;all.push(s);
  }
 }
 // Do not collapse originally separate missing steps into a single generic red card.
 for(const s of all){
  if(s.source?.step==='business-channel'&&!s.assetId)missing(s,'Не предоставлен клиентский материал этапа «'+s.name+'».');
  if(s.source?.step==='business-store'&&!s.assetId)missing(s,'Не предоставлен клиентский экран товара / витрины для этого отдельного этапа.');
  if(s.source?.step==='business-bot'&&s.source.stage>=2)missing(s,'Есть контекст доставки, но нет подтверждённого клиентского сценария приёма нового заказа.');
  if(s.source?.step==='reaction')missing(s,'Не предоставлен клиентский экран выбора / отправки стикера или реакции.');
  if(s.source?.step==='story'&&s.kind==='result')missing(s,'Нужен подтверждённый успешный финал истории. Прежний кадр оставлен для сверки.');
  if(s.source?.step==='business-store'&&assets[s.assetId]?.path.endsWith('frame-99940.png')){s.supplemental=true;s.review.reasons.push('Исходник показывает настройки бота. Для мини-приложения есть отдельный 100117; этот кадр сохранён как исходный материал.');}
 }
 // Missing requested source icons are represented honestly next to their existing stand-ins.
 for(const mid of ['business','business-test'])for(const tid of missions[mid].taskIds){
  if(/\.(channel|bot|store|platform)$/.test(tid))tasks[tid].iconMissing='Клиентская B2B-иконка не подтверждена; текущая пиктограмма — прежняя временная.';
 }
 for(const m of Object.values(missions)){
  const intro=m.taskIds.filter(id=>id.endsWith('.intro')),final=m.taskIds.filter(id=>id.endsWith('.final'));
  const sector=m.taskIds.filter(id=>id.endsWith('.sector'));
  m.taskIds=[...intro,...sector,...m.taskIds.filter(id=>!intro.includes(id)&&!final.includes(id)&&!sector.includes(id)),...final];
  m.missing=[...new Set(m.taskIds.flatMap(id=>Object.values(tasks[id].screens).map(s=>s.missing).filter(Boolean)))];
 }
 // Extra gallery/error states remain visible after the main sequence, never silently omitted.
 for(const task of Object.values(tasks))task.screens=Object.fromEntries(Object.values(task.screens).sort((a,b)=>Number(a.supplemental)-Number(b.supplemental)).map(s=>[s.screenId,s]));
 // Keep the complete review ledger, including comments that cannot be solved by copy edits.
 const pendingDisposition={'1948898061':'needs-context-for-bubble-time','1948929114':'missing-client-B2B-icons','1948931427':'missing-client-B2B-icons','1949242884':'missing-client-B2B-icons','1948955950':'replacement-missing-old-kept-yellow','1949356417':'replacement-missing-old-kept-yellow','1949364719':'replacement-missing-old-kept-yellow','1949358609':'new-screen-missing-marked-red','1948932826':'separate-missing-stages-restored-red','1949271032':'semantic-note-preserved-not-a-new-game-rule'};
 for(const c of review.commentMap)if(c.association?.status!=='outside-selection')for(const s of all)if(s.source?.nodeId&&c.association?.screenIds?.includes(s.source.nodeId)&&!s.review.comments.includes(c.id))s.review.comments.push(c.id);
 catalog.commentLedger=review.commentMap.map(c=>({commentId:c.id,message:c.message,parentId:c.parent_id,status:c.association?.status,resolvedAt:c.resolved_at,targets:all.filter(s=>s.review.comments.includes(c.id)).map(s=>s.screenId),association:c.association,disposition:c.association?.status==='outside-selection'?'outside-MAX-selection':['1949283636','1949284692'].includes(c.id)?'deferred-by-user':c.id==='1949288484'?'question-not-a-change':pendingDisposition[c.id]??'addressed-in-editorial-map'}));
 catalog.summary={missions:6,legacyScreens:old.catalogs.reveal.length,screenCards:all.length,assets:Object.keys(assets).length,removed:all.filter(s=>s.review.content==='remove').length,added:all.filter(s=>s.review.content==='added').length,textChanged:all.filter(s=>s.review.textChanged).length,missing:all.filter(s=>s.missing).length};
 return {catalog,media};
}
