import {WALL,SCREEN_METRES} from './circle-model.mjs';
import {BFM_PLAY_AREA,bfmStagePlacement} from './bfm-play-area.mjs';

// Diagnostic SVG only: existing model coordinates, not a LiDAR calibration.
export function pixelMapMarkup(){
 const {top,bottom,left:flat}=BFM_PLAY_AREA,{x:cx,y:cy}=bfmStagePlacement();
 const ticks=[];
 for(let x=512;x<4096;x+=512)ticks.push(`<text x="${x}" y="62" text-anchor="middle">${x} / ${x+3072}</text>`);
 for(let y=256;y<1280;y+=256)ticks.push(`<text x="20" y="${y-12}">Y ${y}</text>`);
 return `<svg viewBox="0 0 ${WALL.width} ${WALL.height}" role="img" aria-label="Пиксельная карта MAX и проектные зоны стены">
 <defs><pattern id="bfm-pixel-grid" width="256" height="256" patternUnits="userSpaceOnUse"><path d="M256 0H0V256" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="2"/></pattern></defs>
 <rect width="4096" height="1280" fill="url(#bfm-pixel-grid)"/>
 <rect x="3" y="3" width="4090" height="1274" fill="none" stroke="#ffffff" stroke-width="6"/>
 <g class="map-copy">${ticks.join('')}
 <text x="20" y="30">(0, 0) MAX · общая X=3072</text>
 <text x="4074" y="30" text-anchor="end">Конец стены · (4096, 0) / X=7168</text>
 <text x="20" y="1256">(0, 1280) / X=3072</text>
 <text x="4074" y="1256" text-anchor="end">(4096, 1280) / X=7168</text>
 <text x="1040" y="114">X локальная / общая · сетка кабинетов 256×256 px</text>
 </g>
 <rect x="${flat}" y="${top}" width="${4096-flat}" height="${bottom-top}" fill="none" stroke="#ffbd48" stroke-width="9" stroke-dasharray="18 12"/>
 <rect x="${flat}" y="${top}" width="${4096-flat}" height="${bottom-top}" fill="#32edba12" stroke="#32edba" stroke-width="5"/>
 <g class="map-copy map-comfort"><text x="${flat+28}" y="${top-16}">Зона LiDAR / игры · заданная граница · верх 1,8 м</text>
 <text x="${flat+28}" y="${bottom+40}">Низ: 1 метр от пола · Y≈${Math.round(bottom)}</text></g>
 <path d="M${cx-32} ${cy}H${cx+32}M${cx} ${cy-32}V${cy+32}" stroke="#75ffd5" stroke-width="3" opacity=".6"/>
 <text class="map-copy map-comfort" x="${cx}" y="${bottom+80}" text-anchor="middle">Центр игры: ${cx.toFixed(0)}, ${cy.toFixed(0)} px · 1,4 м от пола</text>
 <g transform="translate(65 800)">
 <rect x="-20" y="-62" width="1790" height="368" rx="20" fill="#100823ee"/>
 <text class="map-copy" y="-20">Вся задняя стена · 7168×1280 · 28×5 кабинетов</text>
 <svg y="12" width="1720" height="244" viewBox="0 0 7168 1280" preserveAspectRatio="none">
 <rect width="3072" height="1280" fill="#32538a"/><rect x="3072" width="4096" height="1280" fill="#562992"/>
 <rect x="${3072+flat}" y="${top}" width="${4096-flat}" height="${bottom-top}" fill="#ffbd481a" stroke="#ffbd48" stroke-width="16"/>
 <rect x="${3072+flat}" y="${top}" width="${4096-flat}" height="${bottom-top}" fill="#32edba66"/>
 <path d="M3072 0V1280" stroke="white" stroke-width="16"/>
 </svg>
 <g class="map-copy"><text y="285">Начало X=0</text><text x="737" y="285" text-anchor="middle">Стык X=3072</text><text x="1720" y="285" text-anchor="end">Конец X=7168</text>
 <text x="320" y="140">VK Видео</text><text x="1100" y="140">MAX — текущий экран</text></g>
 </g>
 <g class="map-copy"><text x="65" y="1160">Высота LED по модели: ${SCREEN_METRES.bottom.toFixed(2)}…${SCREEN_METRES.top.toFixed(2)} м от пола</text>
 <text x="65" y="1200">Метры — по 3D-модели. Граница LiDAR задана пользователем, аппаратный датчик не калибровался.</text></g>
 </svg>`;
}
