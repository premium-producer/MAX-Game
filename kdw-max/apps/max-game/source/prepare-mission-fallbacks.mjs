// Offline copies of reviewed media, not alternative screens. Embedded in the
// application so a failed file request cannot also break its own fallback.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createKdwCatalog} from './client/src/kdw-interactions-model.mjs';
import {PERSONAL_ASSETS} from './client/src/kdw-personal-channel-assets.mjs';
import {BUSINESS_UI_ASSETS} from './client/src/kdw-business-native-model.mjs';
export async function prepareMissionFallbacks(source,packages){
 const sharp=createRequire(import.meta.url)(path.join(packages,'sharp'));
 const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(source,'client/src/reviewed-content/mission-catalog.json'))));
 const assets={...catalog.assets,...PERSONAL_ASSETS,...BUSINESS_UI_ASSETS},wanted=new Set();
 for(const task of Object.values(catalog.tasks))for(const screen of Object.values(task.screens))if(assets[screen.assetId])wanted.add(assets[screen.assetId].path);
 for(const a of Object.values({...PERSONAL_ASSETS,...BUSINESS_UI_ASSETS}))if(!a.path.endsWith('/sprite.svg')&&(a.mimeType==='image/svg+xml'||a.path.includes('personal-channel/')))wanted.add(a.path);
 const portrait='assets/kdw-native/conversation/visitor-placeholder.svg',avatar='assets/kdw-native/conversation/visitor-avatar.svg';wanted.add(portrait);wanted.add(avatar);
 const publicRoot=path.join(source,'client/public'),www=path.join(source,'../www'),cache=path.resolve(source,'../../../.cache/mission-templates');fs.mkdirSync(cache,{recursive:true});
 const locate=p=>fs.existsSync(path.join(publicRoot,p))?path.join(publicRoot,p):path.join(www,p);
 function bytes(file){let b=fs.readFileSync(file);if(file.endsWith('.svg')){let text=b.toString();text=text.replace(/((?:xlink:)?href=")([^"#]+)(")/g,(all,open,url,close)=>{if(url.startsWith('data:'))return all;if(/^[a-z]+:/i.test(url))throw Error('Nonlocal template dependency: '+url);const dependency=path.resolve(path.dirname(file),url),ext=path.extname(dependency).slice(1),mime=ext==='svg'?'image/svg+xml':ext==='jpg'?'image/jpeg':'image/'+ext;return open+'data:'+mime+';base64,'+bytes(dependency).toString('base64')+close;});b=Buffer.from(text);}return b;}
 const embeddedRasters=new Map();
 async function renderable(p){let input=bytes(locate(p));if(!p.endsWith('.svg'))return input;let text=input.toString();for(const [uri]of text.matchAll(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g)){if(!embeddedRasters.has(uri))embeddedRasters.set(uri,sharp(Buffer.from(uri.split(',')[1],'base64')).png().toBuffer().then(b=>'data:image/png;base64,'+b.toString('base64')));text=text.replaceAll(uri,await embeddedRasters.get(uri));}return Buffer.from(text);}
 const media={},images={};let cursor=0;const paths=[...wanted].sort();
 await Promise.all(Array.from({length:2},async()=>{while(cursor<paths.length){const p=paths[cursor++],input=await renderable(p),key=createHash('sha256').update('webp90-v3-png-embedded').update(input).digest('hex'),file=path.join(cache,key+'.webp');if(!fs.existsSync(file))fs.writeFileSync(file,await sharp(input,{limitInputPixels:40000000}).webp({quality:90,alphaQuality:100,smartSubsample:true,effort:3}).toBuffer().catch(error=>{throw Error(p+': '+error.message);}));const output=fs.readFileSync(file);if(p===portrait||p===avatar){const stats=await sharp(output).stats();if(stats.channels.length===4&&stats.channels[3].mean<250)throw Error('Empty template portrait: '+p);}media[p]=key;images[key]='data:image/webp;base64,'+output.toString('base64');}}));
 // Old retained URLs recover to the same authored screen at its new quality.
 for(const [previous,current]of Object.entries(catalog.kdwHighQualitySources??{}))if(media[current])media[previous]=media[current];
 const value={images:Object.fromEntries(Object.entries(images).sort()),media:Object.fromEntries(Object.entries(media).sort()),assets:Object.fromEntries(Object.values(assets).filter(a=>media[a.path]).map(a=>[a.assetId,a.path])),screens:Object.fromEntries(Object.values(catalog.tasks).flatMap(t=>Object.values(t.screens).filter(s=>assets[s.assetId]).map(s=>[s.screenId,assets[s.assetId].path]))),portrait:images[media[portrait]],avatar:images[media[avatar]]};
 fs.writeFileSync(path.join(source,'client/src/kdw-template-media.json'),JSON.stringify(value)+'\n');
 console.log(JSON.stringify({templateMedia:paths.length,embeddedBytes:Buffer.byteLength(JSON.stringify(value))}));
}
