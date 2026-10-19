import {Controller} from '../../ribbon/vendor/lumicells/src/core/controller/controller.ts';
import {Engine} from '../../ribbon/vendor/lumicells/src/core/engine/engine.ts';
import {FIELD_GLSL,COMPOSITE_GLSL,REFERENCE_CONFIG,referenceMetrics,referenceMotionDelta} from './journey-lumi-reference-profile.mjs';

// The game foreground owns the frame loop. Cells and gradients share LumiCells'
// bounded clock; no second RAF, catch-up after hidden, or per-frame asset work.
export function lumiReferenceBackground(canvas){
  canvas.style.background='#0D001A';
  const query=new URLSearchParams(location.search);
  // User explicitly requested animated scenery. The game's reduced-motion
  // transitions stay independent; opt back into system scenery policy with auto.
  const followSystemMotion=query.get('background-motion')==='auto';
  const diagnostic=query.has('background-debug')?document.createElement('output'):null;
  if(diagnostic){
    diagnostic.style.cssText='position:fixed;left:12px;bottom:12px;z-index:99999;padding:8px 12px;border-radius:8px;background:#080012;color:white;font:14px monospace;pointer-events:none;white-space:pre-line';
    document.body.append(diagnostic);
  }
  let frames=0,lastDiagnostic=-Infinity;
  const report=(state,seconds=0,force=false)=>{
    if(diagnostic&&(force||performance.now()-lastDiagnostic>250)){
      diagnostic.textContent=`MAX · LumiCells ×4 · pixels-03\n${state} · кадр ${frames} · ${seconds.toFixed(2)} с`;
      lastDiagnostic=performance.now();
    }
  };
  report('Подготовка',0,true);
  const controller=new Controller({config:REFERENCE_CONFIG,random:()=>.5});
  controller.nativeResolution=true;
  controller.nativeGridFractionalPitch=false;
  const engine=new Engine(canvas,{opaque:true,paramsPrelude:controller.layout.glslPrelude,
    paramsVec4Count:controller.layout.vec4Count,sceneProfile:{field:FIELD_GLSL,composite:COMPOSITE_GLSL}});
  let disposed=false,paused=false,failed=false,started=performance.now(),dirty=true,ready=false;
  const render=(delta=0,{active=true,reduced=false}={})=>{
    if(disposed||failed||paused||!active||document.hidden){started=performance.now();return;}
    const dt=referenceMotionDelta(delta,true,followSystemMotion&&reduced);
    if(ready&&!dirty&&dt===0){report(followSystemMotion&&reduced?'Системная пауза':'Нет delta',controller.clock.seconds);return;}
    try{
      const frame=controller.update(ready?dt:0);
      if(engine.render(frame)){
        controller.commitFrame();dirty=false;ready=true;
        frames++;report('Анимация',controller.clock.seconds);
        document.documentElement.dataset.backgroundReady='true';
      }else{
        if(engine.error)throw engine.error;
        if(performance.now()-started>15000)throw Error('LumiCells shader warmup timeout');
      }
    }catch(error){failed=true;document.documentElement.dataset.backgroundReady='false';report(`Ошибка: ${error.message}`,controller.clock.seconds,true);console.error('MAX LumiCells:',error);}
  };
  const resize=()=>{
    const m=referenceMetrics(innerWidth,innerHeight,devicePixelRatio);
    controller.nativeGridPitch=Math.max(1,Math.round(m.pitch));
    // Native engine domain is already in physical pixels; do not apply DPR twice.
    controller.setViewport({hostCssW:m.width,hostCssH:m.height,dpr:1,deviceW:m.width,deviceH:m.height});
    dirty=true;started=performance.now();
  };
  const visibility=()=>{started=performance.now();};
  addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
  resize();render();
  return {tick:render,pause(value){paused=!!value;started=performance.now();},scanPulse(){},
    dispose(){disposed=true;diagnostic?.remove();removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);engine.dispose();controller.destroy();delete document.documentElement.dataset.backgroundReady;}};
}
