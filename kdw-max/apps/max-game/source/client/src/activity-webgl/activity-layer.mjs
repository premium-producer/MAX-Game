import {deviceBrightness} from '../kdw-device-brightness.mjs';
import * as THREE from 'three';
import {activityControllers,invalidateActivityGPU} from './activity-runtime.mjs';
const vertex=`attribute vec4 aRect,aClip,aUV,aTint;attribute vec4 aShape;attribute float aClipRadius,aBrightness;varying float brightness;uniform vec3 projection;varying vec2 local,screen;varying vec4 bounds,clipRect,uvRect,tint,shape;varying float clipRadius;
void main(){brightness=aBrightness;local=position.xy+.5;bounds=aRect;clipRect=aClip;uvRect=aUV;tint=aTint;shape=aShape;clipRadius=aClipRadius;
vec2 p=(local-.5)*aRect.zw;float c=cos(aShape.z),s=sin(aShape.z);screen=aRect.xy+aRect.zw*.5+mat2(c,s,-s,c)*p;
vec2 world=(screen-projection.xy)/projection.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(world,0.,1.);}`;
const fragment=`varying float brightness;uniform sampler2D map;uniform float imageAspect;varying vec2 local,screen;varying vec4 bounds,clipRect,uvRect,tint,shape;varying float clipRadius;
float box(vec2 p,vec2 size,float radius){radius=min(radius,min(size.x,size.y)*.5);vec2 q=abs(p-size*.5)-size*.5+radius;return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;}
void main(){float edge=max(.65,shape.y);float a=1.-smoothstep(-edge,edge,box(local*bounds.zw,bounds.zw,shape.x));a*=1.-smoothstep(-.65,.65,box(screen-clipRect.xy,clipRect.zw,clipRadius));if(a<.001)discard;
vec2 uv=local;bool blank=false;float ratio=(bounds.z/bounds.w)/imageAspect;
if(shape.w>1.5){if(ratio>1.)uv.x=(uv.x-.5)*ratio+.5;else uv.y=(uv.y-.5)/ratio+.5;blank=any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.)));}
else if(shape.w>.5){if(ratio>1.)uv.y=(uv.y-.5)/ratio+.5;else uv.x=(uv.x-.5)*ratio+.5;}
uv=uvRect.xy+uv*uvRect.zw;vec4 pixel=blank?vec4(.815,.791,.745,1.):texture2D(map,vec2(uv.x,1.-uv.y));gl_FragColor=vec4(pixel.rgb*tint.rgb,pixel.a*tint.a*a);
gl_FragColor.rgb = sRGBTransferEOTF(vec4(sRGBTransferOETF(gl_FragColor).rgb * brightness, 1.)).rgb;
#include <colorspace_fragment>
}`;
function batch(texture){
 const geometry=new THREE.InstancedBufferGeometry();const quad=new THREE.PlaneGeometry(1,1);geometry.index=quad.index.clone();geometry.setAttribute('position',quad.attributes.position.clone());quad.dispose();
 const capacity=128;for(const [name,size]of [['aRect',4],['aClip',4],['aUV',4],['aTint',4],['aShape',4],['aClipRadius',1],['aBrightness',1]])geometry.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(capacity*size),size).setUsage(THREE.DynamicDrawUsage));
 const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,side:THREE.DoubleSide,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{map:{value:texture},imageAspect:{value:1},projection:{value:new THREE.Vector3()}}});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.userData.activityOwned=true;mesh.layers.set(1);return{mesh,texture,capacity};
}
export function createActivityLayer(scene,arena,getSize){
 const group=new THREE.Group();group.userData.activityOwned=true;group.renderOrder=10000;let pools=[],canvas=null;
 const color=new THREE.Color(),lost=()=>invalidateActivityGPU(),restored=()=>invalidateActivityGPU();
 return{
  render(renderer){
   if(canvas!==renderer.domElement){canvas?.removeEventListener('webglcontextlost',lost);canvas?.removeEventListener('webglcontextrestored',restored);canvas=renderer.domElement;canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);}
   const controllers=[...activityControllers()];for(const c of controllers)c.warm(renderer);
   const items=controllers.flatMap(c=>c.items());if(!items.length){group.visible=false;return;}group.visible=true;if(group.parent!==scene)scene.add(group);
   const rect=arena.getBoundingClientRect(),scale=rect.width/getSize().width;let i=0,j=0;
   while(i<items.length){const texture=items[i].texture;let end=i+1;while(end<items.length&&items[end].texture===texture&&end-i<128)end++;
    let pool=pools[j];if(!pool){pool=batch(texture);pools.push(pool);group.add(pool.mesh);}const {mesh}=pool,g=mesh.geometry;mesh.visible=true;mesh.renderOrder=10000+j;mesh.layers.set(1);mesh.material.uniforms.map.value=texture;mesh.material.uniforms.imageAspect.value=texture.image.width/texture.image.height;mesh.material.uniforms.projection.value.set(rect.left,rect.top,scale);
    for(let n=i;n<end;n++){const item=items[n],k=n-i,clip=item.clip??{x:0,y:0,w:innerWidth,h:innerHeight},uv=item.uv??{x:0,y:0,w:1,h:1};color.set(item.color??'#fff');
     g.attributes.aBrightness.setX(k,item.deviceScreen?1+(deviceBrightness(item.deviceScreen)-1)*(item.brightnessMix??1):1);g.attributes.aRect.setXYZW(k,item.x,item.y,item.w,item.h);g.attributes.aClip.setXYZW(k,clip.x,clip.y,clip.w,clip.h);g.attributes.aUV.setXYZW(k,uv.x,uv.y,uv.w,uv.h);g.attributes.aTint.setXYZW(k,color.r,color.g,color.b,item.opacity??1);g.attributes.aShape.setXYZW(k,item.radius??0,item.blur??.65,item.rotation??0,item.fit??0);g.attributes.aClipRadius.setX(k,clip.radius??0);
    }for(const a of Object.values(g.attributes))if(a.isInstancedBufferAttribute)a.needsUpdate=true;g.instanceCount=end-i;i=end;j++;
   }for(let n=j;n<pools.length;n++)pools[n].mesh.visible=false;

  },
  draw(renderer,camera){
   if(renderer.getContext().isContextLost()){invalidateActivityGPU();return;}
   const auto=renderer.autoClear,mask=camera.layers.mask;
   try{renderer.autoClear=false;camera.layers.enableAll();renderer.render(scene,camera);
    for(const c of activityControllers())c.submitted();
   }finally{renderer.autoClear=auto;camera.layers.mask=mask;}
  },
  dispose(){canvas?.removeEventListener('webglcontextlost',lost);canvas?.removeEventListener('webglcontextrestored',restored);group.removeFromParent();for(const p of pools){p.mesh.geometry.dispose();p.mesh.material.dispose();}pools=[];group.clear();},
 };
}
