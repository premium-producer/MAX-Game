import * as THREE from 'three';
import {MAX_WALL_COLORS} from '../../service/public/max-wall-atmosphere.js';
import {JourneyBackgroundField,MAX_FIELD_FRAGMENT} from './journey-background-field.mjs';
import {PANEL_GLASS_FRAGMENT} from '../../service/public/max-panel-glass.js';
import {readGlassControls,PANEL_GLASS_REFERENCE as PANEL,BUTTON_GLASS_REFERENCE as BUTTON,BUTTON_FROST_RADIUS,BUTTON_GLASS_CALIBRATION,MAX_GLASS_CONTROLS,backdropBlurLod} from '../../service/public/max-panel-optics.js';
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
// Separate linear background texture; sharp DOM text/icons never enter the lens.
export function background(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(1);const scene=new THREE.Scene(),camera=new THREE.Camera();
 const field=new JourneyBackgroundField();
 const uniforms={uDensity:{value:field.texture},uSize:{value:new THREE.Vector2(1,1)},uMaxTime:{value:0},uMaxColors:{value:MAX_WALL_COLORS.map(c=>new THREE.Color(c))}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:vertex,fragmentShader:MAX_FIELD_FRAGMENT});
 const geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));
 const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true});
 const glassUniforms={uBackground:{value:target.texture},uTile:{value:new THREE.Vector4()},uPanels:{value:[new THREE.Vector4(),new THREE.Vector4()]},uPanelCount:{value:1},uIor:{value:1.46},uTime:{value:0},uPanelShift:{value:56},uDepth:{value:PANEL.depth},uLightAngle:{value:PANEL.lightAngleDegrees*Math.PI/180},uLightIntensity:{value:PANEL.lightIntensity},uMenu:{value:new THREE.Vector2(1,1)},uViolet:{value:new THREE.Color('#6E1AFF')},uPurple:{value:new THREE.Color('#9500FF')},uPaneRadius:{value:56},uPaneBezel:{value:48},uControls:{value:Array.from({length:MAX_GLASS_CONTROLS},()=>new THREE.Vector4())},uControlStyle:{value:Array.from({length:MAX_GLASS_CONTROLS},()=>new THREE.Vector3())},uControlCount:{value:0},uButtonLod:{value:3},uButtonBlur:{value:BUTTON_FROST_RADIUS},uButtonDepth:{value:BUTTON.depth},uButtonLight:{value:BUTTON.lightIntensity},uButtonAngle:{value:BUTTON.lightAngleDegrees*Math.PI/180}};
 const fragment=PANEL_GLASS_FRAGMENT.replace('gl_FragColor=vec4(mix(original,base,edge),1.);return;','gl_FragColor=vec4(mix(original,base,edge),1.);\n#include <colorspace_fragment>\nreturn;').replace(/}\s*$/,'\n#include <colorspace_fragment>\n}');
 const glass=new THREE.ShaderMaterial({uniforms:glassUniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});
 const glassScene=new THREE.Scene();glassScene.add(new THREE.Mesh(geometry,glass));
 let raf=0,time=0,last=performance.now(),lastScanPulse=-Infinity,paused=false,stamp='';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function sync(){
  const next=document.documentElement.dataset.glassRevision+':'+innerWidth+':'+innerHeight;if(next===stamp)return;stamp=next;
  const arena=document.querySelector('#arena'),frame=arena.getBoundingClientRect(),scale=4096/innerWidth,unit=frame.width/parseFloat(arena.style.width)*scale;
  const zones=[...document.querySelectorAll('.journey-zone')];glassUniforms.uPanelCount.value=zones.length;
  zones.forEach((el,i)=>{const r=el.getBoundingClientRect();glassUniforms.uPanels.value[i].set(r.left*scale,r.top*scale,r.width*scale,r.height*scale);});
  const radius=parseFloat(getComputedStyle(zones[0]).borderTopLeftRadius)*unit;
  glassUniforms.uPaneRadius.value=radius;glassUniforms.uPaneBezel.value=radius*48/56;
  glassUniforms.uDepth.value=PANEL.depth*unit;glassUniforms.uPanelShift.value=56*unit;
  glassUniforms.uButtonDepth.value=BUTTON.depth*unit;glassUniforms.uButtonBlur.value=BUTTON_FROST_RADIUS*unit;
  const controls=readGlassControls(document,{viewport:true});glassUniforms.uControlCount.value=controls.length;
  controls.forEach((c,i)=>{glassUniforms.uControls.value[i].set(...c.rect);glassUniforms.uControlStyle.value[i].set(c.radius,c.opacity,c.blurScale??1);});
  glassUniforms.uTile.value.set(0,0,4096,innerHeight*scale);
 }
 function draw(now){
  raf=requestAnimationFrame(draw);const dt=Math.min(.1,(now-last)/1000);last=now;if(paused||document.hidden)return;if(!reduced.matches)time+=dt;
  uniforms.uMaxTime.value=time;glassUniforms.uTime.value=time;
  const w=Math.round(Math.min(1600,innerWidth,Math.sqrt(2560000*innerWidth/innerHeight))),h=Math.round(w*innerHeight/innerWidth);
  if(canvas.width!==w||canvas.height!==h){renderer.setSize(w,h,false);target.setSize(w,h);}
  uniforms.uSize.value.set(w,h);field.update(reduced.matches?0:dt,time,w,h);
  sync();glassUniforms.uButtonLod.value=backdropBlurLod(glassUniforms.uButtonBlur.value,w/4096);renderer.setRenderTarget(target);renderer.render(scene,camera);field.draw(renderer);renderer.setRenderTarget(null);renderer.render(glassScene,camera);
  document.documentElement.dataset.opticalGlass='true';
 }
 raf=requestAnimationFrame(draw);
 return {
  pause(v){paused=v;},
  scanPulse(x,y,progress){
   if(paused||reduced.matches||time-lastScanPulse<.075)return;
   lastScanPulse=time;
   const phase=Math.max(0,Math.min(1,progress))*Math.PI*2;
   for(let i=0;i<5;i++){
    const a=phase+i*Math.PI*2/5,dx=Math.cos(a),dy=Math.sin(a);
    field.fluid.splat(Math.max(.03,Math.min(.97,x+dx*.075)),Math.max(.05,Math.min(.95,y+dy*.10)),dx*2.8,dy*2.8,.065,.9);
   }
  },
  dispose(){cancelAnimationFrame(raf);delete document.documentElement.dataset.opticalGlass;field.dispose();target.dispose();geometry.dispose();material.dispose();glass.dispose();renderer.dispose();}
 };
}
