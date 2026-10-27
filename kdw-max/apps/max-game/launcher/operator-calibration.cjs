'use strict';
// Four convex perimeter points own the transform; the fifth verifies it independently.
const DEFAULT_TARGETS=[[1000,500],[1880,500],[1880,1036],[1000,1036],[1440,768]];
const LABELS=['Верхняя левая','Верхняя правая','Нижняя правая','Нижняя левая','Центр'];
const LEGACY_TARGETS=[[1000,768],[1440,500],[1880,768],[1440,1036],[1440,768]];
// Migrate only the former factory diamond; keep operator-authored positions.
exports.readTargets=value=>validateTargets(JSON.stringify(value)===JSON.stringify(LEGACY_TARGETS)?DEFAULT_TARGETS:value);
function validateTargets(value){
 if(!Array.isArray(value)||value.length!==5||value.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>typeof n!=='number'||!Number.isFinite(n))||p[0]<624||p[0]>2256||p[1]<64||p[1]>1472))throw Error('Пять точек должны находиться внутри зоны лидара с отступом 64 px');
 const points=value.map(p=>[...p]);let sign=0,area=0;
 for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];const z=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(Math.hypot(b[0]-a[0],b[1]-a[1])<120||Math.abs(z)<1000||sign&&Math.sign(z)!==sign)throw Error('Точки периметра должны образовывать выпуклую фигуру без пересечений');sign=Math.sign(z);area+=a[0]*b[1]-b[0]*a[1];}
 if(Math.abs(area)<20000)throw Error('Разнесите точки калибровки дальше друг от друга');
 for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],c=points[4],z=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.sign(z)!==sign)throw Error('Центральная точка должна находиться внутри остальных четырёх');}
 return points;
}
exports.DEFAULT_TARGETS=DEFAULT_TARGETS;exports.validateTargets=validateTargets;
exports.createCalibration=(solve,now=Date.now,{targets=DEFAULT_TARGETS,autoCapture=false,previousMapping=null}={})=>{
 targets=validateTargets(targets);let points=[],samples=[],preview=null,centerError=null,lastSource=null,waitingForRelease=false,stableAt=0,last=null,autoError=null,contact=null;
 const cursor=()=>{if(!contact||now()-contact.at>=350)return null;const mapping=preview??previousMapping;if(!mapping)return null;try{const p=mapping.map(contact.x,contact.y);if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;return{x:p.x,y:p.y,inside:p.inside,source:preview?'preview':'previous'};}catch{return null;}};
 const api={
  point(event){
   if(!['down','move'].includes(event.phase)){samples=[];waitingForRelease=false;stableAt=0;last=null;contact=null;return;}
   contact={x:event.x,y:event.y,at:now()};
   if(event.sourceContactId!==lastSource){samples=[];waitingForRelease=false;stableAt=now();last=null;}lastSource=event.sourceContactId;
   const span=points.length>1?Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])):Math.max(1,Math.abs(event.x),Math.abs(event.y));
   if(!last||Math.hypot(event.x-last.x,event.y-last.y)>Math.max(.002,Math.abs(span)*.01)){stableAt=now();last={x:event.x,y:event.y};}
   samples.push({x:event.x,y:event.y,at:now()});samples=samples.filter(p=>now()-p.at<500).slice(-40);
   if(autoCapture&&!waitingForRelease&&centerError===null&&now()-stableAt>=800){try{api.capture();autoError=null;}catch(e){autoError=e.message;}waitingForRelease=true;}
  },
  capture(){
   if(autoCapture&&waitingForRelease)throw Error('Уберите руку и приложите её к следующей мишени');
   const fresh=samples.filter(p=>now()-p.at<400);if(fresh.length<3||now()-fresh.at(-1).at>150)throw Error('Удерживайте одну руку на мишени: нужны свежие координаты лидара');
   const x=fresh.reduce((s,p)=>s+p.x,0)/fresh.length,y=fresh.reduce((s,p)=>s+p.y,0)/fresh.length;
   const span=points.length>1?Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])):Math.max(1,Math.abs(x),Math.abs(y));
   if(fresh.some(p=>Math.hypot(p.x-x,p.y-y)>Math.max(.002,Math.abs(span)*.01)))throw Error('Рука движется. Удерживайте её неподвижно');
   if(points.length<4){const candidate=[...points,[x,y]];if(candidate.length===4)preview=solve(candidate,targets.slice(0,4),[3072,1536]);points=candidate;}
   else{const p=preview.map(x,y);centerError=Math.hypot(p.x-targets[4][0],p.y-targets[4][1]);if(centerError>60){centerError=null;throw Error('Ошибка в центре больше 60 px. Начните калибровку заново');}}
   samples=[];if(autoCapture)waitingForRelease=true;return api.status();
  },
  result(){if(points.length!==4||centerError===null||centerError>60)throw Error('Нужны четыре точки и независимая проверка центра');return{rawPoints:points,targetPoints:targets.slice(0,4)};},
  status(){return{step:points.length,points,target:targets[Math.min(points.length,4)],targets,labels:LABELS,targetLabel:LABELS[Math.min(points.length,4)],centerError,complete:centerError!==null&&centerError<=60,latest:contact&&now()-contact.at<350?contact:null,cursor:cursor(),cursorMapping:preview?'preview':previousMapping?'previous':'unavailable',autoCapture,waitingForRelease,autoError,holdProgress:autoCapture&&!waitingForRelease&&last?Math.min(1,(now()-stableAt)/800):0};},
 };return api;
};
