import {RibbonEngine,FX_DEFAULTS} from '/ribbon/engine.js';
import {MASK_DEFAULTS} from '/ribbon/mask-settings.js';
import {defaultMixer} from '/ribbon/mask-mixer.js';
import {ENTITY_DEFAULTS} from '/ribbon/entity-model.js';
import {clockTime} from '/ribbon/shared-state.js';
import {normalizeContinuous} from '/ribbon/fluid-lab-model.js';
import {surfaceSettings,surfaceComposition} from './surface-visual.js';
import {SurfaceField} from './surface-field.js';
import {rearWallView,rearWallField,surfaceLayout,projectRearTile} from './rear-wall-render.js';
import {GPUAtlas} from './gpu-atlas.js';
// Iteration 2; sphere iteration remains in max-liquid-glass.js unchanged.
import {MaxPanelGlass as MaxLiquidGlass} from './max-panel-glass.js';
import * as THREE from 'three';
import {MAX_WALL_ATMOSPHERE_GLSL,MAX_WALL_COLORS,MAX_WALL_LOOK} from './max-wall-atmosphere.js';

// Continuous screen-space dye/gloss pass before refraction. Broad packet envelopes
// flow through the shared wall coordinates without sampling the coarse cell grid.
class MaxWaveLight {
 constructor(engine){this.engine=engine;this.scene=new THREE.Scene();this.camera=new THREE.Camera();this.uniforms={uTile:{value:new THREE.Vector4()},uMaxEnabled:{value:1},uMaxTime:{value:0},uMaxCrop:{value:new THREE.Vector4(0,0,4096,1280)},uMaxLook:{value:new THREE.Vector4(MAX_WALL_LOOK.strength,MAX_WALL_LOOK.speed,0,0)},uMaxColors:{value:MAX_WALL_COLORS.map(c=>new THREE.Color(c))}};
 this.material=new THREE.ShaderMaterial({uniforms:this.uniforms,transparent:true,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 vUv;uniform vec4 uTile;${MAX_WALL_ATMOSPHERE_GLSL}void main(){vec2 p=uTile.xy+vec2(vUv.x,1.-vUv.y)*uTile.zw;vec2 q=p/vec2(4096.,1280.);vec3 c=maxSilk(q,uMaxTime*uMaxLook.y)*uMaxLook.x;float peak=max(c.r,max(c.g,c.b));c/=1.+peak*.30;gl_FragColor=vec4(c*maxFlowEdge(q),1.);}`});
 this.geometry=new THREE.PlaneGeometry(2,2);this.scene.add(new THREE.Mesh(this.geometry,this.material));this.motion=matchMedia('(prefers-reduced-motion: reduce)');}
 draw(tile,width,time){const r=this.engine.renderer,target=this.engine.programTarget;this.uniforms.uTile.value.set(...tile.renderRect.map(v=>v*4096/width));this.uniforms.uMaxTime.value=this.motion.matches?0:time;const clear=r.autoClear;r.autoClear=false;r.setRenderTarget(target);r.setScissorTest(false);r.setViewport(0,0,target.width,target.height);r.render(this.scene,this.camera);r.autoClear=clear;}
 dispose(){this.geometry.dispose();this.material.dispose();}
}

// Same rear-wall coordinate system, field, palette and optical passes as the left wall.
// This renders the existing background; MAX supplies a transparent interactive foreground.
export class MaxSharedBackground {
 constructor(canvas){this.engine=new RibbonEngine(canvas,{continuous:true,editorPreview:false,contentMode:'none'});this.mixer=defaultMixer();this.frames=[];this.offset=0;}
 sync(state){this.state=state;if(Number.isFinite(state.serverTime))this.offset=state.serverTime-Date.now();
  const {width,height}=state.renderProfile;this.view=rearWallView(state.id,width,height);this.layout=surfaceLayout(state.id,width,height);const field=rearWallField(state.pixelMap);this.fieldSpec=field;
  this.settings=surfaceSettings(normalizeContinuous(state.visual.settings),this.view.width,this.view.height,field.metrics);const s=this.settings,e=this.engine;
  e.setHighlights(s.highlights);e.setCellDepth(s.cellDepth);e.setNeon(s.neon);e.setLighting(s.lighting);e.setUnderlay(s.underlay);e.setComposition({...surfaceComposition(s,'max-wall',null,state.id),particles:0,particleOpacity:0});
  if(e.width!==this.view.width||e.height!==this.view.height||e.surface!==s.surface)e.resize(s.surface,[this.view.width,this.view.height],this.layout);
  // MAX keeps the continuous underlay/light field, without pixel geometry.
  if(e.cellGrid)e.cellGrid.mesh.visible=false;
  if(e.composition)e.composition.pixels.mesh.visible=false;
  if(e.composition)e.composition.transport={total:field.metrics.columns,columns:field.metrics.columns,offset:0,time:0};
  this.field?.setMap(state.pixelMap,field.region,field.metrics);this.field?.configure(state.background,s.underlay,state.backgroundTransition);
 }
 async load(program){await this.engine.load();this.field=new SurfaceField(this.engine,this.state.pixelMap,this.fieldSpec.region);this.field.setMaxAtmosphere(false);this.sync(this.state);for(const frame of this.frames)this.field.receive(frame);this.frames=[];await this.engine.prepare();this.atlas=new GPUAtlas(this.engine,program.plan,program.epoch);this.waves=new MaxWaveLight(this.engine);await this.engine.renderer.compileAsync(this.waves.scene,this.waves.camera);this.glass=new MaxLiquidGlass(this.engine,this.atlas.tile);await this.glass.prepare();}
 receive(frame){if(this.field)this.field.receive(frame);else{this.frames.push(frame);if(this.frames.length>2)this.frames.shift();}}
 receiveWalk(frame){this.field?.depth.receiveWalk(frame);}
 async draw(frame){const {engine:e,settings:s,state,atlas}=this,now=Date.now()+this.offset,t=clockTime(state.clock,now);
  this.field.setMaxAtmosphere(false,t);this.field.now=now;this.field.depth.draw(Date.now());e.fu.uBlueFlow.value.set(s.blue.saturation,s.blue.fluidSaturation,s.blue.opacity,s.blue.backgroundOpacity);if(e.composition){e.composition.transport.time=clockTime(state.transportClock??state.clock,now);e.composition.playing=state.clock.playing;}
  atlas.begin();for(let i=0;i<this.layout.tiles.length;i++){const tile=this.layout.tiles[i];this.glass.beginTile(tile,state.renderProfile.width,state.settings?.layoutMode);e.render(t,'science',s.energy,s.noise,t*s.noise.speed,{...FX_DEFAULTS,quality:1},t,s.flow,0,null,1,MASK_DEFAULTS,t,this.mixer,ENTITY_DEFAULTS,t,s.vortex,t,s.fluid,{tile:projectRearTile(tile,this.view),first:i===0});this.waves.draw(tile,state.renderProfile.width,t);this.glass.draw(tile,state.renderProfile.width,state.settings?.layoutMode,t,this.menuZones);atlas.copy(tile);}atlas.commit(frame);await atlas.complete();
 }
 dispose(){this.waves?.dispose();this.glass?.dispose();this.atlas?.dispose();this.field?.dispose();this.engine.dispose();}
}
