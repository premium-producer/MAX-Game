// Pure projection: one motion pose drives WebGL, hit targets and optical masks.
export function scenePose(layout,motion,width,height){
 const scale=motion.size.value/layout.size;
 return {x:layout.hostX+motion.x.value-layout.cx*scale,y:layout.hostY+motion.y.value-layout.cy*scale,w:width*scale,h:height*scale,scale};
}
export function projectBounds(local,pose){return {x:pose.x+local.x*pose.scale,y:pose.y+local.y*pose.scale,w:local.w*pose.scale,h:local.h*pose.scale};}
