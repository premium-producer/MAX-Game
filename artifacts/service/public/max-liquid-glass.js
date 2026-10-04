import * as THREE from 'three';
import {glassPanels,glassLayers,glassTileRect,glassTileVisible,glassRefractionLimit,GLASS_IOR,GLASS_REACH} from './max-glass-model.js';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uBackground;
uniform vec4 uTile,uPanels[2],uLenses[4];
uniform float uPanelCount,uLensCount,uIor,uRefractionLimit,uTime;
uniform vec2 uMenu;
uniform vec3 uCyan,uViolet;
float boxSDF(vec2 p,vec4 box){vec2 d=abs(p-box.xy-box.zw*.5)-(box.zw*.5-56.);return length(max(d,0.))+min(max(d.x,d.y),0.)-56.;}
vec2 uvAt(vec2 p){vec2 q=(p-uTile.xy)/uTile.zw;return clamp(vec2(q.x,1.-q.y),vec2(.0001),vec2(.9999));}
void main(){
 vec2 p=uTile.xy+vec2(vUv.x,1.-vUv.y)*uTile.zw;
 vec3 base=texture2D(uBackground,vUv).rgb;
 float aa=max(fwidth(p.x),1.);
 vec4 panel=vec4(0.);float distanceToPanel=1e6;int panelIndex=-1;
 for(int i=0;i<2;i++){
  if(float(i)>=uPanelCount)break;
  float d=boxSDF(p,uPanels[i]);
  // Offset contact shadow plus broad falloff: no rectangular opaque backing.
  // Cast shadow only outside the actual panel.
  float reach=1.-smoothstep(192.,${GLASS_REACH}.,d);
  float shadow=exp(-max(boxSDF(p-vec2(0.,20.),uPanels[i]),0.)/27.)*smoothstep(-2.,3.,d)*reach;
  base*=1.-shadow*.53;
  vec2 local=(p-uPanels[i].xy)/uPanels[i].zw;
  vec3 glow=mix(uViolet,uCyan,.5+.5*sin(local.x*3.4+local.y*1.6));
  base+=glow*exp(-abs(d)/20.)*.065*reach;
  if(d<distanceToPanel){distanceToPanel=d;panel=uPanels[i];panelIndex=i;}
 }
 if(distanceToPanel>4.*aa){gl_FragColor=vec4(base,1.);return;}
 float coverage=1.-smoothstep(-aa,aa,distanceToPanel);
 vec2 q=(p-panel.xy)/panel.zw;
 vec2 normal2=normalize(vec2(boxSDF(p+vec2(1.,0.),panel)-boxSDF(p-vec2(1.,0.),panel),boxSDF(p+vec2(0.,1.),panel)-boxSDF(p-vec2(0.,1.),panel))+vec2(1e-5));
 float bevel=exp(-abs(distanceToPanel)/18.);
 vec3 normal=normalize(vec3(normal2*bevel*1.7,1.));
 vec3 ray=refract(vec3(0.,0.,-1.),normal,1./uIor);
 vec2 shift=ray.xy/max(abs(ray.z),.2)*42.;
 float fresnel=.035+.965*pow(1.-normal.z,5.);
 float sheen=0.;float thickness=0.;float edgeShade=0.;vec3 reflection=vec3(0.);
 vec3 key=normalize(vec3(-.65+.25*sin(uTime*.19),-.7,.65));
 // Lens fields add their normals. The input texture is read-only this pass.
 for(int i=0;i<4;i++){
  if(float(i)>=uLensCount)break;
  vec4 lens=uLenses[i];
  vec2 delta=p-lens.xy;float radius=length(delta);float d=radius-lens.z;
  float inside=1.-smoothstep(-aa,aa,d);
  vec2 radial=delta/max(radius,1.);
  float edge=exp(-abs(d)/24.);
  float bulge=clamp(radius/lens.z,0.,1.);
  vec3 n=normalize(vec3(radial*(.85*bulge+edge*2.1),1.));
  vec3 transmitted=refract(vec3(0.,0.,-1.),n,1./uIor);
  shift+=transmitted.xy/max(abs(transmitted.z),.2)*(82.+32.*edge)*inside;
  thickness+=inside;
  float light=pow(max(0.,dot(n,key)),9.);
  // Analytic brand-colored studio reflections, not RGB dispersion or another texture pass.
  vec3 reflected=reflect(vec3(0.,0.,-1.),n);
  float band=exp(-pow((reflected.y+.35*reflected.x-.34*sin(uTime*.22+lens.w))/.27,2.));
  float hue=.5+.5*sin(reflected.x*2.4+uTime*.16+lens.w);
  reflection+=mix(uViolet,uCyan,hue)*inside*(.018+.13*band+.085*light);
  sheen+=exp(-abs(d)/2.2)*(.035+.24*light)+edge*light*.13;
  edgeShade+=edge*inside*(.08+.10*max(0.,radial.y));
 }
 // Bound refraction within the rear tile halo; never fetch the next tile edge.
 shift=clamp(shift,vec2(-uRefractionLimit),vec2(uRefractionLimit));
 // Clear glass on a smooth background needs a single bilinear lookup, not five blur taps.
 vec3 transmitted=texture2D(uBackground,uvAt(p+shift)).rgb;
 // Clear absorption keeps the transmitted gradient, instead of painting a fake disk.
 transmitted*=.94-min(thickness,3.)*.035-min(edgeShade,.3);
 // Keep glints out of the copy and controls; the game/UI is composed afterwards.
 float quiet=smoothstep(.28,.38,q.y)*(1.-smoothstep(.61,.69,q.y));
 float menu=panelIndex==0?uMenu.x:uMenu.y;
 float copyColumn=smoothstep(.12,.17,q.x)*(1.-smoothstep(.83,.88,q.x));
 quiet*=1.-menu*copyColumn;
 // Broad color remains readable under controls; sharp glints stay outside the copy.
 transmitted+=reflection*(.55+.45*quiet)+vec3(sheen*quiet);
 float edgeLight=pow(max(0.,dot(normal,normalize(vec3(-.65,-.75,.6)))),5.);
 float rim=exp(-abs(distanceToPanel)/1.7);
 transmitted+=mix(uViolet,uCyan,q.x)*bevel*.038+vec3(rim*(.07+.28*edgeLight)+fresnel*bevel*.06);
 gl_FragColor=vec4(mix(base,transmitted,coverage),1.);
}`;

export class MaxLiquidGlass{
 constructor(engine,target){
  this.engine=engine;this.renderer=engine.renderer;this.target=target;this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  this.input=new THREE.WebGLRenderTarget(target.width,target.height,{type:THREE.HalfFloatType,depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
  this.uniforms={uBackground:{value:this.input.texture},uTile:{value:new THREE.Vector4()},uPanels:{value:[new THREE.Vector4(),new THREE.Vector4()]},uLenses:{value:Array.from({length:4},()=>new THREE.Vector4())},uPanelCount:{value:2},uLensCount:{value:3},uTime:{value:0},uMenu:{value:new THREE.Vector2(1,1)},uIor:{value:GLASS_IOR},uRefractionLimit:{value:46},uCyan:{value:new THREE.Color('#00BFFF')},uViolet:{value:new THREE.Color('#6E1AFF')}};
  this.material=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);this.scene=new THREE.Scene();this.scene.add(this.quad);this.camera=new THREE.Camera();
  engine.programTarget=this.input;
 }
 async prepare(){await this.renderer.compileAsync(this.scene,this.camera);}
 beginTile(tile,width,mode){
  this.active=glassTileVisible(tile,width,mode);
  if(this.active&&(this.input.width!==this.target.width||this.input.height!==this.target.height))this.input.setSize(this.target.width,this.target.height);
  // Empty tiles go straight to the existing atlas: no copy or glass pass needed.
  this.engine.programTarget=this.active?this.input:this.target;
 }
 draw(tile,width,mode,time,menus=[true,true]){
  if(this.active===false)return;
  if(this.target.texture===this.input.texture)throw Error('Glass refraction requires separate read/write targets');
  if(this.input.width!==this.target.width||this.input.height!==this.target.height)this.input.setSize(this.target.width,this.target.height);
  const panels=glassPanels(mode),lenses=glassLayers(mode,this.motion.matches?0:time),u=this.uniforms;
  u.uTime.value=this.motion.matches?0:time;u.uMenu.value.set(menus[0]?1:0,menus[1]?1:0);u.uRefractionLimit.value=glassRefractionLimit(width);u.uTile.value.set(...glassTileRect(tile,width));u.uPanelCount.value=panels.length;u.uLensCount.value=lenses.length;
  panels.forEach((r,i)=>u.uPanels.value[i].set(...r));lenses.forEach((r,i)=>u.uLenses.value[i].set(...r));
  const r=this.renderer,clear=r.autoClear;r.setRenderTarget(this.target);r.setScissorTest(false);r.setViewport(0,0,this.target.width,this.target.height);r.autoClear=true;r.render(this.scene,this.camera);r.autoClear=clear;
 }
 dispose(){this.input.dispose();this.material.dispose();this.quad.geometry.dispose();}
}
