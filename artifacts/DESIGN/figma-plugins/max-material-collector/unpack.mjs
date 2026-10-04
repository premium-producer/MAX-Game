import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>String(s).replace(/[^a-zA-Z0-9._-]/g,'-').replace(/^\.+/,'')||'unknown';
const label=s=>String(s||'').replace(/[^\p{L}\p{N}._-]+/gu,'-').replace(/^[.-]+|[.-]+$/g,'').slice(0,80)||'unnamed';
const decode=s=>{if(typeof s!=='string'||s.length>300*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid base64');return Buffer.from(s,'base64');};
function ext(bytes){if(bytes.subarray(0,4).equals(Buffer.from([137,80,78,71])))return 'png';if(bytes[0]===255&&bytes[1]===216)return 'jpg';if(bytes.subarray(0,3).toString()==='GIF')return 'gif';if(bytes.subarray(8,12).toString()==='WEBP')return 'webp';return 'bin';}
export async function unpack(bundle,output){
 if(bundle?.schema!=='max-client-materials'||bundle.version!==1||!Array.isArray(bundle.screens)||bundle.screens.length>500||!Array.isArray(bundle.images))throw Error('Not a MAX materials bundle');
 if(bundle.images.length>10000)throw Error('Too many images');
 const root=path.resolve(output);await fs.mkdir(root,{recursive:false}); // Never overwrite a previous export.
 const catalog={...bundle,screens:[],images:[]},cards=[];let total=0;
 async function write(name,data){total+=Buffer.byteLength(data);if(total>600*1024*1024)throw Error('Extracted size limit');const target=path.resolve(root,name);if(!target.startsWith(root+path.sep))throw Error('Unsafe output');await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data,{flag:'wx'});}
 const used=new Set();
 for(const s of bundle.screens){
  const folder=s.detection==='structure'?(s.containerPath?.length?s.containerPath.map(n=>`${safe(n.id)}-${label(n.name)}`).join('/'):'page'):safe(s.task);
  const stem=`${folder}/${String(s.order).padStart(3,'0')}-${safe(s.id)}${s.detection==='structure'?'-'+label(s.title||s.name):''}`;if(used.has(stem))throw Error('Duplicate output name');used.add(stem);
  const {png,svg,thumbnail,document,...meta}=s;
  if(png){meta.pngFile=stem+'.png';await write(meta.pngFile,decode(png));}
  if(svg){meta.svgFile=stem+'.svg';await write(meta.svgFile,decode(svg));}
  if(thumbnail){meta.previewFile=stem+'-preview.png';await write(meta.previewFile,decode(thumbnail));}
  if(document){meta.documentFile=stem+'-figma.json';await write(meta.documentFile,JSON.stringify(document,null,2));}
  await write(stem+'.json',JSON.stringify(meta,null,2));catalog.screens.push(meta);
  cards.push(`<figure><a href="${escape(meta.pngFile||'#')}">${meta.previewFile?`<img loading="lazy" src="${escape(meta.previewFile)}">`:'Без превью'}</a><figcaption>${escape(s.groupName||s.task)}<br>${escape(s.order)} · ${escape(s.title||s.name)}<small>${escape(s.id)} · ${escape(s.exportStatus)} · ${s.reviewed?'проверено':'не проверено'}</small><small>${escape(s.evidence?.[0]?.text||'Нет контекста')}</small></figcaption></figure>`);
 }
 for(const img of bundle.images){const bytes=decode(img.data),file=`images/${safe(img.hash)}.${ext(bytes)}`;await write(file,bytes);catalog.images.push({hash:img.hash,file});}
 await write('catalog.json',JSON.stringify(catalog,null,2));
 await write('coverage.json',JSON.stringify(bundle.coverage,null,2));
 await write('fonts.json',JSON.stringify({fontFilesIncluded:false,fonts:bundle.fonts||[]},null,2));
 await write('index.html',`<!doctype html><meta charset="utf-8"><title>MAX — материалы клиента</title><style>body{font:14px Arial;padding:24px;background:#f4f3f8}main{display:flex;flex-wrap:wrap;gap:20px}figure{width:180px;margin:0 0 22px}img{max-width:160px;max-height:380px}small{display:block;color:#666}figcaption{overflow-wrap:anywhere}</style><h1>MAX — материалы клиента</h1><p>${escape(bundle.source?.pageName)} · ${escape(bundle.status)} · ${catalog.screens.length} экранов</p><p>Порядок чтения не заменяет связи прототипа. Наличие экранов не подтверждает полноту задания.</p><main>${cards.join('')}</main>`);
 return {output:root,screens:catalog.screens.length,images:catalog.images.length,status:bundle.status};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2]||!process.argv[3])throw Error('Usage: node unpack.mjs input.json new-output-directory');
 const file=process.argv[2];if((await fs.stat(file)).size>400*1024*1024)throw Error('Input size limit');
 console.log(JSON.stringify(await unpack(JSON.parse(await fs.readFile(file,'utf8')),process.argv[3])));
}
