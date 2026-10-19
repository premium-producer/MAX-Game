// Planning uses a compact, centred row. Gameplay keeps its free physical field.
export function routeLayout(count,hasNext,width,height,compact=false){
 const slots=Math.max(1,count+Number(hasNext)),tile=compact?76:108;
 const pitch=Math.min(compact?152:232,Math.max(0,width-(compact?116:170)-36)/Math.max(1,slots-1));
 const captionWidth=Math.min(compact?140:210,Math.max(60,pitch-16));
 const y=Math.max(tile/2+20,Math.min(height-tile/2-80,height*.5-18));
 const centers=Array.from({length:slots},(_,i)=>({x:width/2+(i-(slots-1)/2)*pitch,y}));
 return {centers,captionWidth,pitch};
}
export function nextStepLabel(index){return `Твой ${['первый','второй','третий','четвёртый','пятый','шестой'][index-1]||index+'-й'} шаг`;}
export function routeStartCaption(mission){return {blogger:'Твой первый шаг к блогу','digital-id':'Твой первый шаг к Цифровому ID',communication:'Твой первый шаг к общению',business:'Твой первый шаг к развитию бизнеса'}[mission]||'Твой первый шаг с MAX';}
