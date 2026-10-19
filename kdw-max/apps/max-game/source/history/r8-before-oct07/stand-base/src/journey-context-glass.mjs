import * as THREE from 'three';
import {CONTEXT_GLASS_CALIBRATION as LOOK,BACKDROP_BLUR_GLSL,backdropBlurLod} from '../../service/public/max-panel-optics.js';

// Only while a context card is open: sample the actual UI behind it, including
// labels/badges. One reusable target per renderer, never per card or frame.
export class JourneyContextGlass{
 constructor(){
  this.target=null;this.buffer=new THREE.Vector2();this.clear=new THREE.Color();
  this.uniforms={source:{value:null},size:{value:new THREE.Vector2()},panes:{value:Array.from({length:4},()=>new THREE.Vector4())},styles:{value:Array.from({length:4},()=>new THREE.Vector2())},count:{value:0},lod:{value:0}};
  this.geometry=new THREE.PlaneGeometry(2,2);
  this.material=new THREE.ShaderMaterial({transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms:this.uniforms,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform vec2 size;uniform vec4 panes[4];uniform vec2 styles[4];uniform float count,lod;
${BACKDROP_BLUR_GLSL}
float sdf(vec2 p,vec4 b,float r){vec2 q=abs(p-b.xy-b.zw*.5)-(b.zw*.5-r);return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){vec2 p=vec2(vUv.x,1.-vUv.y)*size;vec4 c=texture2D(source,vUv);float coverage=0.;
 for(int i=0;i<4;i++){if(float(i)>=count)break;float d=sdf(p,panes[i],styles[i].x);coverage=max(coverage,(1.-smoothstep(-1.,1.,d))*styles[i].y);}
 if(coverage>0.)c=mix(c,backdropBlur(source,vUv,lod),coverage);
 gl_FragColor=vec4(c.a>.00001?c.rgb/c.a:vec3(0.),c.a);
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a;
}`});
  this.scene=new THREE.Scene();this.scene.add(new THREE.Mesh(this.geometry,this.material));this.camera=new THREE.Camera();
 }
 resize(renderer){
  renderer.getDrawingBufferSize(this.buffer);
  // Canvas antialiasing does not carry into this offscreen pass. Preserve
  // coverage at icon/check edges without increasing the drawing resolution.
  const maxSamples=Math.max(0,Math.floor(renderer.capabilities.maxSamples||0));
  const samples=maxSamples<2?0:Math.min(this.buffer.x*this.buffer.y<=1920*1080?4:2,maxSamples);
  if(!this.target)this.target=new THREE.WebGLRenderTarget(this.buffer.x,this.buffer.y,{depthBuffer:false,minFilter:THREE.LinearMipmapLinearFilter,generateMipmaps:true,samples});
  if(this.target.samples!==samples){this.target.dispose();this.target.samples=samples;}
  if(this.target.width!==this.buffer.x||this.target.height!==this.buffer.y)this.target.setSize(this.buffer.x,this.buffer.y);
 }
 async prepareGPU(renderer){
  this.resize(renderer);renderer.initRenderTarget(this.target);
  this.uniforms.source.value=this.target.texture;
  await renderer.compileAsync(this.scene,this.camera);
 }
 render(renderer,scene,camera,panes,size){
  if(!panes.length){const mask=camera.layers.mask;camera.layers.enableAll();renderer.clearDepth();renderer.render(scene,camera);camera.layers.mask=mask;return;}
  this.resize(renderer);
  const target=renderer.getRenderTarget(),auto=renderer.autoClear,alpha=renderer.getClearAlpha(),mask=camera.layers.mask;
  renderer.getClearColor(this.clear);
  try{
   camera.layers.set(0);renderer.setRenderTarget(this.target);renderer.setClearColor(0,0);renderer.clear();renderer.autoClear=false;renderer.render(scene,camera);
   renderer.setRenderTarget(target);
   this.uniforms.source.value=this.target.texture;this.uniforms.size.value.set(size.width,size.height);
   this.uniforms.count.value=Math.min(4,panes.length);this.uniforms.lod.value=backdropBlurLod(LOOK.frostRadius,this.buffer.x/size.width);
   panes.slice(0,4).forEach((p,i)=>{this.uniforms.panes.value[i].set(p.x,p.y,p.w,p.h);this.uniforms.styles.value[i].set(p.radius,p.opacity);});
   renderer.render(this.scene,this.camera);
   camera.layers.set(1);renderer.clearDepth();renderer.render(scene,camera);
   // The original selected tile stays sharp above its card throughout the transition.
   camera.layers.set(2);renderer.clearDepth();renderer.render(scene,camera);
  }finally{camera.layers.mask=mask;renderer.autoClear=auto;renderer.setClearColor(this.clear,alpha);renderer.setRenderTarget(target);}
 }
 dispose(){this.target?.dispose();this.geometry.dispose();this.material.dispose();}
}
