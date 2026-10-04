// Project adaptation of the MAX palette, not a reproduction of the Figma Angular asset.
export const MAX_WALL_LOOK=Object.freeze({strength:1.35,speed:0.38});
export const MAX_WALL_COLORS=Object.freeze(['#00BFFF','#6E1AFF','#0D001A','#471AFF','#9500FF','#FFFFFF']);
export const MAX_WALL_ATMOSPHERE_GLSL=`
uniform float uMaxEnabled,uMaxTime;
uniform vec4 uMaxCrop,uMaxLook;
uniform vec3 uMaxColors[6];
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
float maxHorizontalDensity(vec2 cell,float density){
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
vec3 maxAtmosphere(vec3 base,vec2 cell){
 if(uMaxEnabled<.5)return base;
 vec2 q=(cell-uMaxCrop.xy)/max(uMaxCrop.zw,vec2(1.));
 // Exact zero at the join: the shared left-wall composition remains continuous.
 float edge=maxFlowEdge(q);
 if(edge<=0.)return base;
 float t=uMaxTime*uMaxLook.y;
 vec3 silk=maxSilk(q,t);
 // Glass panels and their dark foreground scrims provide local text contrast.
 return base+silk*edge*uMaxLook.x;
}
`;
