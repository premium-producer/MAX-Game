import {REAR_CONTRAST,REAR_STYLE} from './rear-wall-style.js';
const contour=REAR_STYLE.contour;
const rearContourGLSL=contour?`
vec2 rearContour(float density){
 float d=max(0.,density),gate=smoothstep(0.,.3,d),distance=d-${contour.level.toFixed(3)};
 float core=exp(-pow(distance/${contour.width.toFixed(3)},2.))*${contour.density.toFixed(3)};
 float halo=exp(-pow(distance/${contour.haloWidth.toFixed(3)},2.))+.24*exp(-pow(distance/${(contour.haloWidth*2.4).toFixed(3)},2.));
 return vec2(core,halo*${contour.haloGain.toFixed(3)})*gate;
}`:'vec2 rearContour(float density){return vec2(density,0.);}';
// Project adaptation of the MAX palette, not a reproduction of the Figma Angular asset.
export const MAX_WALL_LOOK=Object.freeze({strength:1.35,speed:0.38});
export const MAX_WALL_COLORS=Object.freeze(['#00BFFF','#6E1AFF','#0D001A','#471AFF','#9500FF','#FFFFFF']);
// Active VK field adaptation. The silk shader below is retained as version history.
export const MAX_FIELD_PALETTE=Object.freeze({blue:'#00BFFF',deepBlue:'#471AFF',purple:'#6E1AFF',violet:'#9500FF'});
export const maxFieldBackground=background=>({...background,...MAX_FIELD_PALETTE});
export function maxFieldTransition(transition){return transition?{...transition,from:maxFieldBackground(transition.from),to:maxFieldBackground(transition.to)}:undefined;}
export const MAX_FIELD_MODE=2;
export const MAX_FIELD_DYE_GAIN=2.4;
// Shared broad gradient for the wall and portable game. Inputs/colors are linear.
export const MAX_FIELD_GRADIENT_GLSL=`
vec3 maxFieldGradient(vec2 p,float time){
 float t=time*.12;
 float broad=.5+.25*sin(p.x*5.-t)+.25*cos(p.y*3.+p.x*1.3+t*.8);
 float edge=smoothstep(0.,.18,p.x)*(1.-smoothstep(.82,1.,p.x));
 vec3 hue=mix(uMaxColors[3],uMaxColors[1],smoothstep(.12,.62,p.x));
 hue=mix(hue,uMaxColors[4],smoothstep(.52,.87,p.x)*.72);
 hue=mix(hue,uMaxColors[0],exp(-pow((p.x-.4)/.22,2.))*broad*.32);
 return mix(uMaxColors[2],hue,edge*(.2+.46*broad));
}
`;
export const MAX_WALL_ATMOSPHERE_GLSL=`
uniform bool uRearWall;uniform vec2 uRearBrandCells;uniform vec4 uRearCrop;uniform vec3 uRearPalette[4];
float rearFieldBrand(vec2 cell){return uRearWall?smoothstep(uRearBrandCells.x,uRearBrandCells.y,cell.x):0.;}
uniform float uMaxEnabled,uMaxTime;
uniform vec4 uMaxCrop,uMaxLook;
uniform vec3 uMaxColors[6];
${MAX_FIELD_GRADIENT_GLSL}
vec2 maxFlowDistance(vec2 q,float t){
 return q.yy-vec2(.30+.025*sin(q.x*8.-t*1.2)+.012*sin(q.x*19.-t*2.),
                     .77+.030*sin(q.x*6.-t*.9)+.010*sin(q.x*16.-t*1.7));
}
vec2 maxFlowPackets(vec2 q,float t){
 return pow(.5+.5*cos(vec2(q.x*7.-t*1.8,q.x*8.-t*1.5+2.)),vec2(2.));
}
float maxFlowLane(vec2 q,float t){
 vec2 distance=maxFlowDistance(q,t);
 vec2 lanes=exp(-pow(abs(distance)/vec2(.035,.045),vec2(2.)))*maxFlowPackets(q,t);
 return max(lanes.x,lanes.y);
}
float maxFlowEdge(vec2 q){
 return smoothstep(0.,.20,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);
}
${rearContourGLSL}
float maxHorizontalDensity(vec2 cell,float density){
 if(uRearWall&&${REAR_CONTRAST})return rearContour(density).x*${REAR_STYLE.dyeGain.toFixed(2)};
 if(uMaxEnabled>1.5)return density*mix(1.,${MAX_FIELD_DYE_GAIN.toFixed(1)},uRearWall?rearFieldBrand(cell):1.);
 if(uMaxEnabled<.5)return density;
 vec2 q=(cell-uMaxCrop.xy)/max(uMaxCrop.zw,vec2(1.));
 // Shape the ambient dye before cell emergence AND bloom. Depth silhouettes
 // are composed later; the common wall keeps its original dye at the join.
 float lane=maxFlowLane(q,uMaxTime*uMaxLook.y);
 return mix(density,lane*(.8+min(density,2.)*.45),maxFlowEdge(q));
}
vec3 maxSilk(vec2 q,float t){
 // Wide advected dye ribbons, based on the earlier wall's packet envelopes.
 // Gloss belongs to the moving volume; there is no persistent hairline core.
 vec3 light=vec3(0.);
 for(int i=0;i<8;i++){
  float k=float(i),phase=k*2.39996;
  float travel=q.x*6.-t*1.8+phase;
  float packet=pow(.5+.5*cos(travel),2.5);
  float center=.065+k*.124+.040*sin(q.x*4.6-t*.85+phase)
    +.014*sin(q.x*10.-t*1.35+phase*.7);
  float width=.025+.020*(.5+.5*sin(q.x*4.-t*1.2+phase));
  float d=q.y-center;
  float body=exp(-pow(d/width,2.));
  float shoulder=exp(-pow(d/(width*1.85),2.));
  float bloom=exp(-pow(d/(width*3.4),2.));
  // A broad, offset highlight flows through the band like reflected light on silk.
  float gloss=exp(-pow((d+width*.30)/(width*.62),2.));
  float glint=pow(.5+.5*cos(travel-.7),4.);
  vec3 color=mix(uMaxColors[3],uMaxColors[1],.5+.5*sin(q.x*3.-t*.8+phase));
  color=mix(color,uMaxColors[4],(.5+.5*sin(travel*.7+1.))* .55);
  float cyan=smoothstep(.70,.99,.5+.5*sin(travel+phase*.4));
  color=mix(color,uMaxColors[0],cyan*.88);
  light+=color*(body*.82+shoulder*.24+bloom*.09)*packet
    +mix(color,uMaxColors[1],.18)*gloss*glint*.64*packet;
 }

 return light;
}
vec3 rearAmbientGlow(vec2 cell){
 // Full-canvas coordinates, never the worker crop: both receivers evaluate
 // exactly the same light at the seam. No extra texture or postprocess pass.
 vec2 p=(cell-uRearCrop.xy)/max(uRearCrop.zw,vec2(1.));
 float t=uMaxTime*.14,brand=rearFieldBrand(cell);
 vec3 light=vec3(0.);
 for(int i=0;i<4;i++){
  float k=float(i),phase=k*1.9;
  vec2 center=vec2(.08+k*.28+.075*sin(t*.7+phase),.5+.32*sin(t*.9+phase));
  vec2 radius=vec2(.13+.025*sin(t*.6+phase),.46+.09*cos(t*.8+phase));
  vec2 d=(p-center)/radius;
  float core=exp(-dot(d,d)),halo=exp(-dot(d,d)*.3);
  float breath=pow(.5+.5*sin(t+phase),3.);
  vec3 vk=mix(uPalette[1],uPalette[0],.65+.25*sin(t*.5+phase));
  vec3 mx=mix(uRearPalette[2],uRearPalette[3],.5+.5*sin(t*.6+phase));
  mx=mix(mx,uRearPalette[0],pow(.5+.5*cos(phase+t*.7),4.)*.65);
  light+=mix(vk,mx,brand)*(core*.82+halo*.18)*breath;
 }
 return light*${(REAR_STYLE.ambientGlow??0).toFixed(3)}*uBrightness;
}
vec3 maxAtmosphere(vec3 base,vec2 cell){
 if(uRearWall&&${REAR_CONTRAST}){
  // The distant halo follows the SAME advected contour as the sharp cells.
  // Two broad density envelopes live in the low-resolution underlay pass;
  // their RGB never turns the cell interior into an emissive white plate.
  vec2 p=cell/uMapSize;
  float dye=mix(texture2D(uPrevious,p).r,texture2D(uNext,p).r,uMix)*4.;
  vec3 hue=mix(uPalette[0],mix(uRearPalette[2],uRearPalette[3],.55),rearFieldBrand(cell));
  return base*${REAR_STYLE.underlayGain.toFixed(3)}+rearAmbientGlow(cell)+hue*rearContour(dye).y*uBrightness;
 }
 if(uMaxEnabled<.5)return base;
 vec2 q=(cell-uMaxCrop.xy)/max(uMaxCrop.zw,vec2(1.));
 if(uMaxEnabled>1.5)return mix(base,maxFieldGradient(q,uMaxTime),uRearWall?rearFieldBrand(cell):maxFlowEdge(q));
 // Exact zero at the join: the shared left-wall composition remains continuous.
 float edge=maxFlowEdge(q);
 if(edge<=0.)return base;
 float t=uMaxTime*uMaxLook.y;
 vec3 silk=maxSilk(q,t);
 // Glass panels and their dark foreground scrims provide local text contrast.
 return base+silk*edge*uMaxLook.x;
}
`;
