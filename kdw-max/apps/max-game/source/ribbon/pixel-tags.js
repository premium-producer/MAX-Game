import {VK_VIDEO} from './vk-brand.js';
import * as THREE from 'three';
import {pixelTagPose,routedPixelTagPose} from './pixel-tags-model.js';
const MAX=96;
const vertex=`attribute vec4 aRect;attribute vec2 aStyle;uniform vec2 uResolution,uTileOrigin;varying vec2 vUv,vSize;varying vec2 vStyle;uniform float uWorldWidth;varying float vGlobalX;
void main(){vUv=uv;vSize=aRect.zw;vStyle=aStyle;vec2 p=aRect.xy+position.xy*vec2(1.,-1.)*aRect.zw;vGlobalX=p.x/uWorldWidth;gl_Position=vec4((p-uTileOrigin)/uResolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const fragment=`varying vec2 vUv,vSize,vStyle;uniform vec3 uBlue,uRed,uBrandBlue,uBrandRed;uniform vec2 uBrandRange;varying float vGlobalX;uniform float uRoundness;
void main(){vec2 p=abs((vUv-.5)*vSize);float r=min(vSize.x,vSize.y)*uRoundness*.5;vec2 q=p-vSize*.5+r;float d=length(max(q,0.))+min(max(q.x,q.y),0.)-r;
float aa=max(fwidth(d),.001);float alpha=(1.-smoothstep(-aa,aa,d))*vStyle.y;
float brand=smoothstep(uBrandRange.x,uBrandRange.y,vGlobalX);
gl_FragColor=vec4(mix(mix(uBlue,uBrandBlue,brand),mix(uRed,uBrandRed,brand),step(.5,vStyle.x)),alpha);
#include <colorspace_fragment>
}`;
export class PixelTags{
 constructor(layout){
  this.layout=layout;this.pose={};this.rect=new THREE.InstancedBufferAttribute(new Float32Array(MAX*3*4),4).setUsage(THREE.DynamicDrawUsage);this.style=new THREE.InstancedBufferAttribute(new Float32Array(MAX*3*2),2).setUsage(THREE.DynamicDrawUsage);
  const plane=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();g.index=plane.index;g.setAttribute('position',plane.getAttribute('position'));g.setAttribute('uv',plane.getAttribute('uv'));g.setAttribute('aRect',this.rect);g.setAttribute('aStyle',this.style);g.instanceCount=0;plane.dispose();
  const m=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:false,depthWrite:false,uniforms:{uWorldWidth:{value:1},uBrandRange:{value:new THREE.Vector2(2,3)},uBrandBlue:{value:new THREE.Color(VK_VIDEO.blue)},uBrandRed:{value:new THREE.Color(VK_VIDEO.red)},uTileOrigin:{value:new THREE.Vector2()},uResolution:{value:new THREE.Vector2(1,1)},uBlue:{value:new THREE.Color(VK_VIDEO.blue)},uRed:{value:new THREE.Color(VK_VIDEO.red)},uRoundness:{value:layout.roundness}}});
  this.mesh=new THREE.Mesh(g,m);this.mesh.frustumCulled=false;this.mesh.renderOrder=-1;
 }
 update(time,settings,width,height,rows,gap,route=null,loopX=false){
  this.mesh.material.uniforms.uWorldWidth.value=width;
  const count=Math.min(MAX,settings.particles);this.mesh.visible=count>0&&settings.particleOpacity>0;this.mesh.geometry.instanceCount=count*(loopX?3:1);this.mesh.material.uniforms.uResolution.value.set(width,height);
  if(!this.mesh.visible)return;
  for(let i=0;i<count;i++){const p=route?routedPixelTagPose(i,route.time,settings,this.layout,width,height,rows,gap,route,this.pose):pixelTagPose(i,time,settings,this.layout,width,height,rows,gap,this.pose,loopX);for(let j=0;j<(loopX?3:1);j++){const n=i*(loopX?3:1)+j;this.rect.setXYZW(n,p.x+(loopX?j-1:0)*width,p.y,p.width,p.height);this.style.setXY(n,p.red?1:0,p.alpha);}}
  this.rect.needsUpdate=true;this.style.needsUpdate=true;
 }
 dispose(){this.mesh.geometry.dispose();this.mesh.material.dispose();}
}
