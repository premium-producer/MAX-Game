const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export function networkBackLimits({width,height,w,h,top=0,bottom=height}){
 const minX=14,minY=top+14;
 return {minX,maxX:Math.max(minX,width-w-14),minY,maxY:Math.max(minY,bottom-h-14)};
}

// A retained spring velocity can overshoot even when its goal is inside the band.
export function constrainBackMotion(state,limits){
 for(const [axis,min,max] of [['x',limits.minX,limits.maxX],['y',limits.minY,limits.maxY]]){
  const motion=state[axis],value=clamp(motion.value,min,max);
  if(value!==motion.value){motion.value=value;motion.velocity=0;}
 }
}

// Local host coordinates, including the complete button hit target.
export function networkBackTarget(nodes,size,time=0,reduced=false){
 if(!nodes.length)return null;
 const {w,h}=size,{minX,maxX,minY,maxY}=networkBackLimits(size);
 // The horizontal and vertical extremes may belong to different icons.
 const left=Math.min(...nodes.map(node=>node.x)),top=Math.min(...nodes.map(node=>node.y));
 const x=clamp(left-w-18,minX,maxX),y=clamp(top-h-18,minY,maxY);
 return {x:clamp(x+(reduced?0:Math.sin(time*.85)*2),minX,maxX),y:clamp(y+(reduced?0:Math.sin(time*1.05+.7)*3),minY,maxY)};
}
