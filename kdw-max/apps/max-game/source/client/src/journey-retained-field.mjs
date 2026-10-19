// DOM is an input/text-layout adapter. Preserve semantic owners across field
// updates; in particular a flying picker button becomes the field button.
export function fieldKey(el){
 if(el.dataset.object)return `object:${el.dataset.object}`;
 if(el.dataset.place&&el.dataset.flightActive)return `object:${el.dataset.place}`;
 if(el.hasAttribute('data-route-next'))return `next:${el.dataset.routeNext}`;
 if(el.matches('.network-back'))return 'navigation';
 return null;
}
export function retainField(host){
 const saved=new Map([...host.querySelectorAll('[data-object],[data-route-next],.network-back,[data-flight-active]')].map(el=>[fieldKey(el),el]).filter(([key])=>key));
 return ()=>{
  for(const fresh of host.querySelectorAll('[data-object],[data-route-next],.network-back')){
   const old=saved.get(fieldKey(fresh));if(!old||old===fresh)continue;
   const structural=old.className!==fresh.className||old.textContent!==fresh.textContent;
   const transform=old.style.transform,origin=old.style.transformOrigin,fade=old.dataset.uiFade;
   for(const attr of [...old.attributes])if(!['data-ui-fade','data-scene-version','data-scene-id'].includes(attr.name))old.removeAttribute(attr.name);
   for(const attr of fresh.attributes)old.setAttribute(attr.name,attr.value);
   old.style.transform=transform;old.style.transformOrigin=origin;
   if(fade!==undefined)old.dataset.uiFade=fade;
   if(structural){old.innerHTML=fresh.innerHTML;old.dataset.sceneVersion=String(Number(old.dataset.sceneVersion||0)+1);}
   fresh.replaceWith(old);
  }
 };
}
