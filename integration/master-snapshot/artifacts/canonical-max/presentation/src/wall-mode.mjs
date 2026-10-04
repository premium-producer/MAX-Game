import {wallLayout} from './wall-layout.mjs';
export const wallMode=new URLSearchParams(location.search).get('surface')==='right';
export function fitWall(stage){
 if(!wallMode)return false;
 const rect=wallLayout(innerWidth,innerHeight);
 stage.style.setProperty('--stage-scale',String(rect.scale));stage.style.left=rect.left+'px';stage.style.top=rect.top+'px';stage.style.transform='scale(var(--stage-scale))';stage.style.transformOrigin='top left';
 return true;
}
if(wallMode){
 document.documentElement.dataset.surface='right';
 const backdrop=document.createElement('aside');backdrop.className='max-wall-backdrop';backdrop.setAttribute('aria-hidden','true');
 backdrop.innerHTML='<img src="./brand/assets/logos/max-mono-white.svg" alt=""><h1>Возможности<br>рядом</h1><p>Открой возможности MAX</p><div class="max-wall-help">Выбери действие<br>Размести на поле<br>Соедини маршрут</div>';
 document.body.prepend(backdrop);
}
