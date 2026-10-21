// Pixel coordinates in the upright 1080×1920 capture; shared by every surface.
export const VISITOR_CAPTURE=Object.freeze({width:1080,height:1920,guide:Object.freeze({cx:540,cy:960,radius:500})});
export function visitorCrop(kind,{width,height,guide} = VISITOR_CAPTURE){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!guide||![guide.cx,guide.cy,guide.radius].every(Number.isFinite)||guide.radius<=0||guide.radius>Math.min(width,height)/2||guide.cx<guide.radius||guide.cx>width-guide.radius||guide.cy<guide.radius||guide.cy>height-guide.radius)throw new TypeError('Invalid upright photo/circular guide');
 if(kind==='circle')return {x:guide.cx-guide.radius,y:guide.cy-guide.radius,width:guide.radius*2,height:guide.radius*2};
 if(kind!=='call')throw new TypeError('Unknown visitor photo surface');
 const ratio=132/200,w=Math.min(width,height*ratio),h=w/ratio;
 return {x:Math.max(0,Math.min(width-w,guide.cx-w/2)),y:Math.max(0,Math.min(height-h,guide.cy-h/2)),width:w,height:h};
}
export function validVisitorPhoto(photo){
 try{visitorCrop('circle',photo);return typeof photo.dataUri==='string'&&photo.dataUri.length<6*1024*1024&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUri);}catch{return false;}
}
// Prepared SVGs are trusted local templates. Incoming photo bytes are data only.
// No transport, visitor persistence, or stela connection is implied by this API.
export function composeVisitorScreen(template,photo){
 if(!validVisitorPhoto(photo))throw new TypeError('Invalid visitor photo');
 let viewports=0,images=0;
 const svg=template.replace(/<svg data-visitor-viewport="(call|circle)"[^>]*>/g,(tag,kind)=>{
  viewports++;const r=visitorCrop(kind,photo);return tag.replace(/viewBox="[^"]*"/,`viewBox="${r.x} ${r.y} ${r.width} ${r.height}"`);
 }).replace(/<image data-visitor-photo="true"[^>]*\/>/g,()=>{
  images++;return `<image data-visitor-photo="true" width="${photo.width}" height="${photo.height}" href="${photo.dataUri}"/>`;
 });
 if(viewports!==1||images!==1)throw new TypeError('Invalid conversation template');
 return svg;
}
