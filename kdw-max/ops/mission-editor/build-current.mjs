import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createKdwCatalog} from '../../apps/max-game/source/client/src/kdw-interactions-model.mjs';
import {BUSINESS_UI_ASSETS} from '../../apps/max-game/source/client/src/kdw-business-native-model.mjs';
import {businessAllLayout} from '../../apps/max-game/source/client/src/kdw-business-all-model.mjs';
import {v5Text} from '../../apps/max-game/source/client/src/journey-v5-ui-copy.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..'),runtime=root+'/apps/max-game/www';
const packages=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]),snapshot=path.resolve(process.argv[4]);
const {build}=await import(pathToFileURL(packages+'/esbuild/lib/main.js')),{default:sharp}=await import(pathToFileURL(packages+'/sharp/dist/index.mjs'));
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const game=createKdwCatalog(read(root+'/apps/max-game/source/client/src/reviewed-content/mission-catalog.json'));
const saved=read(snapshot+'/live-flow-20261022.json'),oldCatalog=read(snapshot+'/live-catalog-20261022.json'),previous=read(snapshot+'/accepted-flow-20261022.json');
assert.deepEqual(saved,previous,'Cloud draft has team edits; reconcile before replacing defaults');
assert.ok(!fs.existsSync(output),'Use a fresh output');fs.mkdirSync(output,{recursive:true});
const files=new Map(),add=(n,b)=>files.set(n,Buffer.from(b));
const classify=(b,n)=>n.endsWith('.svg')?{kind:/<image\b/i.test(b.toString())?'svg-raster':'svg-vector',label:/<image\b/i.test(b.toString())?'SVG + растр':'SVG · вектор'}:{kind:'screenshot',label:'Изображение'};
const assets={};
for(const a of Object.values({...game.assets,...BUSINESS_UI_ASSETS})){
 let bytes=fs.readFileSync(runtime+'/'+a.path);assert.equal(sha(bytes),a.sha256,a.path);
 if(a.path.endsWith('.svg'))bytes=Buffer.from(bytes.toString().replace(/(?:xlink:)?href="(\.\/[^"#]+)"/g,(all,relative)=>{
  const full=path.resolve(runtime,path.dirname(a.path),relative);assert.ok(full.startsWith(path.resolve(runtime)+path.sep));const b=fs.readFileSync(full),ext=path.extname(full).toLowerCase();const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'}[ext];assert.ok(mime,relative);return all.replace(relative,'data:'+mime+';base64,'+b.toString('base64'));
 }));
 assets[a.assetId]={...a,sha256:sha(bytes),sourceSha256:a.sha256,url:'../'+a.path,resource:classify(bytes,a.path)};add('public/'+a.path,bytes);
}
// The in-game snack is a transparent canvas plus the exact source artwork.
const snack=BUSINESS_UI_ASSETS['kdw.business-confirmation.snack-body'];
const canvas=assets['kdw.business-confirmation.canvas'];
if(snack&&canvas){const inner=fs.readFileSync(runtime+'/'+snack.path,'utf8').replace(/^.*?<svg\b[^>]*>/s,'').replace(/<\/svg>\s*$/,'');const scale=895/455,h=78*scale,svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="895" height="559" viewBox="0 0 895 559"><g transform="translate(0 ${(559-h)/2}) scale(${scale})">${inner}</g></svg>`);canvas.sha256=sha(svg);canvas.resource=classify(svg,canvas.path);add('public/'+canvas.path,svg);}
const glyphs=read(runtime+'/webgl-v5/icon-glyphs/manifest.json'),catalogs={},flows={};
const tools=path.join(output,'build');fs.mkdirSync(tools);
await build({entryPoints:[here+'/src/flow-document.mjs'],nodePaths:[packages],bundle:true,platform:'node',format:'esm',outfile:tools+'/flow-document.mjs'});
const {migrateFlowDocument,validateFlowDocument}=await import(pathToFileURL(tools+'/flow-document.mjs'));
for(const variant of ['cafe','flowers','auto']){
 const revision=game.contentRevision+'.editor-20261022.'+variant,catalog={schemaVersion:1,contentRevision:revision,runtimeContentRevision:game.contentRevision,businessVariant:variant,source:'KDW-MAX current compiled catalog',assets:Object.values(assets),missions:[]};
 for(const m of Object.values(game.missions)){
  const mission={missionId:m.missionId,title:v5Text(m.title),test:!!m.test,taskIds:m.taskIds,tasks:[]};catalog.missions.push(mission);
  for(const id of m.taskIds){const t=game.tasks[id],glyph=glyphs[t.iconAssetId],bytes=fs.readFileSync(runtime+'/'+glyph.path);assert.equal(sha(bytes),glyph.sha256);add('public/'+glyph.path,bytes);const task={taskId:id,title:v5Text(t.title),startScreenId:t.startScreenId,icon:{url:'../'+glyph.path,...classify(bytes,glyph.path)},screens:[]};mission.tasks.push(task);
   for(const [index,s]of Object.values(t.screens).entries()){
    const layout=businessAllLayout(s.screenId,variant),asset=assets[layout&&s.screenId!=='business.platform.ready'?layout.assetId:s.assetId];assert.ok(asset,s.screenId);
    const thumb='thumbs/'+asset.assetId.replace(/[^a-zA-Z0-9._-]/g,'_')+'-'+asset.sha256.slice(0,12)+'.webp';
    if(!files.has('public/editor/'+thumb))add('public/editor/'+thumb,await sharp(files.get('public/'+asset.path)).resize({width:440,height:520,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer());
    const actions=structuredClone(s.actions);if(layout&&s.screenId!=='business.platform.ready')actions.forEach((a,i)=>{a.rect=layout.actions[Math.min(i,layout.actions.length-1)].slice(0,4);});
    const native=(!layout&&s.screenId.startsWith('business.'))||['blogger.channel.name','blogger.channel.filled'].includes(s.screenId);
    const resource=native?{kind:'interactive-html',label:'HTML · справочный исходник',note:'В игре живой HTML. Это исходная подложка для разметки; поля и игровые карточки отдельно.'}:{...asset.resource,note:'Точный исходный экран. Редактируются зоны и переходы; фотография и динамические данные в игре подставляются отдельно.'};
    task.screens.push({screenId:s.screenId,order:index+1,deviceKind:s.deviceKind,assetId:asset.assetId,asset:{...asset,thumbnailUrl:thumb},resource,instruction:v5Text(s.instruction),mode:s.mode,automaticMs:s.automaticMs??null,missing:s.missing??null,actions});
   }
  }
 }
 const screens=catalog.missions.flatMap(m=>m.tasks.flatMap(t=>t.screens));catalog.counts={missions:catalog.missions.length,tasks:catalog.missions.reduce((n,m)=>n+m.tasks.length,0),screens:screens.length,uniqueScreens:new Set(screens.map(s=>s.screenId)).size,assets:catalog.assets.length};
 catalog.resourceCounts=Object.fromEntries([...new Set(screens.map(s=>s.resource.kind))].map(k=>[k,screens.filter(s=>s.resource.kind===k).length]));
 const flow=migrateFlowDocument({schemaVersion:2,contentRevision:revision,records:[],screens:[]},catalog);
 for(const m of flow.missions)m.helpText=saved.missions.find(x=>x.missionId===m.missionId)?.helpText??null;
 for(const t of flow.tasks){const old=saved.tasks.find(x=>x.taskId===t.taskId);t.helpText=old?.helpText??null;for(const s of t.screens){const prior=old?.screens.find(x=>x.screenId===s.screenId);if(prior){s.enabled=prior.enabled;s.final=prior.final;const original=oldCatalog.missions.flatMap(m=>m.tasks.flatMap(t=>t.screens)).find(x=>x.screenId===s.screenId);if(prior.help.mode!=='override'||prior.help.text!==original?.instruction)s.help=structuredClone(prior.help);}
   if(s.screenId==='business.platform.business-type')for(const action of s.interactions)if(/choose-(sports|hotel|theater)$/.test(action.sourceActionId||''))action.enabled=false;
   if(s.screenId==='business.store.dashboard'){const first=s.interactions[0];s.interactions.push({...structuredClone(first),interactionId:first.interactionId+'.menu',rect:[21,122,125,29],name:'Чат-боты и мини-приложения'});}
  }}
 validateFlowDocument(flow,catalog,{publish:true});catalogs[variant]=catalog;flows[variant]=flow;
 const suffix=variant==='cafe'?'':'.'+variant;add('public/editor/catalog'+suffix+'.json',JSON.stringify(catalog,null,2)+'\n');fs.writeFileSync(tools+'/flow-v3'+suffix+'.json',JSON.stringify(flow,null,2)+'\n');
}
for(const [entry,name,platform]of [['main.mjs','public/editor/app.js','browser'],['server-store.mjs','server/asset-audit-store.mjs','node']]){
 const bundle=await build({entryPoints:[here+'/src/'+entry],nodePaths:[packages],bundle:true,platform,format:'esm',target:platform==='node'?'node22':'es2022',outfile:output+'/'+name,write:false,minify:platform==='browser',legalComments:'inline'});for(const f of bundle.outputFiles)add(path.relative(output,f.path).replaceAll('\\','/'),f.contents);
}
for(const n of ['audit.css','third-party-notices.html','licenses-browser.txt','licenses-node.txt'])add('public/editor/'+n,fs.readFileSync(here+'/dist/public/editor/'+n));
let html=fs.readFileSync(here+'/public/index.html','utf8').replace('18.10.2026','22.10.2026');html=html.replace('<div class="toolbar">','<nav class="notice" aria-label="Бизнес"><strong>Бизнес: </strong><a href="?business=cafe">Кофейня</a> · <a href="?business=flowers">Цветочный магазин</a> · <a href="?business=auto">Автомастерская</a></nav><div class="toolbar">');add('public/editor/index.html',html);
add('server/asset-audit-server.mjs',fs.readFileSync(here+'/variant-server.mjs'));add('server/asset-audit-base-server.mjs',fs.readFileSync(here+'/snapshot/asset-audit-server.mjs'));
for(const n of ['tokens/brand.css',...['300','400','500','600','700'].map(w=>'assets/fonts/max-sans-'+w+'.woff2')])add('public/brand/'+n,fs.readFileSync(runtime+'/brand/'+n));
const report={revision:catalogs.cafe.contentRevision,counts:catalogs.cafe.counts,variants:['cafe','flowers','auto'],oldFlowSha256:sha(fs.readFileSync(snapshot+'/live-flow-20261022.json')),newFlows:Object.fromEntries(Object.entries(flows).map(([v,f])=>[v,sha(Buffer.from(JSON.stringify(f,null,2)+'\n'))])),files:Object.fromEntries([...files].map(([n,b])=>[n,sha(b)]))};
add('build.json',JSON.stringify(report,null,2)+'\n');for(const [name,bytes]of files){fs.mkdirSync(path.dirname(output+'/'+name),{recursive:true});fs.writeFileSync(output+'/'+name,bytes);}fs.writeFileSync(output+'/SHA256SUMS',[...files].map(([n,b])=>sha(b)+'  '+n).join('\n')+'\n');
console.log(JSON.stringify({output,counts:report.counts,variants:report.variants,files:files.size}));
