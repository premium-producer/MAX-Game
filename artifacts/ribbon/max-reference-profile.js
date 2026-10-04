// Shared MAX reference, 3591×1113. No SVG, raster pattern or wall settings at runtime.
// Radial stops are exact. The blurred angular disks and raster wave envelope are
// analytical reconstructions, to be visually calibrated against the supplied frame.
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
export const FIELD_GLSL=coordinates+`
float hump(float x,float center,float width){float d=(x-center)/width;return exp(-d*d);}
vec4 profileField(vec2 px,vec2 size){
  vec2 p=referencePoint(px,size)/vec2(3591.0,1113.0);
  float x=1.0-p.x;
  // Periods divide the engine's 4096-second clock, preserving wrap continuity.
  float phase=f_clock.x*(6.28318530718/8.0);
  float a=.27+.028*sin(phase),b=.50+.025*sin(phase*.5),c=.74-.028*sin(phase);
  float height=.052+.17*(1.0+.18*sin(phase))*hump(x,a,.045)
    +.24*(1.0+.15*sin(phase*.5))*hump(x,b,.05)+.18*(1.0-.18*sin(phase))*hump(x,c,.046);
  float middle=.50+.018*sin(x*24.0)+.025*sin(phase)*sin(x*12.0);
  float wave=exp(-pow(abs(p.y-middle)/height,1.65));
  float density=.66+.34*sin(x*25.0+1.0)*sin(x*25.0+1.0);
  float grain=fract(sin(dot(floor(px/max(f_grid.z,1.0)),vec2(12.9898,78.233)))*43758.5453);
  float energy=1.25*wave*density*(.84+.16*grain)*(1.0+.12*sin(phase*2.0-x*18.0));
  // Reconstruct the supplied pattern's emissive palette, including the green
  // component of its lilac centre (previous pure-violet RGB lost that contrast).
  vec3 cyan=vec3(.08,.78,.96),blue=vec3(.24,.18,.88),lilac=vec3(.90,.40,.98);
  vec3 rgb=mix(cyan,blue,smoothstep(.07,.26,min(x,1.0-x)));
  rgb=mix(rgb,lilac,hump(x,.5,.18));
  return vec4(mix(rgb/12.92,pow((rgb+.055)/1.055,vec3(2.4)),step(vec3(.04045),rgb)),energy);
}
`;
export const COMPOSITE_GLSL=coordinates+`
float radialAlpha(vec2 p,vec2 center,vec2 radius,float a,float b){
  float r=length((p-center)/radius);
  return r<.55?mix(a,b,r/.55):mix(b,0.0,clamp((r-.55)/.45,0.0,1.0));
}
vec3 angularColor(vec2 p){
  vec2 d=p-vec2(4779.03,602.099);
  vec2 q=vec2((d.y-.0437703*d.x)/1.87787,-d.x/1.86963);
  float t=fract(atan(q.y,q.x)/6.28318530718+1.0);
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
  float phase=f_clock.x*(6.28318530718/16.0);
  // Slow, bounded drift of the light field, while the pixel lattice stays fixed.
  p+=vec2(105.0*sin(phase),52.0*sin(phase*2.0));
  vec3 base=vec3(13.0,0.0,26.0)/255.0,color=angularColor(p),bg=base;
  bg=mix(bg,color,diskCoverage(p,1591.16));
  bg=mix(bg,color,diskCoverage(p,662.985));
  bg=mix(bg,min(vec3(1.0),bg/max(vec3(.001),1.0-color)),.5*diskCoverage(p,1325.97));
  // SVG pattern covers the whole frame at 20%, including its near-black ground.
#ifndef MAX_GRADIENT_ONLY
  bg=mix(bg,clamp(vec3(.016,.008,.040)+cells,0.0,1.0),.2);
#endif
  bg=mix(bg,vec3(71.0,26.0,255.0)/255.0,radialAlpha(p,vec2(438.48,264.504),vec2(1434.49,1189.58),.42,.147));
  bg=mix(bg,vec3(149.0,0.0,255.0)/255.0,radialAlpha(p,vec2(3027.56,1132.2),vec2(1154.59,1021.64),.38,.133));
  bg=mix(bg,vec3(0.0,191.0,255.0)/255.0,radialAlpha(p,vec2(130.591,1300.14),vec2(1154.59,643.772),.18,.063));
  bg=mix(bg,vec3(110.0,26.0,255.0)/255.0,radialAlpha(p,vec2(1719.02,-372.27),vec2(1119.6,860.695),.18,.063));
  bg=mix(bg,base,radialAlpha(p,vec2(3244.48,1291.74),vec2(1371.51,1055.23),.58,.26));
  return clamp(bg,0.0,1.0);
}
`;
export const REFERENCE_CONFIG={
  extends:'reference',grid:{sizing:'count',count:32,gap:.28,roundness:.18,softness:1.1,bevel:0,emitter:.1},
  glow:{halo:{strength:.08},bloom:{strength:.16},haze:{strength:0},exposure:1,whitePoint:4},
  background:{color:'#0D001A',vignette:0,spotA:{strength:0},spotB:{strength:0}},
  animation:{speed:1,floor:0,flicker:{amount:0},sparkle:{amount:0}},
  lift:{amount:0},render:{quality:'high',maxDpr:4,maxPixels:12,opaque:true,reducedMotion:'ignore'}
};
