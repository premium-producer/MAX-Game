import {MaxLiquidGlass} from './max-liquid-glass.js';
import {GLASS_REACH} from './max-glass-model.js';
import {panelOptics,PANEL_GLASS_REFERENCE,PANEL_OPTICS_GLSL,BUTTON_GLASS_REFERENCE,BUTTON_FROST_RADIUS,MAX_GLASS_CONTROLS} from './max-panel-optics.js';

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
uniform vec4 uControls[${MAX_GLASS_CONTROLS}];
uniform vec2 uControlStyle[${MAX_GLASS_CONTROLS}];
uniform float uControlCount,uButtonBlur,uButtonDepth,uButtonLight,uButtonAngle;
${PANEL_OPTICS_GLSL}
float baseSDF(vec2 p,vec4 b){vec2 d=abs(p-b.xy-b.zw*.5)-(b.zw*.5-56.);return length(max(d,0.))+min(max(d.x,d.y),0.)-56.;}
float glassSDF(vec2 p,vec4 b){
 // Splay 0: stable rounded contour, without the former sinusoidal warping.
 return baseSDF(p,b);
}
vec2 uvAt(vec2 p){vec2 q=(p-uTile.xy)/uTile.zw;return clamp(vec2(q.x,1.-q.y),vec2(.0001),vec2(.9999));}
float controlSDF(vec2 p,vec4 b,float r){
 vec2 q=abs(p-b.xy-b.zw*.5)-(b.zw*.5-r);
 return length(max(q,0.))+min(max(q.x,q.y),0.)-r;
}
vec3 controlBackground(vec2 p,vec2 offset,vec4 panel){
 // Each blur tap sees the panel's lens below the control. The foreground is
 // deliberately excluded. Bound COMBINED offsets, not just each effect alone.
 float d,h;vec3 n=panelSurface(p+offset,panel,d,h);
 vec2 shift=panelRayShift(n,h,uIor,uDepth,uPanelShift,p+offset-panel.xy-panel.zw*.5,-d);
 vec2 sampleOffset=clamp(offset+shift,vec2(-uPanelShift),vec2(uPanelShift));
 vec3 c=texture2D(uBackground,uvAt(p+sampleOffset)).rgb;
 return mix(c,mix(uViolet,uPurple,.14)*dot(c,vec3(.2126,.7152,.0722))*2.2,.12);
}
vec3 controlGlass(vec3 base,vec2 p,vec4 panel,float aa){
 int hit=-1;float d=1e6;
 for(int i=0;i<${MAX_GLASS_CONTROLS};i++){
  if(float(i)>=uControlCount)break;
  vec4 b=uControls[i];
  if(p.x<b.x-6.*aa||p.x>b.x+b.z+6.*aa||p.y<b.y-6.*aa||p.y>b.y+b.w+6.*aa)continue;
  float candidate=controlSDF(p,b,uControlStyle[i].x);
  if(candidate<d){d=candidate;hit=i;}
 }
 if(hit<0||d>6.*aa)return base;
 vec4 b=uControls[hit];float radius=uControlStyle[hit].x;
 float coverage=1.-smoothstep(-aa,aa,d);
 vec2 local=p-b.xy-b.zw*.5;
 vec2 delta=max(abs(local)-(b.zw*.5-radius),0.);
 vec2 outward=sign(local)*delta/max(length(delta),.0001);
 float bezel=max(1.,min(12.,radius*.7));
 float k=1.-clamp(-d/bezel,0.,1.),a=max(0.,1.-pow(k,4.));
 vec3 normal=normalize(vec3(outward*k*k*k,pow(a,.75)));
 vec3 ray=refract(vec3(0.,0.,-1.),normal,1./uIor);
 vec2 shift=ray.xy/max(-ray.z,.001)*uButtonDepth;
 // Five bilinear samples, only inside the small control footprint.
 vec3 c=controlBackground(p,shift,panel)*.4;
 c+=controlBackground(p,shift+vec2(uButtonBlur,0.),panel)*.15;
 c+=controlBackground(p,shift-vec2(uButtonBlur,0.),panel)*.15;
 c+=controlBackground(p,shift+vec2(0.,uButtonBlur),panel)*.15;
 c+=controlBackground(p,shift-vec2(0.,uButtonBlur),panel)*.15;
 float q=clamp((p.x-b.x)/b.z,0.,1.);
 // Violet frosted control, distinct from the clear large panel.
 c=c*.42+mix(uViolet,uPurple,q*.4)*(.045+.025*(1.-q));
 vec3 key=normalize(vec3(cos(uButtonAngle),sin(uButtonAngle),.6));
 float light=pow(max(0.,dot(normal,key)),5.);
 float rim=exp(-pow(d/max(1.1,aa),2.));
 c+=mix(uViolet,vec3(1.),.6)*uButtonLight*rim*(.055+.23*light);
 c+=uViolet*(1.-normal.z)*.045;
 float opacity=uControlStyle[hit].y;
 base*=1.-.16*exp(-max(d,0.)/3.)*(1.-coverage)*opacity;
 return mix(base,c,coverage*opacity);
}
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
 gl_FragColor=vec4(controlGlass(mix(base,transmitted,coverage),p,panel,aa),1.);
}`;

export class MaxPanelGlass extends MaxLiquidGlass{
 constructor(engine,target){
  super(engine,target);
  this.uniforms.uPanelShift={value:56};
  this.uniforms.uPurple={value:this.uniforms.uViolet.value.clone().set('#9500FF')};
  this.uniforms.uDepth={value:PANEL_GLASS_REFERENCE.depth};
  this.uniforms.uLightAngle={value:PANEL_GLASS_REFERENCE.lightAngleDegrees*Math.PI/180};
  this.uniforms.uLightIntensity={value:PANEL_GLASS_REFERENCE.lightIntensity};
  this.controls=[];
  this.uniforms.uControls={value:Array.from({length:MAX_GLASS_CONTROLS},()=>this.uniforms.uPanels.value[0].clone())};
  this.uniforms.uControlStyle={value:Array.from({length:MAX_GLASS_CONTROLS},()=>this.uniforms.uMenu.value.clone())};
  this.uniforms.uControlCount={value:0};
  this.uniforms.uButtonBlur={value:BUTTON_FROST_RADIUS};
  this.uniforms.uButtonDepth={value:BUTTON_GLASS_REFERENCE.depth};
  this.uniforms.uButtonLight={value:BUTTON_GLASS_REFERENCE.lightIntensity};
  this.uniforms.uButtonAngle={value:BUTTON_GLASS_REFERENCE.lightAngleDegrees*Math.PI/180};
  this.material.fragmentShader=fragment;
 }
 setControls(controls){this.controls=controls.slice(0,MAX_GLASS_CONTROLS);}
 draw(tile,width,mode,time,menus){
  const {shift}=panelOptics(width);
  this.uniforms.uPanelShift.value=shift;
  // Cull controls outside this tile before the fragment loop; no DOM read per tile.
  const [x,y,w,h]=(tile.rect??tile.renderRect).map(v=>v*4096/width);
  const visible=this.controls.filter(c=>c.rect[0]+c.rect[2]+8>x&&c.rect[0]-8<x+w&&c.rect[1]+c.rect[3]+8>y&&c.rect[1]-8<y+h);
  this.uniforms.uControlCount.value=visible.length;
  visible.forEach((c,i)=>{this.uniforms.uControls.value[i].set(...c.rect);this.uniforms.uControlStyle.value[i].set(c.radius,c.opacity);});
  super.draw(tile,width,mode,time,menus);
 }
}
