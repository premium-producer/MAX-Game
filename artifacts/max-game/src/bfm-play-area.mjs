import {WALL,FLAT_SCREEN,heightToPixel} from './circle-model.mjs';

// User-selected LiDAR/layout boundary; not a measured hardware calibration.
export const BFM_PLAY_AREA=Object.freeze({
 left:FLAT_SCREEN.left,right:FLAT_SCREEN.right,
 top:heightToPixel(1.8),bottom:heightToPixel(1),
});
export const BFM_STAGE=Object.freeze({width:1543,height:950});
// Fixed authored baseline (~540px including actions), verified in the real UI.
// Every phase shares this scale; content/activation cannot resize the game.
export const BFM_UI_REFERENCE_HEIGHT=540;
export function bfmStagePlacement(){
 const a=BFM_PLAY_AREA;
 return {x:(a.left+a.right)/2,y:(a.top+a.bottom)/2,
  scale:(a.bottom-a.top)/BFM_UI_REFERENCE_HEIGHT};
}

// Coordinate bridge only: the browser's CSS transform owns zoom and hit testing.
export function bfmViewportPlacement(width,height,layout='wall'){
 if(![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid BFM viewport');
 const zoom=layout==='lidar',a=zoom?BFM_PLAY_AREA:{left:0,right:WALL.width,top:0,bottom:WALL.height};
 const margin=zoom?24:0;
 const scale=Math.min(Math.max(1,width-2*margin)/(a.right-a.left),Math.max(1,height-2*margin)/(a.bottom-a.top));
 return {scale,x:width/2-(a.left+a.right)*scale/2,y:height/2-(a.top+a.bottom)*scale/2,
  backgroundWidth:WALL.width*scale,backgroundHeight:WALL.height*scale};
}
