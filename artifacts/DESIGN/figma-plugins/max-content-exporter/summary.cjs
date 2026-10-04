/* Read-only presentation of the audited map; gaps are counted, never hidden. */
const ContentMapSummary=map=>{
 const missions=map?.missions||[],lines=[`Миссий: ${missions.length}`];
 for(const m of missions){
  const tasks=m.icons.filter(i=>i.screens.length>0||i.status==='ambiguous');
  lines.push('',`${m.order}. ${m.text||'Без текста'} — заданий: ${tasks.length}`);
  for(const i of tasks){
   const ready=i.screens.filter(s=>s.status==='ready').length;
   const gaps=i.screens.length-ready;
   const visualCount=i.screens.reduce((sum,s)=>sum+(s.visualCount??s.candidateNodeIds?.length??(s.status==='ready'?1:0)),0);
   const unknown=i.screens.filter(s=>s.visualCount==null&&!s.candidateNodeIds&&s.status!=='ready').length;
   const detail=i.status==='ambiguous'?' — структура задания не определена':gaps?` — готовы: ${ready}, требуют разбора: ${gaps}`:'';
   lines.push(`  • ${i.text||`Задание ${i.order}`} — экранов: ${i.screens.length}, визуалов: ${visualCount}${unknown?` (не определено у ${unknown} экранов)`:''}${detail}`);
  }
  const empty=m.icons.filter(i=>!tasks.includes(i));
  if(empty.length)lines.push(`  Иконки без экранов (не включены в задания): ${empty.map(i=>i.text||`Иконка ${i.order}`).join(', ')}`);
 }
 return lines.join('\n');
};
if(typeof module!=='undefined')module.exports=ContentMapSummary;
