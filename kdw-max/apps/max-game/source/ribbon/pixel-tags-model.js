import {hash,mod,smooth} from './flow.js';
// Screen-space sizes use the same rounded column count and row pitch as field.js.
export function pixelTagPose(index,time,settings,layout,width,height,rows,gap,out={},loopX=false){
 const seed=layout.seed+index*17,clock=time*settings.speed*settings.particleSpeed;
 const cells=hash(seed+1)<settings.particleLarge?2:1;
 const cols=Math.round(width/height*rows),pitchX=width/cols,pitchY=height/rows;
 const dynamics=settings.particleDynamics??.8,mode=index%3;
 const cruise=mode===0?.003+hash(seed+3)*.003:mode===1?.008+hash(seed+3)*.006:.020+hash(seed+3)*.020;
 const speed=.01*(1-dynamics)+cruise*dynamics;
 const frequency=.25+hash(seed+9)*.65,phase=hash(seed+10)*Math.PI*2;
 const acceleration=dynamics*(mode===0?.2:mode===1?.45:.75);
 // Integral of positive velocity: acceleration is smooth, seekable and never reverses.
 const distance=speed*(clock+acceleration/frequency*(Math.sin(clock*frequency+phase)-Math.sin(phase)));
 const progress=loopX?mod(hash(seed+2)+distance,1):mod(hash(seed+2)*1.16+distance,1.16)-.08;
 const lifetime=mode===0?20+hash(seed+5)*14:mode===1?12+hash(seed+5)*10:6+hash(seed+5)*8;
 const life=mod(hash(seed+4)+clock/lifetime,1);
 const lane=Math.floor(hash(seed+6)*(rows-cells-1))+1;
 out.x=progress*width;out.y=(lane+cells*.5)*pitchY;
 out.width=cells*pitchX-gap*Math.min(pitchX,pitchY);
 out.height=cells*pitchY-gap*Math.min(pitchX,pitchY);
 out.alpha=(loopX?1:smooth(-.04,.015,progress)*(1-smooth(.985,1.04,progress)))*smooth(0,.06+hash(seed+11)*.04,life)*(1-smooth(.90,1,life))*settings.particleOpacity*(.55+.45*hash(seed+7));
 out.red=hash(seed+8)<.35;out.cells=cells;out.progress=progress;return out;
}
// One particle population on the arch+ribbon route. Cropping never restarts a
// particle or changes its lifespan/color; output resolution is independent.
export function routedPixelTagPose(index,time,settings,layout,width,height,rows,gap,route,out={}){
 const pitch=height/rows,virtualWidth=route.total*pitch;
 pixelTagPose(index,time,settings,layout,virtualWidth,height,rows,gap,out);
 const scale=width/(route.columns*pitch);
 out.x=(out.x-route.offset*pitch)*scale;out.width*=scale;
 return out;
}
