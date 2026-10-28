import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../../apps/max-game/source/client/package.json',import.meta.url))('sharp');
const root=process.cwd(),publicRoot=path.join(root,'apps/max-game/source/client/public');
const manifestPath=path.join(publicRoot,'webgl-v5/icon-glyphs/manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath));
for(const id of ['max-icon.channel','max-icon.call']){
 const glyph=manifest[id],vectorPath=glyph.vectorPath??glyph.path,vectorSha256=glyph.vectorSha256??glyph.sha256;
 const svg=fs.readFileSync(path.join(root,'apps/max-game/www',vectorPath));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 if(sha(svg)!==vectorSha256)throw Error('Glyph source changed: '+id);
 const png=await sharp(svg,{density:576}).resize(960,960).png().toBuffer();
 const pngPath=vectorPath.replace(/\.svg$/,'.png');
 fs.writeFileSync(path.join(publicRoot,pngPath),png);
 Object.assign(glyph,{path:pngPath,sha256:sha(png),vectorPath,vectorSha256});
 console.log(JSON.stringify({id,bytes:png.length,width:960,sha256:glyph.sha256}));
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');

