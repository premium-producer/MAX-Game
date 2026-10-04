import {clientContent} from '../../../../max-game/src/journey-client.mjs';
import {taskFor,tasksFor} from '../../../../max-game/src/journey-tasks.mjs';
import {RevealJourney,REVEAL_TIMING} from '../../../../max-game/src/journey-guided-reveal.mjs';
import {taskDevice,taskMedia,mediaFrames} from '../../../../max-game/src/journey-media.mjs';
export const SCREEN_SIZE=Object.freeze({width:1600,height:1000});
const clone=value=>structuredClone(value);
export function snapshot(g){return {saved:JSON.parse(g.serialize()),session:clone(g.session),phase:g.phase,elapsed:g.elapsed,activeId:g.activeId};}
export function restoreSnapshot(content,state){const g=new RevealJourney(content,state.saved);g.session=clone(state.session);g.activeId=state.activeId;g.phase=state.phase;g.elapsed=state.elapsed;g.configure(1552,952);return g;}
function settle(g){for(let i=0;i<120&&!['task','branch','complete'].includes(g.phase);i++)g.tick(.1,{settled:true});if(!['task','branch','complete'].includes(g.phase))throw Error('Unreachable phase: '+g.phase);}
function scan(g){g.down('catalog');for(let i=0;i<8;i++)g.tick(.1,{settled:true});}
function finishTask(g,content){let guard=0;while(g.phase==='task'&&guard++<24){const t=taskFor(g.current,content);if(!g.answer(t.correct==='*'?0:t.correct))throw Error('Cannot answer '+g.activeId);}if(g.phase!=='result')throw Error('Task did not finish: '+g.activeId);settle(g);}
// Current controller/reducer states; the ring and row deliberately pause animation poses.
export function screenCatalog(original){
 const content=clientContent(original),screens=[];
 const add=(g,name,extra={})=>{const o=g.current,media=o&&o.step!=='business-tool'?taskMedia(o):null;screens.push({id:`reveal-${String(screens.length+1).padStart(3,'0')}`,edition:'guided-reveal',name,group:g.mission?.title||'Общие',mission:g.session.mission,...SCREEN_SIZE,...extra,state:snapshot(g),device:o?taskDevice(o):null,media:media?{...media,frames:mediaFrames(media).map(f=>({src:f.src,label:f.label,width:f.width,height:f.height}))}:null});};
 const menu=new RevealJourney(content);menu.menu();add(menu,'00 · Меню · шесть миссий',{kind:'menu',default:true});
 for(const mission of content.missions){
  let g=new RevealJourney(content);g.configure(1552,952);g.select(mission.id);add(g,'01 · Начало · Приложи ладонь',{kind:'palm',default:true});scan(g);
  g.elapsed=(g.nodes.length-1)*REVEAL_TIMING.stagger+REVEAL_TIMING.appear;add(g,'02 · Все иконки вокруг ладони',{kind:'ring',default:true});
  g.change('arrange');g.elapsed=REVEAL_TIMING.arrange+(g.nodes.length-1)*REVEAL_TIMING.arrangeStagger;
  const line=restoreSnapshot(content,snapshot(g));line.manualNodes[mission.id]=line.nodes.map(n=>n.step);line.nodes.forEach((n,i)=>{n.worldX=200+i*320;n.worldY=0;});
  const tool=line.nodes.find(n=>n.step==='business-tool');if(tool)line.toolPosition={x:tool.worldX,y:tool.worldY};
  add(line,'03 · Иконки выстроились в линию',{kind:'line',default:true,width:Math.max(1600,line.nodes.length*320+128)});settle(g);
  const captureTask=(start,branch=null)=>{
   const step=start.current.step,label=mission.steps.find(s=>s.id===step)?.label||mission.branches?.find(b=>b.step.id===step)?.step.label||step;
   let frontier=[{g:start,canonical:true}],visited=new Set();
   while(frontier.length){const next=[];
    for(const entry of frontier){const current=entry.g,o=current.current,t=taskFor(o,content)||tasksFor(content)[o.step].at(-1),m=taskMedia(o);
     const key=JSON.stringify([o.stage,o.done,current.session.notice,t.title,t.copy,t.options,t.scene,m.ids,o.step==='account'?o.answers[1]:['message','reaction','demo-tool'].includes(o.step)?o.answers[0]:null]);if(visited.has(key))continue;visited.add(key);
     const suffix=branch?` · ${branch.label}`:'',selected=o.step==='account'&&o.stage>=2?` · ${['Кофейня','Магазин','Услуги'][o.answers[1]??0]}`:'';
     const name=o.done?`${label} · Результат${suffix}${selected}`:`${label} · ${String(o.stage+1).padStart(2,'0')} · ${t.title}${suffix}${selected}`;
     add(current,name,{kind:o.done?'result':'task',step,stage:o.stage,branch:branch?.id,default:true,auto:!!t.autoMs});if(o.done)continue;
     for(let mediaIndex=1;mediaIndex<mediaFrames(m).length;mediaIndex++)add(current,`${name} · Кадр ${mediaIndex+1}/${m.ids.length}`,{kind:'task',step,stage:o.stage,branch:branch?.id,mediaIndex,default:false});
     const canonical=t.correct==='*'?0:t.correct;
     if(t.correct!=='*'){const wrong=t.options.findIndex((_,i)=>i!==t.correct);if(wrong>=0){const rejected=restoreSnapshot(content,snapshot(current));rejected.answer(wrong);add(rejected,`${name} · Ошибка ответа`,{kind:'error',step,stage:o.stage,branch:branch?.id,default:false});}}
     for(let choice=0;choice<t.options.length;choice++)if(t.correct==='*'||choice===t.correct){const follow=restoreSnapshot(content,snapshot(current));follow.answer(choice);next.push({g:follow,canonical:entry.canonical&&choice===canonical});}
    }frontier=next;
   }
  };
  while(g.phase!=='complete'){
   if(g.phase==='branch'){add(g,'04 · Выбор инструмента · внутри ПК',{kind:'branch',step:'business-tool',default:true});for(const branch of mission.branches){const b=restoreSnapshot(content,snapshot(g));b.choose(branch.id);captureTask(b,branch);finishTask(b,content);add(b,`Итог миссии · ${branch.label}`,{kind:'complete',branch:branch.id,default:true});}break;}
   captureTask(restoreSnapshot(content,snapshot(g)));finishTask(g,content);
  }
  if(!mission.branches)add(g,'Итог миссии'+(mission.presentation?' · тест':''),{kind:'complete',default:true});
 }
 if(content.missions.length!==6||screens.length>450)throw Error('Unexpected mission/screen count');return screens;
}
