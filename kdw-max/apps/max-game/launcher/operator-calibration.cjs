'use strict';
// One operator-owned wizard. It never sends game commands or synthesizes clicks.
const TARGETS=[[640,160],[2240,160],[2240,1376],[640,1376],[1440,768]];
exports.createCalibration=(solve,now=Date.now)=>{
 let points=[],samples=[],preview=null,centerError=null,lastSource=null;
 return{
  point(event){if(!['down','move'].includes(event.phase)){samples=[];return;}if(event.sourceContactId!==lastSource)samples=[];lastSource=event.sourceContactId;samples.push({x:event.x,y:event.y,at:now()});samples=samples.filter(p=>now()-p.at<500).slice(-40);},
  capture(){
   const fresh=samples.filter(p=>now()-p.at<400);if(fresh.length<3||now()-fresh.at(-1).at>150)throw Error('Удерживайте одну руку на мишени: нужны свежие координаты лидара');
   const x=fresh.reduce((s,p)=>s+p.x,0)/fresh.length,y=fresh.reduce((s,p)=>s+p.y,0)/fresh.length;
   const span=points.length>1?Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])):Math.max(1,Math.abs(x),Math.abs(y));
   if(fresh.some(p=>Math.hypot(p.x-x,p.y-y)>Math.max(.002,Math.abs(span)*.01)))throw Error('Рука движется. Удерживайте её неподвижно');
   if(points.length<4){const candidate=[...points,[x,y]];if(candidate.length===4)preview=solve(candidate,TARGETS.slice(0,4),[3072,1536]);points=candidate;}
   else {const p=preview.map(x,y);centerError=Math.hypot(p.x-1440,p.y-768);if(centerError>60)throw Error('Ошибка в центре '+Math.round(centerError)+' px. Начните калибровку заново');}
   samples=[];return this.status();
  },
  result(){if(points.length!==4||centerError===null||centerError>60)throw Error('Нужны четыре угла и проверка центра');return{rawPoints:points,targetPoints:TARGETS.slice(0,4)};},
  status(){return{step:points.length,points,target:TARGETS[Math.min(points.length,4)],targets:TARGETS,centerError,complete:centerError!==null&&centerError<=60,latest:samples.at(-1)??null};},
 };
};
