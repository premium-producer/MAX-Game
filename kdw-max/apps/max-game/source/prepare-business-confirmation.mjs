import fs from 'node:fs';
import {createHash} from 'node:crypto';
const source=new URL('./',import.meta.url),input=new URL('../../../UI/new_screens/busines_no_sort/Snack Body.svg',source);
const bytes=fs.readFileSync(input),assets={};
function put(name,data,width,height,origin){
 const assetId='kdw.business-confirmation.'+name,path='assets/kdw-native/business-confirmation/'+name+'.svg',target=new URL('client/public/'+path,source);
 fs.mkdirSync(new URL('./',target),{recursive:true});fs.writeFileSync(target,data);
 assets[assetId]={assetId,path,width,height,mimeType:'image/svg+xml',sha256:createHash('sha256').update(data).digest('hex'),origin};return assetId;
}
const panel=put('snack-body',bytes,455,78,{file:'Snack Body.svg',sha256:createHash('sha256').update(bytes).digest('hex')});
// Keep the existing scene envelope; only the exact authored snack is visible.
const canvas=put('canvas',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="895" height="559"/>'),895,559,{kind:'transparent-canvas'});
const box=[0,(559-895*78/455)/2,895,895*78/455];
fs.writeFileSync(new URL('client/src/kdw-business-confirmation.json',source),JSON.stringify({assets,screens:{'business.platform.ready':{width:895,height:559,source:'Snack Body.svg',components:[{assetId:panel,box}],bindings:[],actions:[[...box,'Продолжить']],canvas,forward:false}}},null,2)+'\n');
