export function wallLayout(width,height){
 const k=Math.min(width/4096,height/1280);
 const gameHeight=760*k,gameWidth=gameHeight*16/9;
 return {scale:gameHeight/1080,left:(width-gameWidth)/2+gameWidth*2/3,top:height-56*k-gameHeight,width:gameWidth,height:gameHeight};
}
