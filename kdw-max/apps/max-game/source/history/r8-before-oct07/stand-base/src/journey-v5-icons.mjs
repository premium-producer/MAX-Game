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
export function v5IconTile(catalog,role,size=256,classes='tile glass-control',completed=false){
 const {asset,glyph}=v5IconAsset(catalog,role),ratio=glyph.radiusRatio??.26;
 const imageSize=asset.hasEmbeddedLabel||role==='fallback'?size:size*.6;
 return `<span class="${classes}" data-icon-asset="${esc(asset.assetId)}" style="width:${size}px;height:${size}px;border-radius:${size*ratio}px;padding:0;position:relative"><span style="position:absolute;left:${(size-imageSize)/2}px;top:${(size-imageSize)/2}px;width:${imageSize}px;height:${imageSize}px">${v5IconImage(catalog,role,imageSize)}</span>${completed?v5CompletionBadge():''}</span>`;
}
export const v5IconUrls=()=>Object.values(glyphs).map(g=>'./'+g.path);

// User-supplied Subtract.svg: white disc with a transparent check cutout.
// Inline vector uses the existing SVGLoader and inherits the icon's motion group.
export function v5CompletionBadge(){
 return `<svg class="v5-completion-check" aria-hidden="true" width="86" height="86" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:-28px;right:-28px;width:86px;height:86px;color:white;pointer-events:none"><path d="M20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0ZM31.4141 12.5859C30.633 11.8049 29.367 11.8049 28.5859 12.5859L17 24.1719L11.4141 18.5859C10.633 17.8049 9.36699 17.8049 8.58594 18.5859C7.80489 19.367 7.80489 20.633 8.58594 21.4141L15.5859 28.4141C16.367 29.1951 17.633 29.1951 18.4141 28.4141L31.4141 15.4141C32.1951 14.633 32.1951 13.367 31.4141 12.5859Z" fill="white"/></svg>`;
}
