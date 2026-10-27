import images from './kdw-business-images.json' with {type:'json'};
export const BUSINESS_CARD_IMAGES=Object.freeze(images);
export const businessCardImage=id=>images[id]??null;
// Keep decoded resources alive for falling cards, their flight clones and feed slots.
const decoded=new Map();
export function preloadBusinessImages(cards){
 return Promise.all(cards.map(card=>card.image).filter(Boolean).map(asset=>{
  if(!decoded.has(asset.path)){
   const image=new Image();image.src='./'+asset.path;
   let timeout;
   const ready=Promise.race([image.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Не удалось загрузить фотографии')),1500);})])
    .then(()=>image).catch(error=>{decoded.delete(asset.path);throw error;}).finally(()=>clearTimeout(timeout));
   decoded.set(asset.path,ready);
  }
  return decoded.get(asset.path);
 }));
}
