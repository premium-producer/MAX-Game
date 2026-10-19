import {FIELD_SIZE} from './public/shared-field-model.js';
export const CONTOUR_LIFETIME=.5;
const CONTOUR_MAX_DYE=4;
// Keep legacy consumers' combined channels, while the current background reads
// only backgroundDensity/backgroundInteraction and the overlay reads contour.
export function mergeSilhouetteFrame(background,silhouette){
 const density=Buffer.from(background.density,'base64'),interaction=Buffer.from(background.interaction,'base64');
 const contour=Buffer.from(silhouette.contour,'base64');
 if(contour.length!==density.length||interaction.length!==density.length)throw new Error('Silhouette field dimensions differ');
 for(let i=0;i<contour.length;i++){
  density[i]=Math.min(255,density[i]+contour[i]);
  interaction[i]=Math.min(255,interaction[i]+contour[i]);
 }
 return {...background,density:density.toString('base64'),interaction:interaction.toString('base64'),contour:silhouette.contour};
}
// One bounded, authoritative semi-Lagrangian velocity/pressure/dye simulation.
// Clients only project snapshots; they never advance an independent simulation.
export class SharedFluid {
 constructor(width=FIELD_SIZE[0],height=FIELD_SIZE[1],{wrapX=false}={}){this.wrapX=wrapX;this.width=width;this.height=height;this.length=width*height;for(const k of ['vx','vy','nx','ny','dye','next','pressure','temp','div','curl'])this[k]=new Float32Array(this.length);this.time=0;this.sequence=0;}
 sample(a,x,y){const w=this.width,h=this.height;x=this.wrapX?((x%w)+w)%w:Math.max(0,Math.min(w-1.001,x));y=Math.max(0,Math.min(h-1.001,y));const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy,i=iy*w+ix,right=iy*w+(ix+1)%w;return (a[i]*(1-dx)+a[right]*dx)*(1-dy)+(a[i+w]*(1-dx)+a[right+w]*dx)*dy;}
 stroke(s,{radius=.09,force=22,ink=1.4,contour=false}={}){
  const delta=this.wrapX&&!s.unwrapped?((s.bx-s.ax+.5)%1+1)%1-.5:s.bx-s.ax;const dx=delta*this.width,dy=(s.by-s.ay)*this.height;
  const steps=Math.max(1,Math.min(256,Math.ceil(Math.hypot(dx,dy)/Math.max(1,radius*this.height*.5))));
  if(!dx&&!dy)return;
  for(let i=1;i<=steps;i++){const t=i/steps;this.splat(s.ax+delta*t,s.ay+(s.by-s.ay)*t,dx*force/steps,dy*force/steps,radius,ink/Math.sqrt(steps),contour?CONTOUR_MAX_DYE:8,contour,!contour);}
 }
 splat(u,v,dx=0,dy=0,radius=.065,ink=1,maxDye=8,contour=false,interaction=false){if(contour&&!this.contourDye){this.contourDye=new Float32Array(this.length);this.contourNext=new Float32Array(this.length);}if(interaction&&!this.pointerDye){this.pointerDye=new Float32Array(this.length);this.pointerNext=new Float32Array(this.length);}if(interaction)this.pointerActive=true;const dye=contour?this.contourDye:this.dye;if(contour){this.contourActive=true;maxDye=Math.min(maxDye,CONTOUR_MAX_DYE);}const w=this.width,h=this.height,x=u*w,y=v*h,r=Math.max(1,radius*h);for(let j=Math.max(1,Math.floor(y-r*3));j<Math.min(h-1,y+r*3);j++)for(let i=this.wrapX?Math.floor(x-r*3):Math.max(1,Math.floor(x-r*3));i<(this.wrapX?x+r*3:Math.min(w-1,x+r*3));i++){const q=((i-x)**2+(j-y)**2)/(r*r),a=Math.exp(-q*1.5),n=j*w+((i%w)+w)%w;dye[n]+=Math.min(Math.max(0,maxDye-dye[n]),ink*a);if(interaction)this.pointerDye[n]=Math.min(8,this.pointerDye[n]+ink*a);this.vx[n]+=dx*a;this.vy[n]+=dy*a;}this.sequence++;}
 step(dt=1/30,s={},elapsed=dt){
  const w=this.width,h=this.height,n=this.length;dt=Math.min(.05,Math.max(0,dt))*(s.speed??1);if(!dt)return;this.time+=dt;const t=this.time;const contourLoss=CONTOUR_MAX_DYE/CONTOUR_LIFETIME*Math.max(0,elapsed);let contourAlive=false;
  if(s.autoEmit!==false)for(let k=0;k<7;k++){
   const phase=t/(5+k*.57)+k*.731,age=phase-Math.floor(phase),envelope=Math.sin(age*Math.PI)**2;
   const x=.08+k*.125+.035*Math.sin(t*.19+k*2.7),y=.48+(s.emitSpread??.7)*.45*Math.sin(k*2.31+t*.22);
   this.splat(x,y,(s.emitForce??1.8)*dt*18,(k%2?1:-1)*dt*12,.045+(k%3)*.012,envelope*dt*(s.emitLight??2.4)*1.7);
  }
  for(let y=1;y<h-1;y++)for(let x=this.wrapX?0:1;x<(this.wrapX?w:w-1);x++){const i=y*w+x;this.curl[i]=.5*(this.vy[y*w+(x+1)%w]-this.vy[y*w+(x+w-1)%w]-this.vx[i+w]+this.vx[i-w]);}
  for(let y=1;y<h-1;y++)for(let x=this.wrapX?0:1;x<(this.wrapX?w:w-1);x++){const i=y*w+x;let a=Math.abs(this.curl[i+w])-Math.abs(this.curl[i-w]),b=Math.abs(this.curl[y*w+(x+1)%w])-Math.abs(this.curl[y*w+(x+w-1)%w]),norm=Math.hypot(a,b)+.0001;
   this.vx[i]+=(a/norm*this.curl[i]*(s.curl??18)*.14+((s.emitForce??1.8)*2.5-this.vx[i])*.15)*dt;
   this.vy[i]-=b/norm*this.curl[i]*(s.curl??18)*.14*dt;
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,bx=x-this.vx[i]*dt,by=y-this.vy[i]*dt,decay=Math.exp(-(s.velocityDecay??.35)*dt);this.nx[i]=this.sample(this.vx,bx,by)*decay;this.ny[i]=this.sample(this.vy,bx,by)*decay;}
  [this.vx,this.nx]=[this.nx,this.vx];[this.vy,this.ny]=[this.ny,this.vy];this.pressure.fill(0);
  for(let y=1;y<h-1;y++)for(let x=this.wrapX?0:1;x<(this.wrapX?w:w-1);x++){const i=y*w+x;this.div[i]=-.5*(this.vx[y*w+(x+1)%w]-this.vx[y*w+(x+w-1)%w]+this.vy[i+w]-this.vy[i-w]);}
  for(let j=0;j<Math.max(8,Math.min(40,s.iterations??20));j++){for(let y=1;y<h-1;y++)for(let x=this.wrapX?0:1;x<(this.wrapX?w:w-1);x++){const i=y*w+x;this.temp[i]=(this.div[i]+this.pressure[y*w+(x+w-1)%w]+this.pressure[y*w+(x+1)%w]+this.pressure[i-w]+this.pressure[i+w])*.25;}[this.pressure,this.temp]=[this.temp,this.pressure];}
  for(let y=1;y<h-1;y++)for(let x=this.wrapX?0:1;x<(this.wrapX?w:w-1);x++){const i=y*w+x;this.vx[i]-=.5*(this.pressure[y*w+(x+1)%w]-this.pressure[y*w+(x+w-1)%w]);this.vy[i]-=.5*(this.pressure[i+w]-this.pressure[i-w]);}
  let pointerAlive=false;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;const bx=x-this.vx[i]*dt,by=y-this.vy[i]*dt;this.next[i]=this.sample(this.dye,bx,by)*Math.exp(-(s.dyeDecay??.22)*dt);if(this.pointerActive){const d=this.sample(this.pointerDye,bx,by)*Math.exp(-(s.dyeDecay??.22)*dt);this.pointerNext[i]=d<.00001?0:d;pointerAlive||=d>=.00001;}if(this.contourActive){const value=Math.max(0,this.sample(this.contourDye,bx,by)-contourLoss),d=value<.00001?0:value;this.contourNext[i]=d;contourAlive||=d>0;}}
  if(this.pointerActive){[this.pointerDye,this.pointerNext]=[this.pointerNext,this.pointerDye];this.pointerActive=pointerAlive;}
  [this.dye,this.next]=[this.next,this.dye];if(this.contourActive){[this.contourDye,this.contourNext]=[this.contourNext,this.contourDye];this.contourActive=contourAlive;}this.sequence++;
 }
 // Passive interaction dye shares the existing velocity/pressure solver. It
 // excludes auto emitters, so local FX can coexist with a different background.
 frame(){const bytes=Buffer.allocUnsafe(this.length),interaction=Buffer.allocUnsafe(this.length),backgroundDensity=Buffer.allocUnsafe(this.length),backgroundInteraction=Buffer.allocUnsafe(this.length),contourBytes=Buffer.allocUnsafe(this.length);for(let i=0;i<bytes.length;i++){const contour=this.contourActive?this.contourDye[i]:0,pointer=this.pointerActive?this.pointerDye[i]:0;bytes[i]=Math.round(Math.min(1,(this.dye[i]+contour)/4)*255);interaction[i]=Math.round(Math.min(1,(pointer+contour)/4)*255);backgroundDensity[i]=Math.round(Math.min(1,this.dye[i]/4)*255);backgroundInteraction[i]=Math.round(Math.min(1,pointer/4)*255);contourBytes[i]=Math.round(Math.min(1,contour/4)*255);}return {sequence:this.sequence,time:this.time,width:this.width,height:this.height,density:bytes.toString('base64'),interaction:interaction.toString('base64'),backgroundDensity:backgroundDensity.toString('base64'),backgroundInteraction:backgroundInteraction.toString('base64'),contour:contourBytes.toString('base64')};}
 clear(){for(const k of ['vx','vy','dye','contourDye','contourNext','pointerDye','pointerNext'])this[k]?.fill(0);this.contourActive=this.pointerActive=false;this.sequence++;}
}
