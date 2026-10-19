// Stretch straight edges and the face, keeping the authored bezel corners and
// light padding in logical pixels even while a retained device changes size.
export function deviceFrameSlices(width,height,nextWidth,nextHeight,pad,radius){
 const cut=pad+Math.min(radius,width/2,height/2);
 const nextCut=pad+Math.min(radius,nextWidth/2,nextHeight/2);
 const axis=(size,border)=>[0,border,size-border,size];
 const sx=axis(width+2*pad,cut),sy=axis(height+2*pad,cut);
 const dx=axis(nextWidth+2*pad,nextCut),dy=axis(nextHeight+2*pad,nextCut);
 return Array.from({length:9},(_,i)=>{
  const col=i%3,row=Math.floor(i/3);
  return {u0:sx[col]/sx[3],u1:sx[col+1]/sx[3],v0:1-sy[row+1]/sy[3],v1:1-sy[row]/sy[3],
   x:dx[col]-pad,y:dy[row]-pad,w:dx[col+1]-dx[col],h:dy[row+1]-dy[row]};
 });
}
