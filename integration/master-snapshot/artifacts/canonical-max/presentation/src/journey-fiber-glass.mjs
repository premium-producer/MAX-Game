import * as THREE from 'three';
import {readGlassControls,BUTTON_GLASS_CALIBRATION as LOOK,MAX_GLASS_CONTROLS,BACKDROP_BLUR_GLSL,backdropBlurLod} from '../../service/public/max-panel-optics.js';

// The wall and fibers are in different contexts in Stand Service. Filter both
// under the same control mask. Reuse the field's linear HDR target, including
// fiber bloom, rather than reading pixels or allocating a target per button.
export const FIBER_GLASS_FRAGMENT=`
varying vec2 vUv;
uniform sampler2D source;
uniform vec2 logicalSize;
uniform vec4 controls[${MAX_GLASS_CONTROLS}];
uniform vec3 styles[${MAX_GLASS_CONTROLS}];
uniform float count,unit,lod;
${BACKDROP_BLUR_GLSL}
float sdf(vec2 p,vec4 b,float r){vec2 q=abs(p-b.xy-b.zw*.5)-(b.zw*.5-r);return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y)*logicalSize;vec4 raw=texture2D(source,vUv),color=raw;
 float aa=max(fwidth(p.x),fwidth(p.y));int hit=-1;float d=1e6;
 for(int i=0;i<${MAX_GLASS_CONTROLS};i++){
  if(float(i)>=count)break;vec4 b=controls[i];
  if(p.x<b.x-aa||p.x>b.x+b.z+aa||p.y<b.y-aa||p.y>b.y+b.w+aa)continue;
  float v=sdf(p,b,styles[i].x);if(v<=aa){d=v;hit=i;break;}
 }
 if(hit>=0&&d<aa){
  vec4 blur=backdropBlur(source,vUv,lod+log2(max(1.,styles[hit].z)));
  // Mips filter premultiplied radiance AND coverage. Never mix a sharp core back
  // under the frosted face; only the anti-aliased outer edge blends with raw.
  vec3 violet=vec3(.15593,.01033,1.);
  blur.rgb=mix(blur.rgb,violet*dot(blur.rgb,vec3(.2126,.7152,.0722))*2.2,${LOOK.violetTint})*${LOOK.transmission};
  color=mix(raw,blur,(1.-smoothstep(-aa,aa,d))*styles[hit].y);
 }
 // The render target holds premultiplied linear color. Convert straight color
 // once, then restore premultiplication for the transparent browser canvas.
 color.a=clamp(color.a,0.,1.);
 gl_FragColor=vec4(color.a>.00001?color.rgb/color.a:vec3(0.),color.a);
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a;
}`;

export class JourneyFiberGlass{
 constructor(getSize,doc=document){
  this.getSize=getSize;this.doc=doc;this.stamp='';this.bufferSize=new THREE.Vector2();
  this.uniforms={source:{value:null},logicalSize:{value:new THREE.Vector2()},controls:{value:Array.from({length:MAX_GLASS_CONTROLS},()=>new THREE.Vector4())},styles:{value:Array.from({length:MAX_GLASS_CONTROLS},()=>new THREE.Vector3())},count:{value:0},unit:{value:1},lod:{value:0}};
  this.geometry=new THREE.PlaneGeometry(2,2);
  this.material=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:FIBER_GLASS_FRAGMENT,depthTest:false,depthWrite:false,blending:THREE.NoBlending,toneMapped:false});
  this.scene=new THREE.Scene();this.scene.add(new THREE.Mesh(this.geometry,this.material));this.camera=new THREE.Camera();
 }
 render(renderer,target){
  const {width,height}=this.getSize(),unit=4096/width;
  const stamp=this.doc.documentElement.dataset.glassRevision+':'+width+':'+height;
  if(stamp!==this.stamp){
   this.stamp=stamp;const controls=readGlassControls(this.doc);this.uniforms.count.value=controls.length;
   controls.forEach((c,i)=>{this.uniforms.controls.value[i].set(...c.rect);this.uniforms.styles.value[i].set(c.radius,c.opacity,c.blurScale??1);});
  }
  renderer.getDrawingBufferSize(this.bufferSize);
  this.uniforms.logicalSize.value.set(4096,height*unit);this.uniforms.unit.value=unit;
  this.uniforms.lod.value=backdropBlurLod(LOOK.frostRadius,this.bufferSize.x/width);
  this.uniforms.source.value=target.texture;renderer.setRenderTarget(null);renderer.render(this.scene,this.camera);
 }
 dispose(){this.geometry.dispose();this.material.dispose();}
}
