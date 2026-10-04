import {ensureBrandFrame} from './brand-frame.js';
// VK Video 0.1.0. Original assets and hashes: assets/brands/vk-video/provenance.json.
export const VK_VIDEO=Object.freeze({blue:'#0077FF',red:'#FF2B42',neonBlue:'#0040FF',black:'#000000',white:'#FFFFFF'});
export const brandAsset=path=>new URL('./assets/brands/vk-video/'+path,import.meta.url).href;
export const BRAND_LOGO=brandAsset('assets/logos/vk-video-primary-white.svg');
export const BRAND_LOGO_ASPECT=357.3215637207031/76.6784439086914;
export let BRAND_LAYOUT;
let fontsReady;
export function ensureBrandFonts(){
 return fontsReady??=fetch(brandAsset('provenance.json')).then(r=>{if(!r.ok)throw Error('VK Video brand manifest: '+r.status);return r.json();}).then(async manifest=>{
  const layoutResponse=await fetch(new URL('./content/brand-layout.json',import.meta.url));
  if(!layoutResponse.ok)throw Error('VK Video layout: '+layoutResponse.status);
  BRAND_LAYOUT=await layoutResponse.json();
  const fonts=manifest.assets.filter(a=>a.assetId.startsWith('vk-sans-'));
  await ensureBrandFrame();
  await Promise.all(fonts.map(async asset=>{
   const existing=[...document.fonts].find(f=>f.family.replaceAll('"','')===asset.family&&f.weight===String(asset.weight)&&f.style===asset.fontStyle);
   const font=existing??new FontFace(asset.family,`url("${new URL('./'+asset.runtimePath,import.meta.url).href}")`,{weight:String(asset.weight),style:asset.fontStyle});
   await font.load();if(!existing)document.fonts.add(font);
  }));
 });
}
