export const GUIDED_ICON_SCALE=2;
export const GUIDED_ICON_SIZE=128*GUIDED_ICON_SCALE;

export function guidedIconGeometry(worldX,worldY,cameraX,hostHeight){
 const tile=GUIDED_ICON_SIZE;
 return {tile,width:tile,height:tile,left:worldX-cameraX-tile/2,top:hostHeight/2-100+worldY-tile/2};
}
