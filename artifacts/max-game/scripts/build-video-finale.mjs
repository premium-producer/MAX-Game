import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';

export async function buildVideoFinale(source){
 const compiled=await build({entryPoints:[path.join(source,'src/journey-v5-finale-player.mjs')],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,write:false,metafile:true,legalComments:'inline'});
 const files=new Map([['finale-player.js',compiled.outputFiles[0].contents],['finale-player.css',await fs.readFile(path.join(source,'node_modules/video.js/dist/video-js.min.css'))]]);
 for(const name of await fs.readdir(path.join(source,'public/webgl-v5/finale-videos')))files.set('finale-videos/'+name,await fs.readFile(path.join(source,'public/webgl-v5/finale-videos',name)));
 for(const [pkg,file] of [['video.js','LICENSE'],['videojs-playlist','LICENSE'],['range-parser','LICENSE']])files.set('licenses/'+pkg+'.txt',await fs.readFile(path.join(source,'node_modules',pkg,file)));
 return {files,inputs:compiled.metafile.inputs};
}
export async function buildGameServer(source){
 return build({entryPoints:[path.join(source,'start.mjs')],bundle:true,platform:'node',format:'esm',target:['node22'],write:false,metafile:true});
}
