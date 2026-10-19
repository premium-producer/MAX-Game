// Pure time-based choreography. Coordinates use positive camera depth, not frame history.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const mod=(x,n)=>((x%n)+n)%n;
export const hash=n=>{let x=(n|0)^0x9e3779b9;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return ((x^(x>>>15))>>>0)/4294967296;};
export const FLOW_DEFAULTS=Object.freeze({density:34,hfov:75,blur:2.4,depth:1,rows:12,gap:0,mask:'auto',source:'auto',view:'composite',maskStrength:1,breath:.18});
export const SOURCES=['auto','form','noise','black','white','gray','ramp'];
export const VIEWS=['composite','field','mask','noise','silhouette','cloud','carrier','product','center','outside','detail','density','palette','envelope','rawSilhouette','rawNoise','noiseMultiplier','aperture','visibility','rawDetail','rawDensity','rawPalette'];
export function validFlow(v){return v&&(v.gap===undefined||(Number.isFinite(v.gap)&&v.gap>=0&&v.gap<=1))&&Number.isInteger(v.density)&&v.density>=1&&v.density<=48&&Number.isFinite(v.hfov)&&v.hfov>=60&&v.hfov<=90&&Number.isFinite(v.blur)&&v.blur>=0&&v.blur<=6&&Number.isFinite(v.depth)&&v.depth>=.3&&v.depth<=1.4&&Number.isInteger(v.rows)&&v.rows>=2&&v.rows<=128&&['auto','robot','headphones','orbit','play','leaf','ball'].includes(v.mask)&&SOURCES.includes(v.source)&&VIEWS.includes(v.view)&&Number.isFinite(v.maskStrength)&&v.maskStrength>=0&&v.maskStrength<=1&&Number.isFinite(v.breath)&&v.breath>=0&&v.breath<=.5;}
export function cameraMetrics(width,height,hfov){const tangent=Math.tan(hfov*Math.PI/360);return {tangent,focal:width/(2*tangent),vfov:2*Math.atan(tangent*height/width)*180/Math.PI};}
export function maskSignal(mask,envelope=1,centrality=1){return clamp(mask)*clamp(envelope)*clamp(centrality);}
export const PHASE_ENDS=Object.freeze([2.5,3.2,4.2,6,7.3,8.3]);
export function eventAt(time,origin=0,cycleSeconds=12,ends=PHASE_ENDS){const [absorb,,hold,emit,recover,end]=ends;const elapsed=time-origin,cycle=Math.floor(elapsed/cycleSeconds),age=mod(elapsed,cycleSeconds);return {age,cycle,started:elapsed>=0,form:smooth(absorb,hold,age)*(1-smooth(recover,end,age)),reveal:smooth(emit,recover,age),phase:age<absorb?0:age<hold?1:age<emit?2:3};}
export function heroPose(age,out,ends=PHASE_ENDS){const t=clamp(age/ends[1]);out.x=-8.2*(1-t)*(1-t);out.y=.015*Math.sin(t*Math.PI);out.depth=10+10*t;out.alpha=1-smooth(ends[0],ends[1],age);out.height=.22;return out;}
export function ambientPose(time,index,seed,spread,out){
  const lane=index%6,duration=42+(lane%3)*12;
  // Eight evenly spaced slots per lane; seed shifts the whole lane, preserving gaps.
  const shifted=time/duration+Math.floor(index/6)/8+hash(seed+lane)*.08;
  const cycle=Math.floor(shifted),p=mod(shifted,1),near=index%6===0;
  const base=near?11:lane%2===0?14.5:19;
  out.depth=clamp(15+(base-15)*spread+(p-.5)*2,7.5,22);
  out.x=-16*(1-p);out.y=(lane-2.5)*.095+(hash(index+seed)-.5)*.018;
  out.height=near?.22:.18;
  out.alpha=smooth(0,.06,p)*(1-smooth(.90,1,p))*(near?.95:lane%2===0?.72:.42);
  out.cycle=cycle;out.progress=p;return out;
}
export function productPose(age,out,ends=PHASE_ENDS,cycleSeconds=12){const start=ends[3],duration=cycleSeconds-start,p=clamp((age-start)/duration);out.x=9.8*p;out.y=.04*Math.sin(p*Math.PI*2);out.depth=20-10*p;out.height=.28;out.alpha=smooth(start,start+duration*.1166667,age)*(1-smooth(cycleSeconds-1,cycleSeconds,age));return out;}
export function projectPose(p,metrics,width,height,out){out.x=width/2+p.x/p.depth*metrics.focal;out.y=height/2-p.y/p.depth*metrics.focal;out.height=p.height/p.depth*metrics.focal;return out;}
