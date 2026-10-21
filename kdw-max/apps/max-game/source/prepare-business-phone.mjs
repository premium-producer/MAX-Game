// Use the second screen's number on the first screen; no re-typesetting.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const catalog=JSON.parse(fs.readFileSync(path.join(source,'client/src/reviewed-content/mission-catalog.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const load=id=>{const asset=catalog.assets[id],bytes=fs.readFileSync(path.join(source,'../www',asset.path));if(sha(bytes)!==asset.sha256)throw Error('Business phone source differs: '+id);return {asset,bytes};};
const previous=load('figma.296-17821'),current=load('figma.296-17801');
const region={x:30,y:1188,width:280,height:32,sourceY:412};
const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="720" height="1588" viewBox="0 0 720 1588">
<title>Канал MAX для бизнеса — подтверждение номера +7 912 000-00-00</title>
<defs><clipPath id="number"><rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}"/></clipPath></defs>
<image width="720" height="1588" xlink:href="data:image/png;base64,${current.bytes.toString('base64')}"/>
<g clip-path="url(#number)"><image y="${region.y-region.sourceY}" width="720" height="1588" xlink:href="data:image/png;base64,${previous.bytes.toString('base64')}"/></g>
</svg>\n`;
const assetPath='assets/kdw-native/business-channel-phone.svg';
fs.writeFileSync(path.join(source,'client/public',assetPath),svg);
const asset={assetId:'kdw.native.business-channel-phone',path:assetPath,width:720,height:1588,mimeType:'image/svg+xml',sha256:sha(svg),origin:{kind:'local-phone-consistency',sourceAssetId:current.asset.assetId,sourceSha256:current.asset.sha256,numberAssetId:previous.asset.assetId,numberSha256:previous.asset.sha256,number:'+7 912 000-00-00',region}};
fs.writeFileSync(path.join(source,'client/src/kdw-business-phone-asset.json'),JSON.stringify(asset,null,2)+'\n');
console.log(JSON.stringify({asset:assetPath,sha256:asset.sha256,number:asset.origin.number}));
