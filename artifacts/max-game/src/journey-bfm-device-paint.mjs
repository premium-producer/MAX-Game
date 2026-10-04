// Native Canvas2D draws a cached bezel and its light, then Three moves both together.
export const BFM_PHONE_LIGHT_PAD=72;
export function paintBfmPhone(ctx,width,height,radius,rasterScale=2){
 const pad=BFM_PHONE_LIGHT_PAD;
 ctx.save();ctx.beginPath();ctx.roundRect(pad,pad,width,height,radius);
 ctx.fillStyle='#0D001A';
 ctx.shadowColor='#471AFF66';ctx.shadowBlur=56*rasterScale;ctx.fill();
 const edge=ctx.createLinearGradient(pad,pad,pad+width,pad+height);
 edge.addColorStop(0,'#00BFFF99');edge.addColorStop(.48,'#471AFF88');edge.addColorStop(1,'#9500FF99');
 ctx.strokeStyle=edge;ctx.lineWidth=1.5;
 ctx.shadowColor='#6E1AFF88';ctx.shadowBlur=10*rasterScale;ctx.stroke();
 ctx.restore();
}
