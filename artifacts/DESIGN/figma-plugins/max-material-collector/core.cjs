/* Pure classification: no canvas mutations, OCR or external requests. */
const Collector = (() => {
 const tasks=[
  ['blogger.channel','Блогер · Создание канала',/создани[ея]\s+(публичного\s+|приватного\s+)?канала|^публичный канал$|^приватный канал$|public channel|private channel/i],
  ['blogger.comments','Блогер · Комментарии',/комментари|комментировать|comments/i],
  ['blogger.statistics','Блогер · Статистика',/статистик|рост канала|analytics|statistics/i],
  ['digital-id.create','Цифровой ID · Создание',/создани[ея].*(цид|цифров|id)|флоу.*цид/i],
  ['digital-id.photo','Цифровой ID · Подтверждённое фото (общий материал)',/добавлени[ея].*фото|подтвержд[её]нн.*фото/i],
  ['digital-id.hotel','Цифровой ID · Отель',/заселени|отель|hotel/i],
  ['digital-id.benefit','Цифровой ID · Льгота',/льгот|студенческ|музе/i],
  ['digital-id.age','Цифровой ID · Возраст',/подтверждени[ея] возраста|возраст|18\+/i],
  ['communication.call','Общение · Звонок',/звонк|звонок|видео.?звон|calls?/i],
  ['communication.video','Общение · Видеокружок',/видеосообщени|кружк|video message/i],
  ['communication.voice','Общение · Голосовое сообщение',/голосов|voice message/i],
  ['communication.group','Общение · Групповой чат',/группов.*чат|создани[ея] группы|group chat/i],
  ['communication.reaction','Общение · Стикеры / реакции',/стикер|реакци|stickers?|reactions?/i],
  ['communication.story','Общение · История',/публикаци[яи] истори|истории|stories/i],
  ['business.account','Бизнес · Аккаунт / сфера',/бизнес.?аккаунт|сфера бизнеса|платформ.*MAX.*бизнес/i],
  ['business.channel','Бизнес · Канал / планирование',/канал бизнеса|планирован.*публикац|запланир.*пост|отложенн.*публикац/i],
  ['business.bot','Бизнес · Бот',/бот.*заказ|запуск бота|при[её]м заказ/i],
  ['business.store','Бизнес · Витрина',/витрин|мини.?приложени/i],
  ['unassigned','Не определено',/$a/]
 ];
 const valid=new Set(tasks.map(x=>x[0]));
 const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
 const area=b=>b.width*b.height;
 const contains=(a,b)=>a&&b&&a.x<=b.x+2&&a.y<=b.y+2&&a.x+a.width>=b.x+b.width-2&&a.y+a.height>=b.y+b.height-2;
 const ancestor=(a,b,map)=>{let n=map.get(b.parent);while(n){if(n.id===a.id)return true;n=map.get(n.parent);}return false;};
 const matches=s=>{const text=norm(s).split('(')[0],found=tasks.filter(t=>t[0]!=='unassigned'&&t[2].test(text)).map(t=>t[0]);return found.includes('digital-id.photo')?['digital-id.photo']:found;};
 function candidates(nodes,selected,mode){
  const map=new Map(nodes.map(n=>[n.id,n])),selection=new Set(selected||[]);
  const scoped=n=>mode!=='selection'||selection.has(n.id)||[...selection].some(id=>map.has(id)&&ancestor(map.get(id),n,map));
  const phone=n=>n.bounds&&n.bounds.width>=60&&n.bounds.height>=160&&n.bounds.width/n.bounds.height>=.3&&n.bounds.width/n.bounds.height<=.82;
  const allowed=n=>['FRAME','COMPONENT','INSTANCE','GROUP'].includes(n.type)||(n.type==='RECTANGLE'&&n.hasImage);
  const phones=nodes.filter(n=>scoped(n)&&n.visible&&allowed(n)&&phone(n));
  const possible=[...phones,...nodes.filter(n=>selection.has(n.id)&&n.visible&&allowed(n)&&!phone(n)&&!phones.some(c=>ancestor(n,c,map)))];
  const possibleIds=new Set(possible.map(n=>n.id)),boards=new Set();
  for(const n of possible){let p=map.get(n.parent);while(p){if(possibleIds.has(p.id)&&p.bounds.width>n.bounds.width/0.65&&p.bounds.height>n.bounds.height/0.65)boards.add(p.id);p=map.get(p.parent);}}
  const actual=possible.filter(n=>!boards.has(n.id)),ids=new Set(actual.map(n=>n.id));
  return actual.filter(n=>{let p=map.get(n.parent);while(p){if(ids.has(p.id))return false;p=map.get(p.parent);}return true;});
 }
 function classify(nodes,screens){
  const map=new Map(nodes.map(n=>[n.id,n]));
  const screenIds=new Set(screens.map(n=>n.id));
  const insideScreen=n=>{let p=n;while(p){if(screenIds.has(p.id))return true;p=map.get(p.parent);}return false;};
  const headings=nodes.filter(n=>n.visible&&n.type==='TEXT'&&n.bounds&&n.text?.length<180&&(n.fontSize>=18||matches(n.text).length)&&!insideScreen(n));
  const sections=nodes.filter(n=>n.visible&&n.bounds&&n.type==='SECTION');
  const backdrops=nodes.filter(n=>n.visible&&n.bounds&&['SECTION','FRAME','GROUP','RECTANGLE'].includes(n.type)&&!n.hasImage&&!insideScreen(n));
  // Spatial index: headings in the same vertical band, no all-node scan per screen.
  const bands=new Map();for(const h of headings){const k=Math.floor(h.bounds.y/1000);if(!bands.has(k))bands.set(k,[]);bands.get(k).push(h);}
  return screens.map(s=>{
   const chain=[];let p=map.get(s.parent);while(p){chain.push({id:p.id,name:p.name,type:p.type});p=map.get(p.parent);}
   const section=sections.filter(n=>contains(n.bounds,s.bounds)).sort((a,b)=>area(a.bounds)-area(b.bounds))[0];
   const context=[],b=s.bounds,region=section||backdrops.filter(n=>contains(n.bounds,b)&&n.bounds.width>b.width*2&&area(n.bounds)>area(b)*3).sort((a,b)=>area(a.bounds)-area(b.bounds))[0];
   const maxGap=Math.max(600,b.height*1.8),above=region?Math.max(200,b.height*.5):0,minY=region?region.bounds.y-above:b.y-maxGap,band=Math.floor(b.y/1000);
   for(let k=Math.floor(minY/1000);k<=band;k++)for(const h of bands.get(k)||[]){
    const r=h.bounds,gap=b.y-r.y-r.height;
    if(gap< -4||r.y<minY||r.x>b.x+b.width*.5||b.x-r.x>Math.max(2000,b.width*12,region?.bounds.width||0))continue;
    const aboveRegion=region&&r.y+r.height<=region.bounds.y+4&&r.x>=region.bounds.x-b.width*.5&&r.x<region.bounds.x+region.bounds.width;
    if(region&&!contains(region.bounds,r)&&!aboveRegion)continue;
    // A heading in a sibling container never labels this screen.
    const hp=map.get(h.parent);if(hp&&['SECTION','FRAME','GROUP'].includes(hp.type)&&!contains(hp.bounds,b))continue;
    context.push({id:h.id,text:h.text,bounds:r,fontSize:h.fontSize,score:gap+Math.max(0,b.x-r.x)*.06});
   }
   context.sort((a,b)=>a.score-b.score);
   const evidence=[];
   function add(text,source,id,weight){for(const task of matches(text))evidence.push({task,source,id,text,weight});}
   add(s.name,'frame-name',s.id,100);
   chain.forEach((n,i)=>add(n.name,'ancestor',n.id,90-Math.min(i,8)*3));
   if(section)add(section.name,'section',section.id,90);
   context.slice(0,12).forEach((h,i)=>add(h.text,'heading',h.id,94-i*3));
   evidence.sort((a,b)=>b.weight-a.weight);
   const top=evidence[0],alternative=evidence.find(e=>e.task!==top?.task&&e.weight>=top.weight-10);
   const task=top?.task||'unassigned',confidence=!top?'none':alternative?'review':top.source==='heading'?'inferred':'high';
   const anchor=top?.id||context[0]?.id||section?.id||s.parent||s.id;
   return {...s,task,confidence,reviewed:false,include:true,group:anchor,evidence,ancestors:chain,contextRegion:region?{id:region.id,name:region.name,type:region.type,bounds:region.bounds}:null,nearbyHeadings:context.slice(0,12),warnings:[...(!top?['Нет надёжного тематического заголовка']:[]),...(alternative?['Контекст указывает на несколько заданий']:[]),...(s.type==='RECTANGLE'?['Растровый экран: текстовые слои могут отсутствовать']:[]) ]};
  });
 }
 function order(items){
  const sorted=[...items].sort((a,b)=>a.bounds.y-b.bounds.y||a.bounds.x-b.bounds.x),rows=[];
  for(const s of sorted){let row=rows.find(r=>Math.abs(r.y-s.bounds.y)<=Math.min(r.h,s.bounds.height)*.25);if(!row){row={y:s.bounds.y,h:s.bounds.height,items:[]};rows.push(row);}row.items.push(s);}
  return rows.flatMap((r,row)=>r.items.sort((a,b)=>a.bounds.x-b.bounds.x).map((s,col)=>({...s,layoutRow:row+1,layoutColumn:col+1})));
 }
 function frameName(name){
  const m=norm(name).match(/^(.*?)\s*[-–—]\s*(\d+)\s*(?:\((.*)\))?$/);
  return m?{series:m[1].trim(),number:Number(m[2]),description:m[3]||''}:null;
 }
 function structured(nodes,selected=[],scope='page'){
  const map=new Map(nodes.map(n=>[n.id,n])),children=new Map(),selection=new Set(selected),screens=[];
  for(const n of nodes){if(!children.has(n.parent))children.set(n.parent,[]);children.get(n.parent).push(n);}
  const inScope=n=>scope!=='selection'||selection.has(n.id)||[...selection].some(id=>map.has(id)&&ancestor(map.get(id),n,map));
  const visit=n=>{
   if(!n.visible)return;
   const kids=children.get(n.id)||[],isFrame=['FRAME','COMPONENT','INSTANCE'].includes(n.type);
   // A SECTION/GROUP is a container. A named screen is atomic: its nested UI is not another screen.
   if(isFrame&&inScope(n)&&n.bounds&&n.bounds.width>0&&n.bounds.height>0){
    const isContainer=!frameName(n.name)&&kids.some(c=>c.visible&&(c.type==='SECTION'||(['FRAME','COMPONENT','INSTANCE'].includes(c.type)&&frameName(c.name))));
    if(!isContainer){screens.push(n);return;}
   }
   for(const child of kids)visit(child);
  };
  for(const n of nodes)if(!map.has(n.parent))visit(n);
  const records=screens.map(s=>{
   const ancestors=[];let p=map.get(s.parent);while(p){ancestors.push({id:p.id,name:p.name,type:p.type});p=map.get(p.parent);}
   const containerPath=[...ancestors].reverse(),sectionPath=containerPath.filter(n=>n.type==='SECTION');
   const evidence=[];for(const [i,n] of [s,...ancestors].entries())for(const task of matches(n.name))evidence.push({task,source:i?'ancestor':'frame-name',id:n.id,text:n.name,weight:100-i});
   const top=evidence[0],conflict=!!top&&evidence.some(e=>e.task!==top.task);
   return {...s,task:top?.task||'unassigned',confidence:conflict?'review':top?'high':'none',reviewed:false,include:true,
    group:s.parent||s.id,groupName:containerPath.map(n=>n.name).join(' / ')||'Экраны страницы',containerPath,sectionPath,
    sequence:frameName(s.name),detection:'structure',evidence,ancestors,nearbyHeadings:[],contextRegion:null,
    warnings:[...(!top?['Задание не указано в названиях — назначьте при необходимости']:[]),...(conflict?['Названия экрана и контейнеров указывают на разные задания']:[])]};
  });
  const groups=new Map();for(const r of records){if(!groups.has(r.group))groups.set(r.group,[]);groups.get(r.group).push(r);}
  const key=r=>r.sequence?`${r.sequence.series} - ${r.sequence.number}`:r.name;
  // Numeric sorting must also work in Figma's sandbox without Intl collation options.
  const natural=(a,b)=>{
   const left=key(a).toLowerCase().match(/\d+|\D+/g)||[],right=key(b).toLowerCase().match(/\d+|\D+/g)||[];
   for(let i=0;i<Math.min(left.length,right.length);i++){
    const diff=/^\d+$/.test(left[i])&&/^\d+$/.test(right[i])?Number(left[i])-Number(right[i]):left[i].localeCompare(right[i]);
    if(diff)return diff;
   }
   return left.length-right.length;
  };
  return [...groups.values()].flatMap(group=>group.sort(natural));
 }
 function plan(records,edits){
  const map=new Map(records.map(n=>[n.id,n])),seen=new Set();
  return edits.filter(e=>e.include).map(e=>{const n=map.get(e.id);if(!n||seen.has(e.id))throw Error('Повторный или неизвестный экран');seen.add(e.id);if(!valid.has(e.task))throw Error('Неизвестное задание');return {...n,task:e.task,reviewed:!!e.reviewed,manualTask:e.task!==n.task,title:norm(e.title)||n.name,order:Math.max(1,Number(e.order)||1)};}).sort((a,b)=>a.detection==='structure'&&b.detection==='structure'?a.order-b.order||a.id.localeCompare(b.id):a.task.localeCompare(b.task)||a.order-b.order||a.id.localeCompare(b.id));
 }
 function coverage(screens){return tasks.filter(t=>t[0]!=='unassigned').map(([id,label])=>({id,label,count:screens.filter(s=>s.task===id).length,status:screens.some(s=>s.task===id)?'screens-found-content-not-verified':'not-found-in-export',note:'Наличие экрана не подтверждает полноту сценария или его результат.'}));}
 return {tasks:tasks.map(([id,label])=>({id,label})),norm,matches,candidates,classify,order,frameName,structured,plan,coverage};
})();
if(typeof module!=='undefined')module.exports=Collector;
