// Correct only the menu glyphs in the pinned exported screen. Keep the original
// raster, labels, profile avatar and interaction coordinates unchanged.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const catalog=JSON.parse(fs.readFileSync(path.join(source,'client/src/reviewed-content/mission-catalog.json')));
const original=catalog.assets['figma.296-17579'];
const bytes=fs.readFileSync(path.join(source,'../www',original.path));
const sha=b=>createHash('sha256').update(b).digest('hex');
if(sha(bytes)!==original.sha256)throw Error('Business channel source differs from pinned export');
const icons=[
 ['home',156,'#f5f6f7','<g fill="url(#home)" stroke="none"><rect x="3" y="3" width="7" height="18" rx="3"/><rect x="12" y="3" width="9" height="8" rx="3"/><rect x="12" y="13" width="9" height="8" rx="3"/></g>'],
 ['bot',222,'#fff','<rect x="3" y="6" width="18" height="15" rx="5"/><path d="M12 6V3M8 11v2m8-2v2m-7 4q3 2 6 0"/><circle cx="12" cy="2.5" r="1" fill="#303334" stroke="none"/>'],
 ['channel',288,'#f5f6f7','<path d="M15 6 20 3q1-.5 1 1v13q0 1-1 1l-5-3H7q-4 0-4-4t4-4h8Zm0 0v9M7 15l2 6h3l-1-6"/>'],
 ['id',354,'#fff','<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8v8m4-8h2q4 0 4 4t-4 4h-2Z"/>'],
 ['employees',861,'#fff','<circle cx="9" cy="7" r="3"/><path d="M3 21v-3q0-5 6-5t6 5v3m1-17a3 3 0 0 1 0 6m2 3q4 1 4 5v3"/>'],
 ['documentation',928,'#fff','<path d="M14 3H7q-3 0-3 3v12q0 3 3 3h10q3 0 3-3V9Zm0 0v4q0 2 2 2h4M8 13h8m-8 4h6"/>'],
];
const patches=icons.map(([id,y,bg,body])=>`<g id="menu-${id}"><rect x="48" y="${y-24}" width="51" height="48" fill="${bg}"/><g transform="translate(59 ${y-14}) scale(1.166666667)" fill="none" stroke="#303334" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g></g>`).join('\n');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${original.width}" height="${original.height}" viewBox="0 0 ${original.width} ${original.height}">
<title>Создание канала MAX для бизнеса</title>
<defs><linearGradient id="home" x2="1" y2="1"><stop stop-color="#00c5ff"/><stop offset=".5" stop-color="#4268ff"/><stop offset="1" stop-color="#9500ff"/></linearGradient></defs>
<image width="${original.width}" height="${original.height}" xlink:href="data:image/png;base64,${bytes.toString('base64')}"/>
${patches}
</svg>\n`;
const assetPath='assets/kdw-native/business-channel-menu.svg';
fs.writeFileSync(path.join(source,'client/public',assetPath),svg);
const asset={assetId:'kdw.native.business-channel-menu',path:assetPath,width:original.width,height:original.height,mimeType:'image/svg+xml',sha256:sha(svg),origin:{kind:'local-vector-menu-correction',sourceAssetId:original.assetId,sourceSha256:original.sha256}};
fs.writeFileSync(path.join(source,'client/src/kdw-business-screen-assets.json'),JSON.stringify(asset,null,2)+'\n');
console.log(JSON.stringify({asset:assetPath,sha256:asset.sha256,icons:icons.map(([id])=>id)}));
