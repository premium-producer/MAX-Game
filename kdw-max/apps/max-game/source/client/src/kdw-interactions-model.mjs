import {applyBusinessAll} from './kdw-business-all-model.mjs';
import finalQrAssets from './kdw-final-qr-assets.json' with {type:'json'};
import {applyBusinessChoice} from './kdw-business-choice.mjs';
import {applyOriginalCafe} from './kdw-business-original.mjs';
import {applyBusinessNative} from './kdw-business-native-model.mjs';
import {applyBusinessScreens} from './kdw-business-screens.mjs';
import {applyConversationScreens,applyHighQualityScreens} from './kdw-conversation-model.mjs';
import {applyVisitorDetails} from './kdw-visitor-details.mjs';
import {applyPersonalChannel} from './kdw-personal-channel-model.mjs';
import {applyPostsCatalog} from './kdw-posts-model.mjs';
import {applyNativeStore} from './kdw-native-store.mjs';
import {applyReviewedTexts} from './kdw-text-updates.mjs';
import {applyTransitionActions} from './kdw-transition-actions.mjs';
import {applyCompletionCopy} from './kdw-completion-copy.mjs';
import {applyClientCopy} from './kdw-client-copy.mjs';
export const KDW_ITERATION='KDW-MAX-R9-STAND-20261018';
export const CHANNEL_LIMITS=Object.freeze({name:64,description:160});
export const COFFEE_PRODUCTS=Object.freeze([
 {id:'ethiopia',name:'Эфиопия Сидамо',price:340,crop:[428,108,147,85]},
 {id:'brazil',name:'Бразилия Сантос',price:360,crop:[600,108,120,75]},
 {id:'colombia',name:'Колумбия Супремо',price:320,crop:[428,256,147,88]},
 {id:'guatemala',name:'Гватемала Антигуа',price:390,crop:[600,258,120,78]},
]);
export const STORE_SLOTS=6;
export const CHANNEL_AVATARS=Object.freeze(['cat','game','island','heart']);
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const exact=(value,keys)=>plain(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
export function interactionKind(taskId){return taskId==='blogger.channel'?'channel':taskId==='business.store'?'store':null;}
export function emptyInteraction(kind){return kind==='channel'?{name:'',description:'',avatar:'cat'}:{slots:Array(STORE_SLOTS).fill(null)};}
export function validateInteraction(kind,value){
 if(kind==='channel'){
  if(!exact(value,['name','description','avatar'])||typeof value.name!=='string'||typeof value.description!=='string'||value.name.length>CHANNEL_LIMITS.name||value.description.length>CHANNEL_LIMITS.description||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value.name+value.description)||/[\r\n]/.test(value.name)||!CHANNEL_AVATARS.includes(value.avatar))return false;
  return true;
 }
 if(kind==='store'){
  if(!exact(value,['slots'])||!Array.isArray(value.slots)||value.slots.length!==STORE_SLOTS||value.slots.some(id=>id!==null&&!COFFEE_PRODUCTS.some(p=>p.id===id)))return false;
  const chosen=value.slots.filter(Boolean);return new Set(chosen).size===chosen.length;
 }
 return false;
}
export function interactionComplete(kind,value){return validateInteraction(kind,value)&&(kind==='channel'?value.name.trim().length>=2:value.slots.some(Boolean));}
export function placeProduct(slots,productId,index){
 if(!Number.isInteger(index)||index<0||index>=STORE_SLOTS||!COFFEE_PRODUCTS.some(p=>p.id===productId))return [...slots];
 const next=[...slots],previous=next.indexOf(productId);if(previous!==-1&&previous!==index)next[previous]=null;next[index]=productId;return next;
}
export function createKdwCatalog(base,{businessScreens='custom'}={}){const catalog=applyBusinessNative(applyVisitorDetails(applyConversationScreens(applyBusinessScreens(applyPersonalChannel(applyPostsCatalog(applyBusinessChoice(applyNativeStore(applyReviewedTexts(structuredClone(base))))))))));if(businessScreens==='original')applyOriginalCafe(catalog,base);else applyBusinessAll(catalog);applyHighQualityScreens(catalog);applyClientCopy(catalog);applyTransitionActions(catalog);applyCompletionCopy(catalog);catalog.contentRevision=base.contentRevision+'.kdw-r9-stand'+(businessScreens==='original'?'.cafe-original-v1':'.business-all-v1');catalog.contentRevision+='.hq20261028';catalog.kdwInteractions=KDW_ITERATION;Object.assign(catalog.assets,finalQrAssets);for(const [id,mission]of Object.entries(catalog.missions))if(mission.qr)mission.qr.assetId=id==='business'?'official.business-qr-20261028':'official.download-qr-20261028';return catalog;}
export function keyboardEdit(value,start,end,key,{limit=160}={}){
 start=Math.min(value.length,Math.max(0,start));end=Math.min(value.length,Math.max(start,end));
 if(key==='backspace'&&start===end&&start>0){const segments=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value.slice(0,start))];start=segments.at(-1)?.index??0;key='';}
 else if(key==='backspace')key='';
 const text=value.slice(0,start)+key+value.slice(end);
 return text.length>limit?{value,caret:end}:{value:text,caret:start+key.length};
}
