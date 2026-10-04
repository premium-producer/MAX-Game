import {MaxLiquidGlass} from './max-liquid-glass.js';
import {GLASS_REACH} from './max-glass-model.js';
import {panelOptics,PANEL_GLASS_REFERENCE,PANEL_OPTICS_GLSL} from './max-panel-optics.js';

// Iteration 2. The sphere shader stays unchanged in max-liquid-glass.js.
// Reuse its RT, clock, tile culling and lifecycle; replace only the optical material.
const fragment=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uBackground;
uniform vec4 uTile,uPanels[2];
uniform float uPanelCount,uIor,uTime,uPanelShift,uDepth,uLightAngle,uLightIntensity;
uniform vec2 uMenu;
uniform vec3 uViolet,uPurple;
${PANEL_OPTICS_GLSL}
float baseSDF(vec2 p,vec4 b){vec2 d=abs(p-b.xy-b.zw*.5)-(b.zw*.5-56.);return length(max(d,0.))+min(max(d.x,d.y),0.)-56.;}
float glassSDF(vec2 p,vec4 b){
 // Splay 0: stable rounded contour, without the former sinusoidal warping.
 return baseSDF(p,b);
}
vec2 uvAt(vec2 p){vec2 q=(p-uTile.xy)/uTile.zw;return clamp(vec2(q.x,1.-q.y),vec2(.0001),vec2(.9999));}
void main(){
 vec2 p=uTile.xy+vec2(vUv.x,1.-vUv.y)*uTile.zw;
 vec3 base=texture2D(uBackground,vUv).rgb;
 float aa=max(max(fwidth(p.x),fwidth(p.y)),.75),distanceToPanel=1e6;vec4 panel=vec4(0.);int panelIndex=0;
 for(int i=0;i<2;i++){
  if(float(i)>=uPanelCount)break;
  float d=glassSDF(p,uPanels[i]);
  float reach=1.-smoothstep(192.,${GLASS_REACH}.,d);
  float shadow=exp(-max(glassSDF(p-vec2(0.,20.),uPanels[i]),0.)/27.)*smoothstep(-2.,3.,d)*reach;
  base*=1.-shadow*.56;
  base+=uViolet*exp(-abs(d)/12.)*.016*reach;
  if(d<distanceToPanel){distanceToPanel=d;panel=uPanels[i];panelIndex=i;}
 }
 if(distanceToPanel>4.*aa){gl_FragColor=vec4(base,1.);return;}
 float coverage=1.-smoothstep(-aa,aa,distanceToPanel);
 vec2 q=(p-panel.xy)/panel.zw;
 float surfaceDistance,height;
 vec3 normal=panelSurface(p,panel,surfaceDistance,height);
 float bevel=1.-normal.z;
 vec2 shift=panelRayShift(normal,height,uIor,uDepth,uPanelShift,p-panel.xy-panel.zw*.5,-surfaceDistance);
 vec3 transmitted=texture2D(uBackground,uvAt(p+shift)).rgb;
 // Violet transmission belongs to the pane only; preserve the wall's own flows.
 float luminance=dot(transmitted,vec3(.2126,.7152,.0722));
 transmitted=mix(transmitted,mix(uViolet,uPurple,.14)*luminance*2.2,.12);
 transmitted*=.98-.08*bevel;
 float menu=panelIndex==0?uMenu.x:uMenu.y;
 float copyColumn=smoothstep(.12,.17,q.x)*(1.-smoothstep(.83,.88,q.x));
 float quiet=smoothstep(.28,.38,q.y)*(1.-smoothstep(.61,.69,q.y))*(1.-menu*copyColumn);
 vec3 reflected=reflect(vec3(0.,0.,-1.),normal);
 float wash=.5+.5*sin(reflected.x*2.+reflected.y*1.6+uTime*.19);
 transmitted+=mix(uViolet,uPurple,wash*.3)*(.006+.012*wash)*(.65+.35*quiet);
 vec3 key=normalize(vec3(cos(uLightAngle),sin(uLightAngle),.6));
 float light=pow(max(0.,dot(normal,key)),7.);
 float fresnel=.035+.965*pow(1.-normal.z,5.);
 float rim=exp(-pow(distanceToPanel/max(1.4,aa),2.));
 // Highlight follows the actual liquid contour, away from the central copy.
 transmitted+=mix(uViolet,uPurple,.22)*bevel*(.024+.065*light);
 transmitted+=mix(uViolet,vec3(1.),.62)*uLightIntensity*(rim*(.09+.30*light)+bevel*fresnel*.10+light*.025*quiet);
 gl_FragColor=vec4(mix(base,transmitted,coverage),1.);
}`;

export class MaxPanelGlass extends MaxLiquidGlass{
 constructor(engine,target){
  super(engine,target);
  this.uniforms.uPanelShift={value:56};
  this.uniforms.uPurple={value:this.uniforms.uViolet.value.clone().set('#9500FF')};
  this.uniforms.uDepth={value:PANEL_GLASS_REFERENCE.depth};
  this.uniforms.uLightAngle={value:PANEL_GLASS_REFERENCE.lightAngleDegrees*Math.PI/180};
  this.uniforms.uLightIntensity={value:PANEL_GLASS_REFERENCE.lightIntensity};
  this.material.fragmentShader=fragment;
 }
 draw(tile,width,mode,time,menus){
  const {shift}=panelOptics(width);
  this.uniforms.uPanelShift.value=shift;
  super.draw(tile,width,mode,time,menus);
 }
}
