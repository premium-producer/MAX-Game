import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {classify} from './source/catalog.mjs';
const root=new URL('./',import.meta.url),input=new URL('../../../reports/max-client-screens-20260928/',root);
const list=JSON.parse(await fs.readFile(new URL('screens.json',input),'utf8'));
if(list.length!==84||new Set(list.map(s=>s.file)).size!==84)throw Error('Expected 84 unique screenshots');
const data=[];
function dimensions(bytes){
  if(bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a')return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),format:'PNG'};
  if(bytes[0]===255&&bytes[1]===216){
    for(let i=2;i<bytes.length;){
      if(bytes[i++]!==255)throw Error('Invalid JPEG marker');
      while(bytes[i]===255)i++;
      const marker=bytes[i++];if(marker===217||marker===218)break;
      if(marker===1||(marker>=208&&marker<=215))continue;
      const size=bytes.readUInt16BE(i);
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return {height:bytes.readUInt16BE(i+3),width:bytes.readUInt16BE(i+5),format:'JPEG'};
      if(size<2)break;i+=size;
    }
  }
  throw Error('Unsupported screenshot format');
}
for(const item of list){
  if(!/^[\w-]+\.png$/.test(item.file))throw Error('Invalid filename');
  const png=await fs.readFile(new URL(item.file,input));
  data.push(classify({...item,...dimensions(png),base64:png.toString('base64')}));
}
data.sort((a,b)=>a.file.localeCompare(b.file));
const core=(await fs.readFile(new URL('source/catalog.mjs',root),'utf8')).replaceAll('export ','');
const metadata=data.map(({base64,...item})=>item);
for(const [src,dest,token,payload] of [['source/code.js','code.js','[] /* __CATALOG__ */',metadata],['source/ui.html','ui.html','/* __DATA__ */',data]]){
  const template=await fs.readFile(new URL(src,root),'utf8');
  await fs.writeFile(new URL(dest,root),template.replace('/* __CORE__ */',core).replace(token,()=>JSON.stringify(payload)));
}
await fs.writeFile(new URL('catalog.json',root),JSON.stringify(metadata,null,2));
console.log('Built 84 screenshots:',fileURLToPath(root));
