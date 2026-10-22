import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createKdwCatalog} from './client/src/kdw-interactions-model.mjs';
import {PERSONAL_ASSETS} from './client/src/kdw-personal-channel-assets.mjs';
import {BUSINESS_UI_ASSETS} from './client/src/kdw-business-native-model.mjs';
const source=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(source,'..');
const packages=process.argv[2]?path.resolve(process.argv[2]):path.join(source,'client/node_modules');
if(!fs.existsSync(path.join(packages,'esbuild/lib/main.js')))throw Error('Pass an existing development node_modules directory. Runtime startup does not need this toolchain.');
const {build,transform}=await import(pathToFileURL(path.join(packages,'esbuild/lib/main.js')));
const sha=value=>createHash('sha256').update(value).digest('hex');
const web=path.join(root,'www/webgl-v5'),originalBundle=path.join(web,'r6-app.js');
if(!fs.existsSync(originalBundle)){
 const bytes=fs.readFileSync(path.join(web,'app.js'));
 const expected=JSON.parse(fs.readFileSync(path.join(source,'r6-release.json'))).profiles.client.appSha256;
 if(sha(bytes)!==expected)throw Error('Cannot preserve R6: current bundle is not the pinned baseline');
 fs.writeFileSync(originalBundle,bytes);
 fs.writeFileSync(path.join(web,'r6-client.html'),fs.readFileSync(path.join(web,'client.html'),'utf8').replace('./webgl-v5/app.js','./webgl-v5/r6-app.js'));
}
const nativeCatalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(source,'client/src/reviewed-content/mission-catalog.json'))));
for(const asset of Object.values({...nativeCatalog.assets,...PERSONAL_ASSETS,...BUSINESS_UI_ASSETS}).filter(a=>a.path.startsWith('assets/kdw-native/'))){
 const bytes=fs.readFileSync(path.join(source,'client/public',asset.path));
 if(sha(bytes)!==asset.sha256)throw Error('Native interaction resource differs: '+asset.path);
 fs.mkdirSync(path.dirname(path.join(root,'www',asset.path)),{recursive:true});fs.writeFileSync(path.join(root,'www',asset.path),bytes);
}
const result=await build({entryPoints:[path.join(source,'client/src/journey-guided-main.js')],nodePaths:[path.join(source,'vendor'),packages],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,write:false,metafile:true,legalComments:'inline'});
fs.mkdirSync(path.join(root,'www/licenses'),{recursive:true});
fs.writeFileSync(path.join(root,'www/licenses/glin-profanity.txt'),'Russian and English dictionary data from glin-profanity@3.3.0.\nhttps://github.com/glincker/glin-profanity/tree/v3.3.0\nOnly dictionary data is used; no ML or external services.\nUpstream LICENSE below; npm package license field says ISC.\n\n'+fs.readFileSync(path.join(source,'vendor/glin-profanity/LICENSE'),'utf8'));
const css=['kdw-interactions.css','kdw-posts.css','kdw-personal-channel.css','kdw-business-native.css'].map(name=>fs.readFileSync(path.join(source,'client/src',name),'utf8')).join('\n');
await transform(css,{loader:'css',sourcefile:'kdw-interactions.css'});
fs.writeFileSync(path.join(web,'app.js'),result.outputFiles[0].contents);
fs.writeFileSync(path.join(web,'kdw-interactions.css'),css);
const styles=['brand/tokens/brand.css',...['journey.css','journey-guided.css','journey-guided-line.css','journey-guided-reveal.css','v5.css','kdw-interactions.css'].map(n=>'webgl-v5/'+n)];
const html=`<!doctype html><html lang="ru" data-edition="client" data-experiment="guided" data-reveal="true" data-phone-layout="path" data-visual="webgl-bfm-v5" data-browser-stand="true" data-timer-policy="stand-device-timer"><head><base href="../"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0D001A"><title>MAX — стендовая игра</title><link rel="icon" href="data:,">${styles.map(p=>`<link rel="stylesheet" href="./${p}">`).join('')}<style>[hidden]{display:none!important}.guided-restart,[data-menu],[data-continue-mission]{display:none!important}#managed-status{display:none!important}#version-label{display:none!important}</style></head><body><canvas id="ambient" aria-hidden="true"></canvas><div id="arena"><div id="world" aria-hidden="true"></div><main id="circles"></main><div id="loading" role="status">Готовим пространство MAX…</div></div><script type="module" src="./webgl-v5/app.js"></script></body></html>`;
for(const name of ['client.html','index.html'])fs.writeFileSync(path.join(web,name),html);
fs.writeFileSync(path.join(web,'cafe-original.html'),html.replace('<title>MAX — стендовая игра</title>','<title>MAX — кофейня · исходные экраны</title>'));
const config=JSON.parse(fs.readFileSync(path.join(root,'app.json')));config.version='KDW-MAX-R9-STAND-20261018';config.entry='/webgl-v5/client.html?backend=local&view=game&v=kdw-r9-stand';fs.writeFileSync(path.join(root,'app.json'),JSON.stringify(config,null,2)+'\n');
const files={};for(const file of Object.keys(result.metafile.inputs)){const resolved=path.resolve(file);files[path.relative(source,resolved).replaceAll('\\','/')]=sha(fs.readFileSync(resolved));}
const stand=JSON.parse(fs.readFileSync(path.join(source,'stand-base/manifest.json'))),adaptations=[];
for(const [name,pin]of Object.entries(stand.files)){
 if(sha(fs.readFileSync(path.join(source,'stand-base',name)))!==pin)throw Error('Frozen stand baseline differs: '+name);
 const target=name.startsWith('src/')?path.join(source,'client',name):path.join(root,'www',name.slice('public/'.length));
 if(sha(fs.readFileSync(target))!==pin)adaptations.push(name);
}
const manifest={iteration:config.version,bundleSha256:sha(result.outputFiles[0].contents),cssSha256:sha(css),inputs:files,standBaseline:stand.id,standRuntimeSha256:stand.runtimeSha256,standFileCount:Object.keys(stand.files).length,standAdaptations:adaptations,interactionRenderer:'Shared stand rendering, motion, catalog and styles; local host admission, measured responsive composition and persistent SessionPort. KDW channel keyboard and store interactions retained.'};
if(adaptations.some(name=>!['src/journey-guided-main.js','src/journey-v5-backend.mjs','src/core/mission-core.mjs','src/contracts/mission-command.mjs','src/contracts/mission-catalog.mjs','src/journey-v5-route-layout.mjs','src/journey-webgl-ui.mjs','src/journey-v5-video-source.mjs'].includes(name)))throw Error('Unexpected stand baseline drift: '+adaptations.join(', '));
fs.writeFileSync(path.join(web,'r9-build.json'),JSON.stringify(manifest,null,2)+'\n');
const runtimeBuild=JSON.parse(fs.readFileSync(path.join(web,'build.json')));runtimeBuild.profile='KDW-MAX-R9-STAND';runtimeBuild.files['app.js']=manifest.bundleSha256;runtimeBuild.files['kdw-interactions.css']=manifest.cssSha256;runtimeBuild.entry=config.entry;fs.writeFileSync(path.join(web,'build.json'),JSON.stringify(runtimeBuild,null,2)+'\n');
console.log(JSON.stringify({iteration:config.version,bundleBytes:result.outputFiles[0].contents.length,modules:Object.keys(files).length,bundleSha256:manifest.bundleSha256}));
