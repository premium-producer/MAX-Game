import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const kit=path.join(root,'artifacts/DESIGN/BRANDS/MAX/site-kit-20261001');
const target=path.join(root,'artifacts/max-game/public/site-game');
// Retain the original site's contour layers and perimeter keyframes; scope them to this page.
const original=await fs.readFile(path.join(kit,'references/brandbook/styles/page.css'),'utf8');
const authorsButtons=await fs.readFile(path.join(kit,'references/authors/styles/14.BtByvkVB.css'),'utf8');
const rules=[...original.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selector])=>selector.includes('.animated-card__glow')||selector.includes('.animated-card--glow')).map(([rule])=>rule);
const animationStart=original.indexOf('@keyframes svelte-9yl9sx-animated-card-glow-orbit');
if(animationStart<0)throw Error('Official contour animation missing');
let cursor=original.indexOf('{',animationStart),depth=1;
while(depth&&++cursor<original.length){if(original[cursor]==='{')depth++;else if(original[cursor]==='}')depth--;}
if(depth)throw Error('Unbalanced original keyframes');
const effect=[...rules,original.slice(animationStart,cursor+1)].join('\n').replaceAll('animated-card','site-glow').replaceAll('svelte-9yl9sx-','').replaceAll('.svelte-9yl9sx','').replaceAll(':where()','');
await fs.mkdir(target,{recursive:true});
await fs.writeFile(path.join(target,'site-effects.css'),'/* Scoped from official brandbook page.css; local overrides live in style.css. */\n'+effect+'\n');
const {assets}=JSON.parse(await fs.readFile(path.join(kit,'asset-index.json'),'utf8'));
const requested={logo:'max-white.svg',channel:'channel.webp',comments:'tool-comments.webp',statistics:'tool-stat.webp',id:'digitalId-page-main.png',poster:'create-public-channel-poster.png',video:'create-public-channel.mp4',phone:'phone-body-2.png'};
const selected=Object.fromEntries(Object.entries(requested).map(([key,name])=>{
 const asset=assets.find(a=>a.names.includes(name));if(!asset)throw Error('Missing official asset: '+name);return [key,asset];
}));
const fonts=assets.filter(a=>a.category==='fonts'&&a.sources.some(s=>s.site==='brandbook')&&a.format==='woff2');
for(const file of ['tokens/site.css',...new Set([...Object.values(selected),...fonts].map(a=>a.file))]){
 const dest=path.join(target,'kit',file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(kit,file),dest);
}
await fs.writeFile(path.join(target,'assets.mjs'),'export const assets = '+JSON.stringify(Object.fromEntries(Object.entries(selected).map(([k,a])=>[k,'./kit/'+a.file])),null,2)+';\n');
await fs.writeFile(path.join(target,'provenance.json'),JSON.stringify({kit:'artifacts/DESIGN/BRANDS/MAX/site-kit-20261001',assets:[...Object.values(selected),...fonts].map(a=>({file:'kit/'+a.file,sha256:a.sha256,sources:a.sources})),contourSource:{file:'references/brandbook/styles/page.css',sha256:createHash('sha256').update(original).digest('hex'),rules:rules.length},buttonSource:{file:'references/authors/styles/14.BtByvkVB.css',sha256:createHash('sha256').update(authorsButtons).digest('hex'),selector:'.button.svelte-aaums6'},adaptations:['Fixed scene, varied card angles, slow field color, translucent cards and touch reaction are game adaptations of official CSS.','Red missing-asset marker is explicitly requested by the user.'],stage:'menu, palm and first blogger video guide; full interactive tasks are pending'},null,2)+'\n');
console.log('Prepared '+Object.keys(selected).length+' official media and '+fonts.length+' fonts.');
