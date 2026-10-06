import * as THREE from 'three';
import {ROUTE_INTRO} from './journey-motion.mjs';

// A small precompiled pool lets released scan jets finish while a new touch
// emits another burst. No additional solver, renderer or per-frame geometry.
export class JourneyIntroBurst {
 constructor(){
  this.geometry=new THREE.PlaneGeometry(1,1);
  this.slots=Array.from({length:6},()=>{
   const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,
    uniforms:{age:{value:0},extent:{value:1},centre:{value:new THREE.Vector2()},bounds:{value:new THREE.Vector4()},alpha:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float age,extent,alpha;uniform vec2 centre;uniform vec4 bounds;
void main(){
 vec2 p=(vUv-.5)*12.;float r=length(p);float a=atan(p.y,p.x);
 float head=1.+4.7*(1.-exp(-age*3.6));float wake=head-r;
 float envelope=smoothstep(0.,.028,age)*(1.-smoothstep(.32,.9,age));
 float tail=smoothstep(-.18,.3,wake)*(1.-smoothstep(.5,2.7,wake));
 float jets=0.;float haze=0.;
 for(int i=0;i<12;i++){
  float n=float(i),bend=.075*sin(r*2.4-age*5.+n*1.7)*smoothstep(1.,3.,r);
  float ray=n*6.2831853/12.+.12*sin(n*2.7)+bend;
  float d=abs(atan(sin(a-ray),cos(a-ray)))*max(r,1.);
  float width=.035+.045*smoothstep(1.,5.,r);
  jets+=exp(-pow(d/width,2.))*(.65+.35*sin(r*6.-age*13.+n));haze+=exp(-pow(d/(width*3.8),2.));
 }
 float density=(jets*.8+haze*.16)*tail*envelope*smoothstep(.85,1.1,r);
 vec2 point=centre+(vUv-.5)*extent;
 vec2 inset=min(point-bounds.xy,bounds.zw-point);
 float clip=smoothstep(0.,8.,min(inset.x,inset.y));
 vec3 c=mix(vec3(.431,.102,1.),vec3(0.,.749,1.),clamp(jets,0.,1.));
 c=mix(c,vec3(1.),clamp(jets*.16,0.,.22));
 gl_FragColor=vec4(c,min(.85,density)*clip*alpha);
}`});
   const mesh=new THREE.Mesh(this.geometry,material);mesh.frustumCulled=false;mesh.visible=false;mesh.renderOrder=-1;
   return {mesh,host:null,elapsed:0};
  });
 }
 async prepareGPU(renderer,camera){
  const scene=new THREE.Scene();for(const slot of this.slots){slot.mesh.visible=true;scene.add(slot.mesh);}
  await renderer.compileAsync(scene,camera);for(const slot of this.slots){slot.mesh.visible=false;slot.mesh.removeFromParent();}
 }
 start(host,point,size,reduced){
  if(reduced)return;
  const slot=this.slots.find(s=>!s.host)||this.slots.find(s=>s.host===host&&s.kind==='intro');if(!slot)return;
  Object.assign(slot,{host,point:{...point},size,elapsed:0,kind:'intro'});slot.mesh.material.userData.el=host;
 }
 startScan(host,point,size,reduced){
  if(reduced)return;
  // Never rewind a previously emitted jet: its age and outward motion belong
  // to the old contact even after pointerup, cancel, or an immediate retouch.
  const slot=this.slots.find(s=>!s.host);if(!slot)return;
  Object.assign(slot,{host,point:{...point},size,elapsed:0,kind:'scan'});slot.mesh.material.userData.el=host;
 }
 attach(scene){for(const slot of this.slots)scene.add(slot.mesh);}
 step(dt,rect,reduced){
  for(const slot of this.slots){
   if(!slot.host)continue;
   slot.elapsed+=dt;
   const alive=slot.kind==='scan'||!!slot.host.querySelector('[data-object="open-max"]');
   if(reduced||!slot.host.isConnected||!alive||slot.elapsed>=ROUTE_INTRO.burstDuration){slot.host=null;slot.mesh.visible=false;continue;}
   const h=rect(slot.host),x=h.x+slot.host.clientLeft+slot.point.x,y=h.y+slot.host.clientTop+slot.point.y;
   const extent=slot.size*6,u=slot.mesh.material.uniforms;
   slot.mesh.position.set(x,y,0);slot.mesh.scale.set(extent,extent,1);slot.mesh.visible=true;
   u.age.value=slot.elapsed;u.extent.value=extent;u.centre.value.set(x,y);u.bounds.value.set(h.x,h.y,h.x+h.w,h.y+h.h);u.alpha.value=Number(slot.host.dataset.uiPresence??1);
  }
 }
 clear(){for(const slot of this.slots){slot.host=null;slot.mesh.visible=false;}}
 dispose(){this.clear();for(const slot of this.slots){slot.mesh.removeFromParent();slot.mesh.material.dispose();}this.geometry.dispose();}
}
