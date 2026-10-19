import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(source,'..');
const accepted='F:/project/VK_DigitalProducts_Stand/artifacts/production-source-max-show-20261005';
const publicRoot='F:/project/VK_DigitalProducts_Stand/artifacts/canonical-max/public/max-game';
const snapshot=path.join(source,'stand-base');
if(fs.existsSync(snapshot))throw Error('Stand baseline already imported. Do not overwrite local development.');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const provenance=JSON.parse(fs.readFileSync(path.join(accepted,'provenance.json')));
for(const item of provenance.maxShowDevice20261005.presentationSources){
 if(sha(fs.readFileSync(path.join(accepted,item.path)))!==item.sha256)throw Error('Accepted source pin differs: '+item.path);
}
const catalog=JSON.parse(fs.readFileSync(path.join(accepted,'source/max-presentation/src/reviewed-content/mission-catalog.json')));
for(const asset of Object.values(catalog.assets))if(sha(fs.readFileSync(path.join(publicRoot,asset.path)))!==asset.sha256)throw Error('Stand asset pin differs: '+asset.path);
const history=path.join(source,'history/r7-before-stand');
fs.cpSync(path.join(source,'client/src'),path.join(history,'src'),{recursive:true});
fs.cpSync(path.join(root,'www/webgl-v5'),path.join(history,'webgl-v5'),{recursive:true});
fs.cpSync(path.join(accepted,'source/max-presentation/src'),path.join(snapshot,'src'),{recursive:true});
fs.cpSync(path.join(snapshot,'src'),path.join(source,'client/src'),{recursive:true});
const files={};
function record(folder,prefix=''){for(const e of fs.readdirSync(folder,{withFileTypes:true})){const rel=prefix+e.name,p=path.join(folder,e.name);if(e.isDirectory())record(p,rel+'/');else files['src/'+rel]=sha(fs.readFileSync(p));}}
record(path.join(snapshot,'src'));
for(const name of ['journey.css','journey-guided.css','journey-guided-line.css','journey-guided-reveal.css','v5.css','icon-glyphs/manifest.json']){
 const bytes=fs.readFileSync(path.join(publicRoot,'webgl-v5',name));
 const dest=path.join(snapshot,'public/webgl-v5',name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
 fs.writeFileSync(path.join(root,'www/webgl-v5',name),bytes);files['public/webgl-v5/'+name]=sha(bytes);
}
for(const asset of Object.values(catalog.assets)){
 const dest=path.join(root,'www',asset.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(publicRoot,asset.path),dest);
}
const runtime=path.join(accepted,'roles/MAX_RIGHT/app/max-ui/max-game/webgl-v5/app.js');
const pin=JSON.parse(fs.readFileSync(path.join(accepted,'roles/MAX_RIGHT/app/max-adapter/accepted-source.json')));
const runtimeSha256=sha(fs.readFileSync(runtime));
if(pin.files['max-game/webgl-v5/app.js']!==runtimeSha256)throw Error('Accepted runtime pin differs');
fs.writeFileSync(path.join(snapshot,'manifest.json'),JSON.stringify({id:'MAX-SHOW-02-ACCEPTED',acceptedRoot:accepted,publicRoot,runtimeSha256,assets:Object.fromEntries(Object.values(catalog.assets).map(a=>[a.path,a.sha256])),files},null,2)+'\n');
console.log(JSON.stringify({sourceFiles:Object.keys(files).length,assets:Object.keys(catalog.assets).length,runtimeSha256,history}));
