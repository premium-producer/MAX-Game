// KDW MAX: moving circular ramp controls both square size and emission.
// Analytical field and gradient share the engine clock; no per-frame textures.
export const REFERENCE_SIZE=[3591,1113];
export function referenceMotionDelta(delta,active=true,reduced=false){
  return active&&!reduced&&Number.isFinite(delta)?Math.max(0,Math.min(delta,.05)):0;
}
export function referenceMetrics(width,height,dpr=1){
  if(![width,height,dpr].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid viewport');
  const w=Math.round(width*dpr),h=Math.round(height*dpr);
  // Preserve the reference's ~103 columns at every window aspect. Height-based
  // cover enlarged the lattice and cropped away the cyan ends on tall windows.
  return {width:w,height:h,pitch:35*w/3591};
}
const coordinates=`
vec2 referencePoint(vec2 p,vec2 size){
  float scale=size.x/3591.0;
  return (p-size*.5)/scale+vec2(1795.5,556.5);
}
`;
export const FIELD_GLSL=`
vec4 profileField(vec2 px,vec2 size){
  // A true circle in screen pixels, not an ellipse in normalised viewport UV.
  float phase=f_clock.x*(6.28318530718/16.0);
  vec2 center=size*vec2(.5+.30*sin(phase),.5+.16*sin(phase*2.0));
  float radius=min(size.x,size.y)*(.72+.06*sin(phase*2.0));
  float distance=length(px-center)/radius;
  float mask=1.0-smoothstep(0.0,1.0,distance);
  vec3 blue=vec3(.24,.18,.88),cyan=vec3(.08,.78,.96),lilac=vec3(.90,.40,.98);
  vec3 rgb=mix(blue,cyan,.5+.5*sin(phase+px.x/size.x*3.0));
  rgb=mix(rgb,lilac,.25+.20*cos(phase*2.0+px.y/size.y*2.0));
  return vec4(mix(rgb/12.92,pow((rgb+.055)/1.055,vec3(2.4)),step(vec3(.04045),rgb)),1.3*mask);
}
`;
export const COMPOSITE_GLSL=coordinates+`
#define KDW_RADIAL_CELLS 1
float radialAlpha(vec2 p,vec2 center,vec2 radius,float a,float b){
  float r=length((p-center)/radius);
  return r<.55?mix(a,b,r/.55):mix(b,0.0,clamp((r-.55)/.45,0.0,1.0));
}
vec3 angularColor(vec2 p,float phase){
  vec2 d=p-vec2(4779.03,602.099);
  vec2 q=vec2((d.y-.0437703*d.x)/1.87787,-d.x/1.86963);
  float t=fract(atan(q.y,q.x)/6.28318530718+1.0+.18*sin(phase));
  vec3 a=vec3(0.0,190.0,255.0)/255.0,b=vec3(71.0,26.0,255.0)/255.0;
  vec3 c=vec3(148.0,0.0,255.0)/255.0,dark=vec3(110.0,26.0,255.0)/255.0;
  if(t<.247607)return mix(a,b,t/.247607);
  if(t<.4958539)return mix(b,c,(t-.247607)/.2482469);
  if(t<.7469833)return mix(c,dark,(t-.4958539)/.2511294);
  return mix(dark,a,(t-.7469833)/.2530167);
}
float diskCoverage(vec2 p,float sigma){
  float distance=length(p-vec2(4779.03,602.099))-1877.87;
  // Gaussian CDF approximation with disk-curvature attenuation: bounded, no huge filter targets.
  float x=distance/(sigma*1.41421356);
  float erf=sign(x)*sqrt(1.0-exp(-x*x*(1.27323954+.147*x*x)/(1.0+.147*x*x)));
  return .5*(1.0-erf)*exp(-.5*sigma*sigma/(1877.87*1877.87));
}
vec3 profileComposite(vec2 px,vec2 size,vec3 cells){
  vec2 p=referencePoint(px,size);
  float phase=f_clock.x*(6.28318530718/8.0);
  // Independent smooth orbits move the colour field, never the UI or lattice.
  p+=vec2(440.0*sin(phase*.5),185.0*sin(phase));
  p+=vec2(110.0*sin(p.y/620.0+phase),90.0*cos(p.x/1100.0-phase*.5));
  vec3 base=vec3(13.0,0.0,26.0)/255.0,color=angularColor(p,phase*.5),bg=base;
  bg=mix(bg,color,diskCoverage(p,1591.16));
  bg=mix(bg,color,diskCoverage(p,662.985));
  bg=mix(bg,min(vec3(1.0),bg/max(vec3(.001),1.0-color)),.5*diskCoverage(p,1325.97));
  // Keep the moving cells subordinate to foreground copy and interaction cards.
#ifndef MAX_GRADIENT_ONLY
  bg=mix(bg,clamp(vec3(.016,.008,.040)+cells,0.0,1.0),.2);
#endif
  bg=mix(bg,vec3(71.0,26.0,255.0)/255.0,radialAlpha(p,vec2(438.48,264.504)+vec2(540.0*cos(phase*.5),210.0*sin(phase)),vec2(1434.49,1189.58),.42,.147));
  bg=mix(bg,vec3(149.0,0.0,255.0)/255.0,radialAlpha(p,vec2(3027.56,1132.2)+vec2(380.0*sin(phase),260.0*cos(phase*.5)),vec2(1154.59,1021.64),.38,.133));
  bg=mix(bg,vec3(0.0,191.0,255.0)/255.0,radialAlpha(p,vec2(530.591,1000.14)+vec2(720.0*sin(phase*.5),340.0*cos(phase)),vec2(1154.59,643.772),.23,.0805));
  bg=mix(bg,vec3(110.0,26.0,255.0)/255.0,radialAlpha(p,vec2(1719.02,-372.27),vec2(1119.6,860.695),.18,.063));
  bg=mix(bg,base,radialAlpha(p,vec2(3244.48,1291.74),vec2(1371.51,1055.23),.58,.26));
  return clamp(bg,0.0,1.0);
}
`;
export const REFERENCE_CONFIG={
  extends:'reference',grid:{sizing:'count',count:32,gap:.18,roundness:.18,softness:1.1,bevel:0,emitter:.1},
  glow:{halo:{strength:.08},bloom:{strength:.16},haze:{strength:0},exposure:1,whitePoint:4},
  background:{color:'#0D001A',vignette:0,spotA:{strength:0},spotB:{strength:0}},
  animation:{speed:1,floor:0,flicker:{amount:0},sparkle:{amount:0}},
  lift:{amount:0},render:{quality:'high',maxDpr:4,maxPixels:12,opaque:true,reducedMotion:'ignore'}
};
