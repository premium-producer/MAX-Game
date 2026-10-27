// Same seeded grid as the previous Canvas effect; bounded GPU instances replace
// per-frame Canvas rasterisation and texture uploads. Time comes from the card clock.
export function createActivityTrails(){
 const cells=new Map();let stamp='',last=null;
 const clear=()=>{cells.clear();last=null;};
 return {clear,update(sources,time,width,height,scale,reduced=false){
  const geometry=`${width}:${height}:${scale}`;if(geometry!==stamp||time<last){clear();stamp=geometry;}
  if(reduced){clear();return [];}
  const dt=last===null?0:Math.min(100,Math.max(0,time-last)),pitch=Math.max(9,width*35/3591),tail=Math.max(100,520*scale);
  if(last!==time){last=time;const decay=Math.exp(-dt/260);
   for(const [key,c]of cells){c.light*=decay;if(c.light<.025)cells.delete(key);}
   for(const s of sources){if(s.y<0||s.y>height+tail)continue;const half=s.w*.52,cx=s.x+s.w/2;
    for(let row=Math.max(0,Math.floor((s.y-tail)/pitch));row<=Math.min(Math.ceil(height/pitch),Math.ceil((s.y+pitch)/pitch));row++)
    for(let col=Math.max(0,Math.floor((cx-half)/pitch));col<=Math.min(Math.ceil(width/pitch),Math.ceil((cx+half)/pitch));col++){
     const x=(col+.5)*pitch,y=(row+.5)*pitch,behind=Math.max(0,s.y-y)/tail,across=Math.abs(x-cx)/(half*(1-.45*behind));if(across>=1||behind>=1)continue;
     const seed=((Math.imul(col+1,73856093)^Math.imul(row+1,19349663))>>>0)%101/100,light=(1-behind)**1.4*(1-across)**.7*(.45+.55*seed),key=row*1000+col;
     if(light>(cells.get(key)?.light??.025))cells.set(key,{x,y,seed,light});
    }
   }
   while(cells.size>1800)cells.delete(cells.keys().next().value);
  }
  const quads=[];for(const {x,y,seed,light}of cells.values()){
   const size=pitch*(.18+.52*Math.sqrt(light)),color=seed>.68?'#57caff':seed>.3?'#9766ff':'#c676ff';
   quads.push({x:x-size,y:y-size,w:size*2,h:size*2,color,opacity:light*.13},{x:x-size/2,y:y-size/2,w:size,h:size,color,opacity:light*.85});
  }return quads;
 }};
}
