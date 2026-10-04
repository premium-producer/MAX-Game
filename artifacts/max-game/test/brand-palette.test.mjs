import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const allowed=new Set(['00BFFF','6E1AFF','0D001A','471AFF','9500FF','FFFFFF']);
async function files(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else if(/\.(js|mjs|css|json)$/.test(p))out.push(p);}return out;}
test('authored MAX source/config colors stay in user-approved six-color palette',async()=>{
 const bad=[];
 for(const f of [...await files(path.join(root,'src')),...await files(path.join(root,'public/config'))]){
  let s=await fs.readFile(f,'utf8');
  // User 29.09 explicitly requested red for incorrect journey links only.
  if(path.basename(f)==='webgl-field.js')s=s.replace('link.error === true ? 0xff334d :','link.error === true ? USER_APPROVED_ERROR_COLOR :');
  for(const m of s.matchAll(/(?:#([\da-f]{8}|[\da-f]{6}|[\da-f]{3})(?![\da-f\w])|0x([\da-f]{6})(?![\da-f]))/gi)){
   let c=(m[1]||m[2]).toUpperCase();if(c.length===3)c=[...c].map(x=>x+x).join('');c=c.slice(0,6);if(!allowed.has(c))bad.push(path.relative(root,f)+': '+m[0]);
  }
  for(const m of s.matchAll(/rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/g)){
   const c=m.slice(1).map(x=>Number(x).toString(16).padStart(2,'0')).join('').toUpperCase();if(!allowed.has(c))bad.push(path.relative(root,f)+': '+m[0]);
  }
 }
 assert.deepEqual(bad,[]);
});
test('Earth preset does not reintroduce source photographic hues',async()=>{
 const config=JSON.parse(await fs.readFile(path.join(root,'public/config/ui-shell.json'),'utf8'));
 function check(o){for(const [k,v] of Object.entries(o)){if(v&&typeof v==='object')check(v);else if(['saturation','textureSaturation','textureColorMix'].includes(k))assert.equal(v,0,k);}}
 check(config);
});
