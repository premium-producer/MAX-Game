import sharp from 'sharp';

// The original Figma vector has unsupported gradient/text export effects. Keep
// the accepted PNG as an unchanged base; reuse only its original vector photos
// over the two actual grey placeholders. No new artwork or UI reconstruction.
export async function fillReviewedBusinessPosts(sourceSvg,sourcePng){
 const {data,info}=await sharp(sourcePng).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const sx=info.width/871,sy=info.height/581;
 const regions=[[307.66,-10.9502,213.919,142.613,22,2],[307.66,296.065,213.919,142.613,19,3]];
 const definitions=[],layers=[],maskPixels=[];
 for(const [index,[x,y,w,h,patternId,imageId]] of regions.entries()){
  const pattern=sourceSvg.match(new RegExp(`<pattern id="pattern${patternId}_296_18120"[^>]*>[\\s\\S]*?<\\/pattern>`))?.[0];
  const image=sourceSvg.match(new RegExp(`<image id="image${imageId}_296_18120"[^>]*>`))?.[0];
  if(!pattern||!image)throw Error('BUSINESS_POST_SOURCE_STALE');
  const spans=[];let pixels=0;
  // Exact grey runs of at least 20 pixels isolate the placeholders and exclude
  // foreground cards and photos that overlap their bounding boxes.
  for(let row=Math.max(0,Math.floor(y*sy));row<Math.min(info.height,Math.ceil((y+h)*sy));row++){
   let start=null;
   const right=Math.min(info.width,Math.ceil((x+w)*sx));
   for(let col=Math.max(0,Math.floor(x*sx));col<=right;col++){
    const offset=(row*info.width+col)*4;
    const grey=col<right&&data[offset]===82&&data[offset+1]===82&&data[offset+2]===82&&data[offset+3]===255;
    if(grey&&start===null)start=col;
    if(!grey&&start!==null){if(col-start>=20){
     const previous=spans.at(-1),width=col-start;
     if(previous&&previous.x===start&&previous.width===width&&previous.y+previous.height===row)previous.height++;
     else spans.push({x:start,y:row,width,height:1});
     pixels+=width;
    }start=null;}
   }
  }
  if(pixels<10000)throw Error('BUSINESS_POST_PLACEHOLDER_STALE');
  maskPixels.push(pixels);
  definitions.push(pattern,image,`<mask id="post${index}" maskUnits="userSpaceOnUse" x="0" y="0" width="${info.width}" height="${info.height}"><g fill="white">${spans.map(s=>`<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"/>`).join('')}</g></mask>`);
  layers.push(`<g mask="url(#post${index})"><g transform="scale(${sx} ${sy})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pattern${patternId}_296_18120)"/></g></g>`);
 }
 const svg=`<svg width="${info.width}" height="${info.height}" viewBox="0 0 ${info.width} ${info.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${definitions.join('')}</defs><image id="accepted-composite" width="${info.width}" height="${info.height}" xlink:href="data:image/png;base64,${sourcePng.toString('base64')}"/>${layers.join('')}</svg>\n`;
 return {svg,width:info.width,height:info.height,maskPixels};
}
