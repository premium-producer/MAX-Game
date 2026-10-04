// Native CanvasGradient paints the same two layers as BFM v4's .tile CSS.
// Three CanvasTexture uploads this once; the original WebGL owner moves it.
// No emissive white highlight, shader halo, or independent motion clock.
export function createBfmGradientMap(source){
 const map=source.clone();
 map.center.set(.5,.5);
 // Native Three UV transform: the square's diagonal fits inside the texture
 // at every angle. The separate rounded alphaMap keeps its original UVs.
 map.repeat.setScalar(Math.SQRT1_2);
 return map;
}

export function paintBfmTile(ctx,width,height,radius){
 ctx.save();ctx.beginPath();ctx.roundRect(0,0,width,height,radius);ctx.clip();
 const angle=125*Math.PI/180,dx=Math.sin(angle),dy=-Math.cos(angle);
 const length=Math.abs(width*dx)+Math.abs(height*dy),cx=width/2,cy=height/2;
 const base=ctx.createLinearGradient(cx-dx*length/2,cy-dy*length/2,cx+dx*length/2,cy+dy*length/2);
 base.addColorStop(.08,'#404dff');base.addColorStop(.55,'#6c18ff');base.addColorStop(1,'#ad00ff');
 ctx.fillStyle=base;ctx.fillRect(0,0,width,height);
 // CSS radial-gradient(ellipse at 5% 100%, #00caff 0, transparent 68%).
 const x=width*.05,y=height,rx=width*.95*Math.SQRT2,ry=height*Math.SQRT2;
 ctx.translate(x,y);ctx.scale(rx,ry);
 const radial=ctx.createRadialGradient(0,0,0,0,0,1);
 radial.addColorStop(0,'#00caff');radial.addColorStop(.68,'#00caff00');
 ctx.fillStyle=radial;ctx.fillRect(-x/rx,-y/ry,width/rx,height/ry);
 ctx.restore();
}
