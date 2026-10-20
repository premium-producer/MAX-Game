// Decorative only: one bounded canvas, driven by the existing activity clock.
// Grid cells brighten behind a falling card and fade after it has moved on.
export function createPostTrails(canvas){
 const ctx=canvas.getContext('2d'),cells=new Map();
 let lastTime=null,width=0,height=0,ratio=1;
 function clear(){cells.clear();lastTime=null;if(ctx)ctx.clearRect(0,0,width,height);}
 return {
  clear,
  draw(sources,time,scale,reduced){
   if(!ctx)return;
   const nextRatio=Math.min(devicePixelRatio||1,1.5);
   if(width!==innerWidth||height!==innerHeight||ratio!==nextRatio){
    width=innerWidth;height=innerHeight;ratio=nextRatio;
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);clear();
   }
   canvas.hidden=reduced;
   if(reduced){clear();return;}
   if(lastTime!==null&&time<lastTime)clear();
   const dt=lastTime===null?0:Math.min(100,time-lastTime);lastTime=time;
   const decay=Math.exp(-dt/260),pitch=Math.max(9,width*35/3591),tail=Math.max(100,520*scale);
   for(const [key,cell]of cells){cell.light*=decay;if(cell.light<.025)cells.delete(key);}
   for(const s of sources){
    if(s.y<0||s.y>height+tail)continue;
    const half=s.w*.52,cx=s.x+s.w/2;
    const x0=Math.max(0,Math.floor((cx-half)/pitch)),x1=Math.min(Math.ceil(width/pitch),Math.ceil((cx+half)/pitch));
    const y0=Math.max(0,Math.floor((s.y-tail)/pitch)),y1=Math.min(Math.ceil(height/pitch),Math.ceil((s.y+pitch)/pitch));
    for(let row=y0;row<=y1;row++)for(let col=x0;col<=x1;col++){
     const x=(col+.5)*pitch,y=(row+.5)*pitch,behind=Math.max(0,s.y-y)/tail;
     const across=Math.abs(x-cx)/(half*(1-.45*behind));
     if(across>=1||behind>=1)continue;
     const seed=((Math.imul(col+1,73856093)^Math.imul(row+1,19349663))>>>0)%101/100;
     const grain=.45+.55*seed,light=Math.pow(1-behind,1.4)*Math.pow(1-across, .7)*grain;
     const key=row*1000+col,old=cells.get(key);
     if(light>(old?.light??.025))cells.set(key,{x,y,light,seed});
    }
   }
   // Limits also hold for long authoring sessions and unusual viewports.
   while(cells.size>1800)cells.delete(cells.keys().next().value);
   ctx.clearRect(0,0,width,height);
   for(const {x,y,light,seed}of cells.values()){
    const size=pitch*(.18+.52*Math.sqrt(light)),color=seed>.68?'87,202,255':seed>.3?'151,102,255':'198,118,255';
    ctx.fillStyle=`rgba(${color},${light*.13})`;ctx.fillRect(x-size,y-size,size*2,size*2);
    ctx.fillStyle=`rgba(${color},${light*.85})`;ctx.fillRect(x-size/2,y-size/2,size,size);
   }
   canvas.dataset.cells=String(cells.size);
  },
 };
}
