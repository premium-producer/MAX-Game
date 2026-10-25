import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildPlugin} from './build-plugin.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),plugin=path.resolve(dir,'..'),data=JSON.parse(fs.readFileSync(dir+'/final-fixtures.json')),provenance=JSON.parse(fs.readFileSync(dir+'/final-provenance.json')),frames=JSON.parse(fs.readFileSync(dir+'/final-captures.json')),sha=b=>createHash('sha256').update(b).digest('hex');
const root=path.resolve(dir,'../../../..'),production=root+'/'+provenance.productionRoot;
if(sha(fs.readFileSync(production+'/www/webgl-v5/app.js'))!==provenance.productionBundleSha256||provenance.productionBundleSha256!==provenance.sourceBuild.bundleSha256)throw Error('Production changed during capture: recapture required');
if(JSON.parse(fs.readFileSync(production+'/app.json')).entry!==provenance.productionEntry)throw Error('Production entry changed during capture');
if(JSON.stringify(JSON.parse(fs.readFileSync(production+'/settings/stand.json')))!==JSON.stringify(provenance.policy.value))throw Error('Production settings changed during capture');
const expected=new Set(['shared.standby',...data.fixtures.map(f=>f.id)]);
if(frames.length!==expected.size||new Set(frames.map(f=>f.id)).size!==expected.size||frames.some(f=>!expected.has(f.id)))throw Error('Final capture is incomplete or duplicated');
const assets={};let offset=0;
for(const f of frames){
 if(f.id!=='shared.standby'&&(!f.diagnostics?.state.production||f.diagnostics.state.development||f.diagnostics.forbidden?.length))throw Error('Not a clean production frame: '+f.id);
 const localPath='final-assets/'+f.image,bytes=fs.readFileSync(plugin+'/'+localPath);
 if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.readUInt32BE(16)!==3072||bytes.readUInt32BE(20)!==1536||f.width!==3072||f.height!==1536)throw Error('Not a native-resolution PNG: '+f.id);
 if(sha(bytes)!==f.sha256||bytes.length!==f.bytes)throw Error('Capture changed: '+f.id);
 if(bytes.length>8*1024*1024)throw Error('Frame exceeds bounded transport: '+f.id);
 assets[f.image]={localPath,offset,bytes:bytes.length,sha256:f.sha256,width:f.width,height:f.height,format:'png'};offset+=bytes.length;
}
const revision=data.revision+'.screenshots1',indexBytes=Buffer.from(JSON.stringify({schema:'max-screen-pack/v1',revision,payloadBytes:offset,assets})),magic=Buffer.from('MAXSCREENPACK1\n'),length=Buffer.alloc(4);length.writeUInt32LE(indexBytes.length);
const fd=fs.openSync(plugin+'/screens.maxscreens','w');try{fs.writeSync(fd,magic);fs.writeSync(fd,length);fs.writeSync(fd,indexBytes);for(const a of Object.values(assets))fs.writeSync(fd,fs.readFileSync(plugin+'/'+a.localPath));}finally{fs.closeSync(fd);}
const transport={schema:'max-screen-pack/v1',file:'screens.maxscreens',indexSha256:sha(indexBytes),bytes:fs.statSync(plugin+'/screens.maxscreens').size},summary={frames:frames.length,uniqueScreens:new Set(frames.filter(f=>data.catalog.tasks[f.taskId]?.screens[f.screenId]).map(f=>f.screenId)).size,assets:Object.keys(assets).length,width:3072,height:1536,missions:4,businesses:3,mediaBytes:offset},sectors={cafe:'Кофейня',flowers:'Цветочный магазин',auto:'Автомастерская'};
const pack={revision,transport,summary,sectors,catalog:data.catalog,frames:frames.map(({diagnostics,...f})=>f),assets};
buildPlugin(pack);
fs.writeFileSync(plugin+'/content-index.json',JSON.stringify({...pack,catalog:undefined,frames,provenance,omittedTransitions:data.omittedTransitions,excludedLegacyScreens:data.excluded,renderMode:'screenshot',notes:['Полные PNG3072×1536 без потерь, без ресайза/перевёрстки/текстовых слоёв поверх.','Фон/линки/анимации зафиксированы в одном реальном кадре; переходы завершаются до захвата.','Фотография игрока — шаблон текущей сборки; личные данные посетителей не читались.']},null,2));
console.log({...summary,uiBytes:fs.statSync(plugin+'/ui.html').size,codeBytes:fs.statSync(plugin+'/code.js').size,packBytes:transport.bytes});

