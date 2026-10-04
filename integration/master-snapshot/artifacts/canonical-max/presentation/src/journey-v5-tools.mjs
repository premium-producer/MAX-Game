import {createGradientController} from './bfm-gradient-controller.mjs';
import {pixelMapMarkup} from './bfm-pixel-map.mjs';
import {bfmViewportPlacement} from './bfm-play-area.mjs';

// Persistent page chrome: outside the renderer's rebuilt #circles subtree.
// Reuse v4's physical map, CSS viewport projection and native WAAPI controller.
export function createV5Tools({arena,params,onViewport}){
 const panel=document.createElement('aside');panel.id='v5-tools';
 panel.innerHTML=`<label id="viewport-control">Вид <select id="viewport-layout" aria-label="Область просмотра"><option value="wall">Вся стена</option><option value="lidar">Зона LiDAR</option></select></label>
 <label id="pixel-map-control"><input id="pixel-map-toggle" type="checkbox" checked> Пиксельная карта и зоны</label>
 <details id="v5-debug"><summary>Отладка MAX</summary><output id="v5-debug-status">Подготовка игры</output></details>
 <details id="gradient-controls"><summary>Градиент кнопок</summary>
 <label for="gradient-speed">Скорость <output id="gradient-speed-value"></output></label><input id="gradient-speed" type="range" min="5" max="90" value="30" step="1">
 <label for="gradient-spread">Разброс скорости <output id="gradient-spread-value"></output></label><input id="gradient-spread" type="range" min="0" max="35" value="15" step="1">
 <label for="gradient-phase">Разброс фаз <output id="gradient-phase-value"></output></label><input id="gradient-phase" type="range" min="0" max="360" value="360" step="1">
 <label class="gradient-pause"><input id="gradient-pause" type="checkbox"> Пауза</label></details>`;
 const overlay=document.createElement('div');overlay.id='pixel-map-overlay';overlay.innerHTML=pixelMapMarkup();arena.append(overlay);document.body.append(panel);
 const $=s=>panel.querySelector(s),gradients=createGradientController(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 $('#viewport-layout').value=params.get('layout')==='lidar'?'lidar':'wall';
 $('#viewport-layout').addEventListener('change',()=>{
  const layout=$('#viewport-layout').value;params.set('layout',layout);
  const url=new URL(location.href);url.searchParams.set('layout',layout);history.replaceState(null,'',url);onViewport();
 });
 $('#pixel-map-toggle').addEventListener('change',()=>{overlay.hidden=!$('#pixel-map-toggle').checked;});
 const configure=()=>{
  const speed=Number($('#gradient-speed').value),spread=Number($('#gradient-spread').value),phaseSpread=Number($('#gradient-phase').value);
  $('#gradient-speed-value').value=`${speed}°/с`;$('#gradient-spread-value').value=`±${spread}%`;$('#gradient-phase-value').value=`${phaseSpread}°`;
  gradients.configure({speed,spread:spread/100,phaseSpread,paused:document.hidden||reduced.matches||$('#gradient-pause').checked});
 };
 $('#gradient-controls').addEventListener('input',configure);document.addEventListener('visibilitychange',configure);reduced.addEventListener('change',configure);configure();
 let lastStatus='';
 return {
  gradients,
  fit(width,height){
   const layout=$('#viewport-layout').value,p=bfmViewportPlacement(width,height,layout);
   Object.assign(arena.style,{left:'0px',top:'0px',transformOrigin:'0 0',transform:`translate(${p.x}px,${p.y}px) scale(${p.scale})`});
   const ambient=document.querySelector('#ambient');if(ambient)Object.assign(ambient.style,{left:`${p.x}px`,top:`${p.y}px`,width:`${p.backgroundWidth}px`,height:`${p.backgroundHeight}px`,transform:'none'});
  },
  update({phase,revision,task,backend}){
   const text=`Фаза: ${phase??'загрузка'}\nЗадание: ${task??'—'}\nRevision: ${revision??'—'}\nBackend: ${backend}\nРесурсы: ${document.documentElement.dataset.assetPreparation??'подготовка'}\nФон: ${document.documentElement.dataset.backgroundReady??'подключение'}`;
   if(text!==lastStatus){$('#v5-debug-status').textContent=text;lastStatus=text;}
  },
  dispose(){gradients.dispose();document.removeEventListener('visibilitychange',configure);reduced.removeEventListener('change',configure);panel.remove();overlay.remove();}
 };
}
