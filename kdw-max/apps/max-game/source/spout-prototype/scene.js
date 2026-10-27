'use strict';
const query=new URLSearchParams(location.search), layer=query.get('layer'); document.body.dataset.layer=layer;
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d',{alpha:layer==='content'});
const card=document.querySelector('#card'), epoch=Number(query.get('epoch'));
canvas.width=innerWidth; canvas.height=innerHeight;
function frame() {
 const w=canvas.width,h=canvas.height,t=(Date.now()-epoch)/1000;
 ctx.clearRect(0,0,w,h);
 if(layer==='background') {
   const gradient=ctx.createLinearGradient(0,0,w,h); gradient.addColorStop(0,'#100027');gradient.addColorStop(.5,'#24156b');gradient.addColorStop(1,'#102856');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   const cell=w/80; for(let y=0;y<h;y+=cell) for(let x=0;x<w;x+=cell) { const wave=(Math.sin(x/w*9+y/h*5+t*.7)+1)/2; ctx.fillStyle=`rgba(118,35,255,${.06+.32*wave})`;ctx.fillRect(x+5,y+5,cell-10,cell-10); }
 } else {
   card.style.transform=`translate(${Math.sin(t*.6)*w*.025}px,${Math.cos(t*.7)*h*.02}px)`;
   for(let i=0;i<10;i++) {ctx.beginPath();ctx.strokeStyle=`rgba(${65+i*15},65,255,${.18+i*.05})`;ctx.lineWidth=2+i*.25;ctx.moveTo(w*.15,h*.55);ctx.bezierCurveTo(w*.35,h*(.3+.12*Math.sin(t+i*.25)),w*.28,h*.7,w*.4,h*.5+i*3);ctx.stroke();}
   for(let i=0;i<90;i++) {const x=w*(.15+.7*((i/90+t*.03)%1)),y=h*(.6+.15*Math.sin(t+i*.4));const r=3+i%8; const g=ctx.createRadialGradient(x,y,0,x,y,r*3);g.addColorStop(0,'#54caff');g.addColorStop(1,'#54caff00');ctx.fillStyle=g;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);}
   // Fixed calibration patches: transparent outside, opaque red, 50% white.
   ctx.fillStyle='#ff0000';ctx.fillRect(w*.1,h*.8,80,80);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(w*.15,h*.8,80,80);
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
