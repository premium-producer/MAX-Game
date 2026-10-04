export const MISSIONS = [
  ['common','00 · Старт и навигация'],['blogger','01 · Стать блогером'],
  ['id','02 · Цифровой ID'],['communication','03 · Общение на максимум'],
  ['business','04 · Продвижение бизнеса'],['final','05 · Финал']
];
export function classify(item) {
  const file=item.file;
  const mission=file.startsWith('0')?'common':file.startsWith('1')?'blogger':file.startsWith('2')?'id':file.startsWith('3')?'communication':file.startsWith('4')?'business':'final';
  const task=/-(\d+)(-result)?\.png$/.test(file);
  let row, state, core=false;
  if(task){row=file.replace(/-\d+(-result)?\.png$/,'');state=file.includes('-result')?'result':'task';core=/-1\.png$/.test(file)&&/^(14-|24-|34a-|44-)/.test(file);}
  else if(file.includes('-start')){row='00 · Начало';state='start';core=true;}
  else if(file.includes('-first-step')){row='01 · Первый шаг';state='first';core=true;}
  else if(file.includes('picker')){row='02 · Выбор иконок';state='picker';}
  else if(file.includes('route-ready')){row='03 · Путь намечен';state='ready';}
  else if(file.includes('assembled')){row='04 · Полная сборка';state='assembled';core=true;}
  else if(file.includes('max-brief')){row='90 · Справка MAX';state='brief';}
  else if(file.includes('complete')){row='80 · Миссия выполнена';state='complete';core=true;}
  else{row='00 · Экраны';state='system';}
  if(mission==='common'||mission==='final')row='00 · Экраны';
  return {...item,mission,row,state,core};
}
export function selectScreens(catalog, options={}) {
  const mission=options.mission||'all',set=options.set||'all';
  return catalog.filter(s=>(mission==='all'||s.mission===mission)&&(set==='all'||set==='core'&&s.core&&!['common','final'].includes(s.mission)||set==='tasks'&&['task','result'].includes(s.state)||set===s.state)).sort((a,b)=>a.file.localeCompare(b.file));
}
export function planScreens(catalog,options={}) {
  const selected=selectScreens(catalog,options);
  const width=['640','1280'].includes(String(options.width))?Number(options.width):0;
  const cols=[3,4,5].includes(Number(options.columns))?Number(options.columns):5;
  const pad=48,gap=48,caption=78,groups=[];let top=0;
  for(const [mission,name] of MISSIONS){
    const list=selected.filter(s=>s.mission===mission);if(!list.length)continue;
    const rows=[...new Set(list.map(s=>s.row))].sort();let y=72,maxRight=0;const children=[];
    for(const key of rows){
      const members=list.filter(s=>s.row===key),slotW=Math.max(...members.map(s=>width||s.width));
      const rowH=Math.max(...members.map(s=>(width||s.width)*s.height/s.width))+caption;
      const items=members.map((s,i)=>({...s,x:pad+(i%cols)*(slotW+gap),y:64+Math.floor(i/cols)*(rowH+gap),w:width||s.width,h:(width||s.width)*s.height/s.width}));
      const rowW=pad*2+Math.min(cols,members.length)*slotW+(Math.min(cols,members.length)-1)*gap;
      const height=64+Math.ceil(members.length/cols)*(rowH+gap);
      const title=/^\d/.test(key)&&key.includes(' · ')?key:members[0].title.split(' — ')[0];
      children.push({key,title,x:pad,y,w:rowW,h:height,items});y+=height+80;maxRight=Math.max(maxRight,rowW);
    }
    groups.push({mission,name,x:0,y:top,w:maxRight+pad*2,h:y+pad,rows:children});top+=y+pad+180;
  }
  return groups;
}
