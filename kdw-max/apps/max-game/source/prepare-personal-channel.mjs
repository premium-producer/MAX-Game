import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url)),pack=path.resolve(source,'../../../UI/new_screens/personal_channel/prepared'),base='assets/kdw-native/personal-channel/';
const manifest=JSON.parse(fs.readFileSync(path.join(pack,'manifest.json'))),assets={};
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const a of manifest.assets){const b=fs.readFileSync(path.join(pack,a.path));if(sha(b)!==a.sha256)throw Error('Prepared asset changed: '+a.id);const file=path.join(source,'client/public',base,a.path);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);const id='kdw.personal.'+a.id;assets[id]={assetId:id,path:base+a.path,mimeType:a.mimeType,sha256:a.sha256,width:a.width??Math.ceil(a.viewBox?.[2]??360),height:a.height??Math.ceil(a.viewBox?.[3]??800)};}
for(const theme of ['dark','light']){const id='kdw.personal.phone-'+theme,relative=base+'phone-'+theme+'.svg',svg=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="800" viewBox="0 0 360 800"><rect width="360" height="800" rx="24" fill="${theme==='dark'?'#17181C':'#FFFFFF'}"/></svg>\n`;fs.writeFileSync(path.join(source,'client/public',relative),svg);assets[id]={assetId:id,path:relative,mimeType:'image/svg+xml',width:360,height:800,sha256:sha(svg)};}
// Exact reviewed screens are retained; native controls replace only personalized regions.
const fields={
 4:[[204,168,24,24,'#17181c'],[132,168,96,96,'#17181c',48],[24,299,310,30,'#2b2c2e'],[24,358,312,67,'#2b2c2e']],
 7:[[88,351,213,47,'#4d4e61'],[36,404,290,24,'#25262d']],
 8:[[88,351,213,47,'#393a40'],[36,404,290,24,'#25262d']],
 10:[[47,63,42,42,'#17181c',21],[94,62,226,28,'#17181c'],[143,481,74,74,'#30313e',37]],
 11:[[47,59,42,42,'#fff',21],[94,60,226,28,'#fff']],
 12:[[5,293,34,34,'#94cee8',17],[46,470,264,44,'#fff']],
 13:[[5,221,34,34,'#94cee8',17],[46,452,264,62,'#fff'],[315,473,38,38,'#fff',19]],
 14:[[5,431,34,34,'#94cee8',17],[72,652,272,48,'#e3ffff']],
 15:[[47,59,42,42,'#fff',21],[94,60,226,28,'#fff']]
};
for(let n=1;n<=15;n++){
 const id='kdw.personal.screen-'+n,relative=base+'screens/screen_'+n+'.png',b=fs.readFileSync(path.resolve(pack,'../png/screen_'+n+'.png')),file=path.join(source,'client/public',relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);assets[id]={assetId:id,path:relative,mimeType:'image/png',width:360,height:800,sha256:sha(b)};
 // GPU presentation must never contain sample names/avatars/replies. Those fields
 // belong exclusively to the native profile layer, including on entering/exiting frames.
 const masks=(fields[n]??[]).map(([x,y,w,h,fill,rx=0])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`).join('');
 const underlay=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="800" viewBox="0 0 360 800"><image width="360" height="800" href="data:image/png;base64,${b.toString('base64')}"/>${masks}</svg>\n`,underlayPath=base+'screens/underlay_'+n+'.svg',underlayId='kdw.personal.underlay-'+n;
 fs.writeFileSync(path.join(source,'client/public',underlayPath),underlay);assets[underlayId]={assetId:underlayId,path:underlayPath,mimeType:'image/svg+xml',width:360,height:800,sha256:sha(underlay)};
}
const replyParts=JSON.parse(fs.readFileSync(path.join(source,'client/public',base,'reply/manifest.json')));
if(sha(fs.readFileSync(path.resolve(source,'../../..',replyParts.source)))!==replyParts.sourceSha256)throw Error('Reviewed reply source changed');
for(const [name,a]of Object.entries(replyParts.parts)){
 const id='kdw.personal.reply-'+name;assets[id]={assetId:id,...a};
}
const prefixPath=base+'reply/prefix.png',prefix=fs.readFileSync(path.join(source,'client/public',prefixPath));
assets['kdw.personal.reply-prefix']={assetId:'kdw.personal.reply-prefix',path:prefixPath,mimeType:'image/png',width:360,height:434,sha256:sha(prefix)};
assets['kdw.personal.underlay-14']={...assets['kdw.personal.reply-background'],assetId:'kdw.personal.underlay-14'};
// Statistics stays a two-screen task: personalized profile, then the first chart.
// Remove authored sample data rather than covering it on entering/leaving frames.
const statistics=path.resolve(pack,'../statistic');
for(const [n,name]of [[16,'Профиль'],[17,'Статистика_скролл_Подписчики']]){
 let svg=fs.readFileSync(path.join(statistics,name+'.svg'),'utf8');
 const sourceSha256=sha(svg);
 if(n===16){
  for(const start of ['M706.599 252.217','M548.396 695.216','M113.072 1445.1','M398.098 1517.73','M1070.42 2671.51']){
   const matches=[...svg.matchAll(/<path\b[^>]*\/>/g)].filter(m=>m[0].includes('d="'+start));
   if(matches.length!==1)throw Error('Statistics profile region changed: '+start);
   let replacement='';
   if(start==='M113.072 1445.1'){
    // The final three subpaths are the authored ellipsis on its own footer row.
    // They belong to the chrome, not to the sample description being replaced.
    const d=matches[0][0].match(/ d="([^"]+)"/)[1];
    const dots=d.match(/M[^M]*/g).filter(p=>/^M(?:98\.7499|112\.152|124\.879) 1620\.53/.test(p));
    if(dots.length!==3)throw Error('Statistics description ellipsis changed');
    replacement=matches[0][0].replace(d,dots.join(''));
   }
   svg=svg.replace(matches[0][0],replacement);
  }
  svg=svg.replace(/<rect width="376.853" height="376.853"[^>]*\/>/,'');
  svg=svg.replace(/<pattern id="pattern0_4294_12986"[\s\S]*?<\/pattern>/,'');
  svg=svg.replace(/<image\b[^>]*id="image0_4294_12986"[^>]*\/>/,'');
 }
 const relative=base+'screens/underlay_'+n+'.svg',id='kdw.personal.underlay-'+n;
 fs.writeFileSync(path.join(source,'client/public',relative),svg);
 assets[id]={assetId:id,path:relative,mimeType:'image/svg+xml',width:360,height:800,sha256:sha(svg),origin:{path:'UI/new_screens/personal_channel/statistic/'+name+'.svg',sha256:sourceSha256}};
}
fs.writeFileSync(path.join(source,'client/src/kdw-personal-channel-assets.mjs'),`// Generated from reviewed assets and exact PNG screen references.\nexport const PERSONAL_ASSET_BASE=${JSON.stringify(base)};\nexport const PERSONAL_ASSETS=${JSON.stringify(assets,null,2)};\n`);
console.log(JSON.stringify({assets:Object.keys(assets).length,bytes:manifest.totals.preparedAssetBytes}));
