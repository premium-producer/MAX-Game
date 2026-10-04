/* Local Figma plugin. UI contains the offline source renderer; sandbox owns nodes. */
figma.showUI(__html__,{width:540,height:720,themeColors:true});
figma.root.setRelaunchData({open:'Собрать экраны MAX из исходников игры'});
let run=null;
function decode(url){
 const input=url.slice(url.indexOf(',')+1),chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',out=[];
 let bits=0,value=0;for(const c of input){if(c==='=')break;const n=chars.indexOf(c);if(n<0)continue;value=(value<<6)|n;bits+=6;if(bits>=8){bits-=8;out.push((value>>bits)&255);}}
 return new Uint8Array(out);
}
function raster(parent,name,url,x,y,w,h){
 if(typeof url!=='string'||!url.startsWith('data:image/png;base64,')||url.length>24000000)throw Error('Некорректный PNG');
 const n=figma.createRectangle();parent.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;
 n.fills=[{type:'IMAGE',scaleMode:'FILL',imageHash:figma.createImage(decode(url)).hash}];return n;
}
async function findFonts(){
 const fonts=await figma.listAvailableFontsAsync(),available=fonts.filter(f=>f.fontName.family.toLowerCase()==='max sans');
 const found={};for(const [weight,pattern] of [['400',/regular/i],['500',/medium/i],['600',/demi|semi/i]]){
  const font=available.find(f=>pattern.test(f.fontName.style))?.fontName;
  if(font){try{await figma.loadFontAsync(font);found[weight]=font;}catch{/* Exact raster remains available. */}}
 }
 return found;
}
function color(css){const values=css.match(/[\d.]+/g)?.map(Number)||[255,255,255];return {r:values[0]/255,g:values[1]/255,b:values[2]/255};}
async function appendScreen(s){
 if(!run||run.count>=run.total||!Number.isInteger(s.width)||s.width<1600||s.width>3600||s.height!==1000||!Array.isArray(s.layers)||s.layers.length>1200)throw Error('Некорректное состояние экрана');
 let g=run.groups.get(s.group);
 if(!g){
  const frame=figma.createFrame();run.page.appendChild(frame);frame.name=s.group;frame.fills=[];frame.clipsContent=false;
  frame.x=run.origin.x+run.groups.size*(run.groupWidth+240);frame.y=run.origin.y;frame.resize(run.groupWidth,1000);g={frame,count:0};run.groups.set(s.group,g);
 }
 const frame=figma.createFrame();g.frame.appendChild(frame);frame.name=s.name;frame.resize(s.width,s.height);frame.clipsContent=true;
 frame.x=(g.count%3)*(run.cellWidth+80);frame.y=Math.floor(g.count/3)*1080;frame.fills=[];
 try{
  frame.setPluginData('max-source',JSON.stringify({edition:s.edition,id:s.id,mission:s.mission,kind:s.kind,step:s.step,stage:s.stage,branch:s.branch,device:s.device,media:s.media,revision:run.revision}));
  raster(frame,'WebGL · фон, Frost, волокна и поверхности',s.base,0,0,s.width,s.height);
  for(const part of s.layers){
   if(![part.x,part.y,part.w,part.h,part.opacity].every(Number.isFinite)||part.w<=0||part.h<=0)throw Error('Некорректная геометрия слоя');
   let n;
   if(part.kind==='svg'){
    n=figma.createNodeFromSvg(part.svg);frame.appendChild(n);n.name='SVG · '+(part.svg.match(/data-icon="([^"]+)/)?.[1]||'исходник игры');n.resize(part.w,part.h);n.x=part.x;n.y=part.y;
   }else if(part.kind==='text'&&run.editable&&run.fonts[part.weight]){
    n=figma.createText();frame.appendChild(n);n.fontName=run.fonts[part.weight];n.fontSize=part.fontSize;n.characters=part.text;n.name=part.text;
    n.textAutoResize='WIDTH_AND_HEIGHT';n.fills=[{type:'SOLID',color:color(part.color)}];n.x=part.x+4;n.y=part.y+4;
    const ls=parseFloat(part.letterSpacing);if(Number.isFinite(ls))n.letterSpacing={unit:'PIXELS',value:ls};
   }else{
    n=raster(frame,part.kind==='text'?part.text:'Изображение из игры',part.png,part.x,part.y,part.w,part.h);
    if(part.kind==='text')n.setPluginData('text',JSON.stringify({characters:part.text,fontFamily:'Max Sans',fontSize:part.fontSize,weight:part.weight}));
   }
   n.opacity=Math.max(0,Math.min(1,part.opacity));
  }
  if(run.reference){const n=raster(frame,'Эталон · полный кадр игры (включить для сравнения)',s.reference,0,0,s.width,s.height);n.visible=false;n.locked=true;}
  frame.setRelaunchData({open:'Создать новый набор экранов'});
  g.count++;g.frame.resize(run.groupWidth,Math.ceil(g.count/3)*1080);run.count++;
  figma.ui.postMessage({type:'screen-added',id:s.id,count:run.count});
 }catch(e){frame.remove();throw e;}
}
figma.ui.onmessage=async m=>{
 try{
  if(m.type==='review-init'){figma.ui.postMessage({type:'review-init',fileKey:reviewFileKey(),pageName:figma.currentPage.name});}
  else if(m.type==='review-cancel'){reviewCancelled=true;}
  else if(m.type==='review-export'){await exportReview(m);}
  else if(m.type==='start'){
   if(reviewBusy)throw Error('Дождитесь экспорта комментариев');
   if(run)throw Error('Предыдущий набор ещё создаётся');
   if(!Number.isInteger(m.total)||m.total<1||m.total>450)throw Error('Нужно от 1 до 450 экранов');
   const page=figma.currentPage;
   const fonts=m.editable?await findFonts():{};
   const bounds=page.children.map(n=>n.absoluteRenderBounds||n.absoluteBoundingBox).filter(Boolean);
   const origin=bounds.length?{x:Math.max(...bounds.map(b=>b.x+b.width))+240,y:Math.min(...bounds.map(b=>b.y))}:{x:figma.viewport.center.x,y:figma.viewport.center.y};
   const cellWidth=Math.max(1600,Math.min(3600,Number(m.maxWidth)||1600));
   run={page,origin,total:m.total,count:0,groups:new Map(),fonts,editable:m.editable,reference:m.reference,revision:m.revision,cellWidth,groupWidth:3*cellWidth+160};
   figma.ui.postMessage({type:'started',fontAvailable:!!fonts['400']});
  }else if(m.type==='screen'){await appendScreen(m.screen);}
  else if(m.type==='finish'||m.type==='cancel'){
   if(run){
    const first=[...run.groups.values()][0]?.frame;
    if(first&&figma.currentPage===run.page){run.page.selection=[first];figma.viewport.scrollAndZoomIntoView(first.children.slice(0,3));}
    const count=run.count;run=null;figma.ui.postMessage({type:'finished',count,cancelled:m.type==='cancel'});
    figma.notify(m.type==='cancel'?`Остановлено. Сохранено экранов: ${count}`:`Готово: ${count} экранов MAX`);
   }
  }
 }catch(error){figma.ui.postMessage({type:m.type==='review-export'?'review-error':'error',requestId:m.requestId,error:error.message});}
};
