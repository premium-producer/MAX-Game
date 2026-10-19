import * as THREE from 'three';
import {SharedFluid} from '../../service/shared-fluid.mjs';
import {PixelTags} from '../../ribbon/pixel-tags.js';
import {MAX_FIELD_PALETTE,MAX_FIELD_GRADIENT_GLSL} from '../../service/public/max-wall-atmosphere.js';

// Standalone has no authoritative wall feed: reuse its solver at a bounded size.
// The wall itself keeps SurfaceField and the original instanced VK cell geometry.
export class JourneyBackgroundField {
 constructor(){
  this.fluid=new SharedFluid(128,48);this.accumulator=0;
  this.bytes=new Uint8Array(128*48);
  this.texture=new THREE.DataTexture(this.bytes,128,48,THREE.RedFormat);
  this.texture.minFilter=this.texture.magFilter=THREE.LinearFilter;
  this.settings={iterations:8,emitForce:1.1,emitLight:1.2,emitSpread:.85,curl:24,dyeDecay:.48};
  // A deterministic initial dye field avoids an empty cold-start without a warm-up loop.
  for(let i=0;i<7;i++)this.fluid.splat(.1+i*.125,.5+.23*Math.sin(i*2.31),2,0,.13,1.1);
  this.upload();
  this.pixels=new PixelTags({seed:42,roundness:.22});
  const m=this.pixels.mesh.material;m.uniforms.uBlue.value.set(MAX_FIELD_PALETTE.blue);m.uniforms.uRed.value.set(MAX_FIELD_PALETTE.violet);
  // This scene is composited into the linear background RT, before glass/output encoding.
  m.fragmentShader=m.fragmentShader.replace('#include <colorspace_fragment>','');
  this.scene=new THREE.Scene();this.scene.add(this.pixels.mesh);this.camera=new THREE.Camera();
  this.particleSettings={particles:64,particleOpacity:.75,particleLarge:.12,particleSpeed:.42,particleDynamics:.8,speed:1};
 }
 upload(){for(let i=0;i<this.bytes.length;i++)this.bytes[i]=Math.round(Math.min(1,this.fluid.dye[i]/4)*255);this.texture.needsUpdate=true;}
 update(dt,time,width,height){
  this.accumulator=Math.min(2/30,this.accumulator+dt);let advanced=false;
  while(this.accumulator>=1/30){this.fluid.step(1/30,this.settings);this.accumulator-=1/30;advanced=true;}
  if(advanced)this.upload();
  this.pixels.update(time,this.particleSettings,width,height,136*height/width,.28);
 }
 draw(renderer){const clear=renderer.autoClear;renderer.autoClear=false;renderer.render(this.scene,this.camera);renderer.autoClear=clear;}
 dispose(){this.texture.dispose();this.pixels.dispose();}
}

export const MAX_FIELD_FRAGMENT=`
varying vec2 vUv;
uniform sampler2D uDensity;
uniform vec2 uSize;
uniform float uMaxTime;
uniform vec3 uMaxColors[6];
${MAX_FIELD_GRADIENT_GLSL}
float dye(vec2 p){return texture2D(uDensity,clamp(p,vec2(0.),vec2(1.))).r*4.;}
void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y);
 float edge=smoothstep(0.,.18,p.x)*(1.-smoothstep(.82,1.,p.x));
 vec3 base=maxFieldGradient(p,uMaxTime);
 vec2 cells=vec2(136.,136.*uSize.y/uSize.x),cell=(floor(p*cells)+.5)/cells;
 float density=dye(cell),presence=smoothstep(.025,.85,density);
 vec2 box=abs(fract(p*cells)-.5)-vec2(.34);
 float distance=length(max(box,0.))+min(max(box.x,box.y),0.)-.065;
 float core=1.-smoothstep(-fwidth(distance),fwidth(distance),distance);
 vec3 light=mix(uMaxColors[0],uMaxColors[4],smoothstep(.38,.76,p.x));
 float spill=(dye(p+vec2(.015,0.))+dye(p-vec2(.015,0.))+dye(p+vec2(0.,.035))+dye(p-vec2(0.,.035)))*.25;
 vec3 c=base+light*(presence*core*.25+spill*.025)*edge;
 float peak=max(c.r,max(c.g,c.b));c/=1.+peak*.18;
 gl_FragColor=vec4(c,1.);
}`;
