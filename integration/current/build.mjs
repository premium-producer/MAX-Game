import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../..');
const {build}=await import(pathToFileURL(path.join(root,'node_modules/esbuild/lib/main.js')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const release=JSON.parse(await fs.readFile(path.join(root,'release.json')));
for(const profile of ['client','stand']){
 const code=path.join(root,'code',profile),packages=path.join(root,'node_modules');
 const plugins=[{name:'portable-accepted-dependencies',setup(b){
  b.onResolve({filter:/^\.\.\/\.\.\/(ribbon|service)\//},args=>({path:path.resolve(repo,'artifacts/max-game/src',args.path)}));
  b.onResolve({filter:/^\.\.\/public\/webgl-v5\/icon-glyphs\/manifest\.json$/},()=>({path:path.join(root,profile==='stand'?'code/static/icon-glyphs/manifest.json':'code/static/client-icon-manifest.json')}));
  if(profile==='stand'){
   b.onResolve({filter:/independent-assets-catalog\.json$/},()=>({path:path.join(root,'code/master/configs/max-presentation-assets.json')}));
   b.onResolve({filter:/mobile-control\/wall-session-port\.mjs$/},()=>({path:path.join(code,'mobile-control/wall-session-port.mjs')}));
  }
 }}];
 const result=await build({entryPoints:[path.join(code,'src/journey-guided-main.js')],nodePaths:[packages],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,write:false,metafile:true,legalComments:profile==='client'?'inline':'eof',plugins,external:profile==='stand'?['/bridge/audio-client.mjs']:[]});
 const bytes=result.outputFiles[0].contents,hash=sha(bytes);
 if(hash!==release.profiles[profile].appSha256)throw Error(`${profile}: REPRODUCTION_MISMATCH ${hash}`);
 const inputs={};for(const filename of Object.keys(result.metafile.inputs))inputs[path.relative(repo,path.resolve(filename)).replaceAll('\\','/')]=sha(await fs.readFile(filename));
 const target=path.join(root,'runtime',profile);await fs.mkdir(target,{recursive:true});
 await fs.writeFile(path.join(target,'app.js'),bytes);
 await fs.writeFile(path.join(target,'build-manifest.json'),JSON.stringify({profile,sha256:hash,bytes:bytes.length,inputs,portable:true,installed:false},null,2)+'\n');
 console.log(JSON.stringify({profile,sha256:hash,bytes:bytes.length,reproduced:true}));
}
