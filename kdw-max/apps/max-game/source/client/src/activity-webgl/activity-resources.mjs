import * as THREE from 'three';
import {typographyText} from '../kdw-typography.mjs';
import {postPhoto} from '../kdw-posts-model.mjs';
import {businessProfile} from '../kdw-business-profile.mjs';
import {wrapText,textureBytes} from './activity-model.mjs';
const pause=()=>new Promise(r=>setTimeout(r,0));
const font=(size,weight=400,family='Max Sans')=>`${weight} ${size}px "${family}",Arial,sans-serif`;
function canvas(w,h){const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;}
function rounded(ctx,x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function block(ctx,text,x,y,width,size,line,weight,color,family='Max Sans'){
 ctx.font=font(size,weight,family);ctx.fillStyle=color;ctx.textBaseline='top';const lines=wrapText(ctx,typographyText(text),width);for(const t of lines){ctx.fillText(t,x,y);y+=line;}return y;
}
function surface(kind,card,stored){
 const w=stored?(kind==='posts'?315.25:182):440,scratch=canvas(w,1),measure=scratch.getContext('2d');
 let y=0,photo,metrics=null;const commands=[];
 const text=(value,x,width,size,line,weight,color,family='Max Sans',gap=0)=>{y+=gap;const top=y;measure.font=font(size,weight,family);y+=wrapText(measure,typographyText(value),width).length*line;commands.push(c=>block(c,value,x,top,width,size,line,weight,color,family));};
 if(!stored){photo={x:12,y:12,w:416,h:kind==='posts'?220:260,radius:28};y=photo.y+photo.h;
  text(card.title??card.name,28,384,30,36,kind==='posts'?600:500,'#fff','Max Sans',20);
  if(kind==='store')text(card.price.toLocaleString('ru-RU')+' ₽',28,384,34,41,600,'#fff','Max Sans',10);
  text(kind==='posts'?card.body:card.description,kind==='posts'?32:28,kind==='posts'?376:384,kind==='posts'?23:21,kind==='posts'?28.75:26.25,400,'#e4d7ee','Max Sans',kind==='posts'?10:8);
  if(kind==='posts')text('♡  Опубликовать',32,376,20,32,400,'#d6b8ff','Max Sans',14);y+=kind==='posts'?35:36;
 }else if(kind==='posts'){
  photo={x:0,y:0,w,h:210.17,radius:18};y=photo.h;
  text(card.title,10,w-20,18,22.5,400,'#d4d4d6','Arial',9);
  text(card.body,10,w-20,18,22.5,400,'#d4d4d6','Arial',24);y+=12;
  metrics={reactionY:y,metaY:y+36};const ry=y;commands.push(c=>{rounded(c,10,ry,98,35,18,'#535665');rounded(c,113,ry,85,35,18,'#535665');});y+=56;
 }else{
  photo={x:8,y:8,w:w-16,h:(w-16)*5/8,radius:12};y=photo.y+photo.h;
  text(card.price.toLocaleString('ru-RU')+' ₽',8,w-16,18,23,600,'#111','Arial',8);
  text(card.name??card.title,8,w-16,12,15,400,'#303039','Arial',2);
  text(card.description??'',8,w-16,10,13,400,'#777','Arial',6);y=Math.max(229,y+8);
  const by=y;commands.push(c=>{rounded(c,8,by,w-16,33,9,'#2c2c2c');c.font=font(11,400,'Arial');c.fillStyle='#fff';c.textAlign='center';c.fillText('Подробнее',w/2,by+10);c.textAlign='left';});y+=41;
 }
 const rasterScale=stored?1:2,c=canvas(w*rasterScale,y*rasterScale),ctx=c.getContext('2d');ctx.scale(rasterScale,rasterScale);rounded(ctx,0,0,w,y,stored?(kind==='posts'?18:20):40,stored?(kind==='posts'?'#36394e':'#fff'):'#0D001A');for(const draw of commands)draw(ctx);
 return{canvas:c,w,h:y,photo,metrics};
}
async function image(url){const img=new Image();img.decoding='async';img.src=url;let timer;try{await Promise.race([img.decode(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Image timeout')),4000))]);return img;}finally{clearTimeout(timer);}}
function photoCanvas(img,card,kind){
 const ratio=img?Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight)):1,c=canvas(img?img.naturalWidth*ratio:440,img?img.naturalHeight*ratio:260),ctx=c.getContext('2d');
 ctx.fillStyle=kind==='store'?'#e9e6df':'#362e74';ctx.fillRect(0,0,c.width,c.height);
 if(img)ctx.drawImage(img,0,0,c.width,c.height);else{ctx.font=font(72);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(card.emoji??'MAX',c.width/2,c.height*.6);}return c;
}
export function createActivityResources(kind,type,bank,{imageOnly=true,countGoal=false}={}){
 const textures=[],records=new Map(),extras=new Map(),stats={bytes:0,rasters:0,uploads:0,uploadMs:0,fallbacks:0};let disposed=false,decoded=false,failure=null,upload=0;
 const add=(c)=>{if(disposed)return null;const bytes=textureBytes(c.width,c.height);if(stats.bytes+bytes>160*1024*1024)throw Error('Activity texture budget exceeded');const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;stats.bytes+=bytes;stats.rasters++;textures.push(t);return t;};
 const ready=(async()=>{
  await Promise.race([document.fonts.load('600 30px "Max Sans"'),new Promise(r=>setTimeout(r,4000))]);
  for(const card of bank){if(disposed)return;let img=null;const asset=card.image??(kind==='posts'?postPhoto(card.photo):null);
   try{if(asset)img=await image('./'+asset.path);else if(card.crop){const sheet=await image('./assets/kdw-r7/catalog-reference.png'),[x,y,w,h]=card.crop,c=canvas(w,h);c.getContext('2d').drawImage(sheet,x,y,w,h,0,0,w,h);img=await image(c.toDataURL());}}catch{stats.fallbacks++;}
   if(disposed)return;
   const stored=surface(kind,card,true),p=photoCanvas(img,card,kind);
   // Keep the destination photo's aspect ratio, without any text surface in flight.
   const h=440*stored.photo.h/stored.photo.w;
   const fall=imageOnly?{w:440,h,photo:{x:0,y:0,w:440,h,radius:28}}:surface(kind,card,false);
   records.set(card.id,{card,fall:{...fall,texture:fall.canvas?add(fall.canvas):null},stored:{...stored,texture:add(stored.canvas)},photo:add(p),fit:kind==='store'?2:1});await pause();
  }
  const urls=kind==='posts'?{header:'./assets/kdw-native/posts-chrome/header.svg',footer:'./assets/kdw-native/posts-chrome/composer.svg',fire:'./assets/kdw-native/posts-chrome/fire.svg',heart:'./assets/kdw-native/posts-chrome/heart.svg',views:'./assets/kdw-native/posts-chrome/views.svg',verified:'./assets/kdw-native/posts-chrome/verified.svg',avatar:businessProfile(type).logo?'./'+businessProfile(type).logo:null}:{header:'./assets/kdw-native/store-header.svg'};
  for(const [name,url]of Object.entries(urls)){if(!url)continue;try{const img=await image(url);if(disposed)return;const c=canvas(Math.min(780,img.naturalWidth),Math.min(280,img.naturalHeight));c.getContext('2d').drawImage(img,0,0,c.width,c.height);extras.set(name,add(c));}catch{stats.fallbacks++;}}
  if(disposed)return;
  const glyphs=canvas(1024,384),ctx=glyphs.getContext('2d'),chars=[...new Set('0123456789.,: · +−—₽★♡КMAXРейтингмагазинаподписчиковНовыеубликацПостыВыбрано/↑↓'+Object.values({name:businessProfile(type).name??type}).join(''))];
  ctx.font=font(30,400,'Arial');ctx.textBaseline='top';ctx.fillStyle='#fff';const atlas=new Map();chars.forEach((ch,i)=>{const x=(i%32)*32,y=Math.floor(i/32)*48;ctx.fillText(ch,x,y+4);atlas.set(ch,{x,y,w:32,h:48,advance:ctx.measureText(ch).width});});
  extras.set('glyphs',add(glyphs));extras.set('glyphMetrics',atlas);
  const white=canvas(1,1);white.getContext('2d').fillStyle='#fff';white.getContext('2d').fillRect(0,0,1,1);extras.set('white',add(white));
  // Static header copy shares the bank lifetime, not the changing counter clock.
  const label=canvas(390,140),lc=label.getContext('2d');if(kind==='posts'){lc.font=font(18,600,'Arial');lc.fillStyle='#d4d4d6';lc.textBaseline='top';lc.fillText(businessProfile(type).name??type,103.6,62,235);}else{lc.font=font(15,600,'Arial');lc.textBaseline='top';lc.fillStyle='#fff';lc.fillText(countGoal?'Товары в витрине:':'Рейтинг магазина:',87,102);}extras.set('label',add(label));decoded=true;
 })().catch(e=>{failure=e;console.error('MAX_ACTIVITY_RESOURCE',e.message);});
 return{records,extras,stats,ready,get prepared(){return decoded&&upload===textures.length;},get error(){return failure;},
  warm(renderer){if(disposed||!decoded||failure||renderer.getContext().isContextLost())return;const until=performance.now()+2;let count=0;try{while(upload<textures.length&&count++<2){const t=performance.now();renderer.initTexture(textures[upload]);upload++;stats.uploadMs+=performance.now()-t;stats.uploads++;if(performance.now()>=until)break;}}catch(e){failure=e;console.error('MAX_ACTIVITY_UPLOAD',e.message);}},
  invalidate(){upload=0;for(const t of textures)t.needsUpdate=true;},
  dispose(){disposed=true;for(const t of textures){t.dispose();t.image.width=t.image.height=1;}textures.length=0;records.clear();extras.clear();stats.bytes=0;},
 };
}
