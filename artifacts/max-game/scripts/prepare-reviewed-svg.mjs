import sharp from 'sharp';

// Preserve the supplied XML verbatim except the explicitly recognized HTML
// paint wrappers. HTML foreignObject makes an SVG-backed WebGL image tainted.
const wrapper=/<foreignObject\b([^>]*)><div xmlns="http:\/\/www\.w3\.org\/1999\/xhtml" style="([^"]*)"><\/div><\/foreignObject>/g;
const blur=/^backdrop-filter:blur\([\d.]+px\);clip-path:url\(#[\w-]+\);height:100%;width:100%$/;
const conic=/^background:conic-gradient\(from 90deg,(.*)\);height:100%;width:100%;opacity:1$/;

export function assertCanvasSafeReviewedSvg(svg){
 const refs=[...svg.matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi)].map(m=>m[1]);
 const paints=[...svg.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)].map(m=>m[1]);
 if(/<foreignObject\b|<script\b/i.test(svg)||refs.some(ref=>!/^#[\w-]+$|^data:image\/(?:png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/.test(ref))||paints.some(ref=>!/^#[\w-]+$/.test(ref)))throw Error('REVIEWED_SVG_NOT_CANVAS_SAFE');
}

export function sampleConicStops(stops,angle){
 const normalized=(angle%360+360)%360;
 const right=stops.findIndex(s=>s.angle>=normalized);
 const a=stops[Math.max(0,right-1)],b=stops[right<0?stops.length-1:right];
 const t=a===b?0:(normalized-a.angle)/(b.angle-a.angle);
 return a.color.map((v,i)=>Math.round(v+(b.color[i]-v)*t));
}

function readStops(text){
 const stop=/rgba\((\d+), (\d+), (\d+), ([\d.]+)\) ([\d.]+)deg/g;
 const matches=[...text.matchAll(stop)];
 if(matches.map(m=>m[0]).join(',')!==text)throw Error('REVIEWED_SVG_UNSUPPORTED_CONIC_STOPS');
 const stops=matches.map(m=>({color:[+m[1],+m[2],+m[3],Math.round(+m[4]*255)],angle:+m[5]}));
 if(stops.length<2||stops[0].angle!==0||stops.at(-1).angle!==360||stops.some((s,i)=>!Number.isFinite(s.angle)||s.color.some(v=>!Number.isFinite(v)||v<0||v>255)||i&&s.angle<=stops[i-1].angle))throw Error('REVIEWED_SVG_UNSUPPORTED_CONIC_STOPS');
 return stops;
}

export async function prepareReviewedSvg(source,{allowConic=false}={}){
 const blocks=[...source.matchAll(/<foreignObject\b[\s\S]*?<\/foreignObject>/g)];
 const known=[...source.matchAll(wrapper)];
 if(blocks.length!==known.length||blocks.some((m,i)=>m[0]!==known[i][0]))throw Error('REVIEWED_SVG_UNSUPPORTED_FOREIGN_OBJECT');
 let prepared='',cursor=0,removedBlurCount=0,convertedConicCount=0;
 const edits=[];
 for(const match of known){
  let replacement='';
  if(blur.test(match[2]))removedBlurCount++;
  else{
   const gradient=conic.exec(match[2]);
   if(!allowConic||!gradient)throw Error('REVIEWED_SVG_UNSUPPORTED_FOREIGN_OBJECT');
   const bounds=/^ x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"$/.exec(match[1]);
   if(!bounds||bounds.slice(1).some(n=>!Number.isFinite(+n))||+bounds[3]<=0||+bounds[4]<=0)throw Error('REVIEWED_SVG_UNSUPPORTED_CONIC_BOUNDS');
   const stops=readStops(gradient[1]),size=512,rgba=Buffer.alloc(size*size*4);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    // CSS from 90deg: the positive X axis is the first stop, clockwise.
    const angle=Math.atan2(y+.5-size/2,x+.5-size/2)*180/Math.PI;
    rgba.set(sampleConicStops(stops,angle),(y*size+x)*4);
   }
   const png=await sharp(rgba,{raw:{width:size,height:size,channels:4}}).png({compressionLevel:9,adaptiveFiltering:false}).toBuffer();
   replacement=`<image${match[1]} preserveAspectRatio="none" href="data:image/png;base64,${png.toString('base64')}"/>`;
   convertedConicCount++;
  }
  edits.push({offset:match.index,original:match[0],replacement});
  prepared+=source.slice(cursor,match.index)+replacement;cursor=match.index+match[0].length;
 }
 prepared+=source.slice(cursor);
 assertCanvasSafeReviewedSvg(prepared);
 return {svg:prepared,removedBlurCount,convertedConicCount,edits};
}
