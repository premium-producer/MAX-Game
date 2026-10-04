/* __CORE__ */
const CATALOG = [] /* __CATALOG__ */;
figma.showUI(__html__,{width:440,height:620,themeColors:true});
let run=null;
const color=(r,g,b)=>[{type:'SOLID',color:{r:r/255,g:g/255,b:b/255}}];
const post=message=>figma.ui.postMessage(message);
function done(cancelled=false){
  if(!run)return;
  const state=run;run=null;
  if(state.page&&figma.currentPage===state.page){
    state.page.selection=state.sections;
    if(state.sections.length)figma.viewport.scrollAndZoomIntoView(state.sections);
  }
  post({type:'done',count:state.index,total:state.jobs.length,cancelled});
}
function label(parent,text,x,y,width){
  const node=figma.createText();parent.appendChild(node);node.name=text;
  node.fontName={family:'Inter',style:'Regular'};node.fontSize=22;
  node.textAutoResize='HEIGHT';node.resize(width,30);node.characters=text;
  node.fills=color(236,232,249);node.x=x;node.y=y;return node;
}
figma.ui.onmessage=async msg=>{
  try{
    if(msg.type==='cancel'){done(true);return;}
    if(msg.type==='start'){
      if(run)throw Error('Импорт уже идёт');
      const plan=planScreens(CATALOG,msg.options),total=plan.reduce((n,g)=>n+g.rows.reduce((v,r)=>v+r.items.length,0),0);
      if(!total)throw Error('Для выбранного фильтра нет скриншотов');
      const state={id:msg.id,index:0,jobs:[],sections:[],page:figma.currentPage,center:{...figma.viewport.center}};run=state;
      await figma.loadFontAsync({family:'Inter',style:'Regular'});
      if(run!==state)return;
      const page=state.page;
      const bounds=page.children.map(n=>n.absoluteRenderBounds||n.absoluteBoundingBox||{x:n.x,y:n.y,width:n.width,height:n.height}).filter(b=>b&&[b.x,b.y,b.width,b.height].every(Number.isFinite));
      const origin=bounds.length?{x:bounds.reduce((v,b)=>Math.max(v,b.x+b.width),-Infinity)+240,y:bounds.reduce((v,b)=>Math.min(v,b.y),Infinity)}:state.center;
      for(const group of plan){
        const section=figma.createSection();page.appendChild(section);section.name=group.name;
        section.resizeWithoutConstraints(group.w,group.h);section.x=origin.x+group.x;section.y=origin.y+group.y;section.fills=color(25,20,44);state.sections.push(section);
        for(const row of group.rows){
          const child=figma.createSection();section.appendChild(child);child.name=row.title;
          child.resizeWithoutConstraints(row.w,row.h);child.x=row.x;child.y=row.y;child.fills=color(37,29,59);
          for(const entry of row.items)state.jobs.push({entry,parent:child});
        }
      }
      post({type:'need-image',id:state.id,file:state.jobs[0].entry.file,index:0,total});return;
    }
    if(msg.type==='image'){
      const state=run;
      if(!state||msg.id!==state.id||msg.index!==state.index)return;
      const job=state.jobs[state.index];if(msg.file!==job.entry.file)throw Error('Нарушена очередь изображений');
      const bytes=new Uint8Array(msg.bytes);
      const valid=bytes[0]===255&&bytes[1]===216||bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
      if(bytes.length<24||bytes.length>10000000||!valid)throw Error('Некорректное изображение '+msg.file);
      const hash=figma.createImage(bytes).hash,e=job.entry;
      const frame=figma.createFrame();job.parent.appendChild(frame);frame.name=e.title;
      frame.resize(e.w,e.h);frame.x=e.x;frame.y=e.y;frame.fills=[];frame.clipsContent=true;
      frame.setPluginData('source',JSON.stringify({file:e.file,url:e.url,width:e.width,height:e.height,state:e.state}));
      const image=figma.createRectangle();frame.appendChild(image);image.name=e.file;
      image.resize(e.w,e.h);image.x=0;image.y=0;
      image.fills=[{type:'IMAGE',imageHash:hash,scaleMode:'FIT'}];
      label(job.parent,e.title+'\n'+e.width+' × '+e.height,e.x,e.y+e.h+16,e.w);
      state.index++;
      if(state.index===state.jobs.length){done();return;}
      post({type:'need-image',id:state.id,file:state.jobs[state.index].entry.file,index:state.index,total:state.jobs.length});
    }
  }catch(error){
    const count=run?.index||0;done(true);
    post({type:'error',message:String(error.message||error),count});
  }
};
