import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const apps=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const seal=process.argv.includes('--seal');
const selectedIndex=process.argv.indexOf('--app');
const selected=selectedIndex<0?null:process.argv[selectedIndex+1];
if(selected!==null&&!['stela','max-game'].includes(selected))throw Error('Use --app stela or --app max-game');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
// Windows and macOS enumerate mixed-case filenames in different orders.
const orderedFiles=files=>JSON.stringify(Object.entries(files).sort(([a],[b])=>a<b?-1:a>b?1:0));
for(const name of ['stela','max-game']){
 if(selected!==null&&name!==selected)continue;
 const root=path.join(apps,name);if(!fs.existsSync(root))continue;
 const files={};
 function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(['data','node_modules','package-manifest.json'].includes(e.name))continue;const filename=path.join(folder,e.name);if(e.isDirectory())walk(filename);else if(e.isFile()){const bytes=fs.readFileSync(filename);files[path.relative(root,filename).replaceAll('\\','/')]={bytes:bytes.length,sha256:sha(bytes)};}else throw Error('Nonportable filesystem entry: '+filename);}}
 walk(root);
 const manifestPath=path.join(root,'package-manifest.json');
 const manifest={application:JSON.parse(fs.readFileSync(path.join(root,'app.json'))).id,platform:'win32-x64',electron:fs.readFileSync((fs.existsSync(path.join(root,'runtime/version'))?path.join(root,'runtime/version'):path.resolve(apps,'../runtime/electron/version')),'utf8').trim(),files};
 if(seal)fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 else {const expected=JSON.parse(fs.readFileSync(manifestPath));if(orderedFiles(expected.files)!==orderedFiles(files))throw Error('Package files differ from manifest: '+name);}
 if(name==='max-game'){
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'source/client/src/reviewed-content/mission-catalog.json')));
  for(const asset of Object.values(catalog.assets))if(sha(fs.readFileSync(path.join(root,'www',asset.path)))!==asset.sha256)throw Error('Game catalog resource differs: '+asset.path);
 }
 console.log(JSON.stringify({application:name,sealed:seal,files:Object.keys(files).length,bytes:Object.values(files).reduce((sum,item)=>sum+item.bytes,0),valid:true}));
}
