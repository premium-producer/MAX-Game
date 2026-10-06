import glyphs from '../public/webgl-v5/icon-glyphs/manifest.json' with {type:'json'};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function v5IconAsset(catalog,role){
 const id=catalog.tasks[role]?.iconAssetId??catalog.missions[role]?.iconAssetId??catalog.uiIcons?.[role]??catalog.uiIcons?.fallback;
 const asset=catalog.assets[id],glyph=glyphs[id];
 if(!asset||!glyph||asset.sha256!==glyph.sourceSha256)throw Error(`V5_ICON_RELEASE_MISMATCH: ${role}`);
 return {asset,glyph};
}
export function v5IconImage(catalog,role,size=32){
 const {glyph}=v5IconAsset(catalog,role);
 return `<img class="v5-catalog-glyph" draggable="false" alt="" aria-hidden="true" src="./${esc(glyph.path)}" style="width:${size}px;height:${size}px">`;
}
export function v5IconTile(catalog,role,size=256,classes='tile glass-control'){
 const {asset,glyph}=v5IconAsset(catalog,role),ratio=glyph.radiusRatio??.26;
 const imageSize=asset.hasEmbeddedLabel||role==='fallback'?size:size*.6;
 return `<span class="${classes}" data-icon-asset="${esc(asset.assetId)}" style="width:${size}px;height:${size}px;border-radius:${size*ratio}px;padding:0;position:relative"><span style="position:absolute;left:${(size-imageSize)/2}px;top:${(size-imageSize)/2}px;width:${imageSize}px;height:${imageSize}px">${v5IconImage(catalog,role,imageSize)}</span></span>`;
}
export const v5IconUrls=()=>Object.values(glyphs).map(g=>'./'+g.path);
