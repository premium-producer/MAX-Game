import templates from '../src/kdw-template-media.json' with {type:'json'};
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import fs from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {guardImage,requestImageSource,imageSource,fallbackImageSource,fallbackForImage,TEMPLATE_PORTRAIT,TEMPLATE_AVATAR,visitorMessage,retireDetachedMedia,revealUploadedMedia,mediaGhostOpacity} from '../src/kdw-graceful-media.mjs';
const tick=()=>new Promise(r=>setTimeout(r,5));
function fadeFixture(gpu=true){
 const ghosts=[],animations=[],pending=new Map();let changes=0;
 const image={src:'http://local/template.svg',dataset:{},naturalWidth:360,complete:true,isConnected:true,ownerDocument:{baseURI:'http://local/',documentElement:{dataset:{webglUi:String(gpu)}}},closest:()=>({dataset:{sceneVersion:'screen'}}),animate(){},after(){},cloneNode(){const ghost={src:this.src,dataset:{},style:{},removeAttribute(){},setAttribute(){},remove(){this.removed=true;},animate(frames,options){let finish;const animation={frames,options,finished:new Promise(r=>finish=r),finish,cancel(){this.cancelled=true;finish();}};animations.push(animation);return animation;}};ghosts.push(ghost);return ghost;}};
 const guard=guardImage(image,{fallbackAfter:10000,onChange:()=>changes++,makeImage:()=>({src:'',decode(){return this.src.endsWith('/template.svg')?Promise.resolve():new Promise(r=>pending.set(this.src,r));}})});
 return{image,guard,ghosts,animations,pending,changes:()=>changes};
}
test('late photo holds the displayed template through decode and GPU upload, then fades once',async()=>{
 const f=fadeFixture();try{await f.guard.ready;requestImageSource(f.image,'/photo.svg');assert.equal(f.image.src,'http://local/template.svg');f.pending.get('http://local/photo.svg')();await tick();assert.equal(f.ghosts.length,1);assert.equal(f.ghosts[0].src,'http://local/template.svg');assert.equal(f.animations.length,0);revealUploadedMedia(f.image);revealUploadedMedia(f.image);assert.equal(f.animations.length,1);assert.equal(f.animations[0].options.duration,520);f.animations[0].finish();await tick();assert.equal(f.ghosts[0].removed,true);}finally{f.guard.dispose();}
});
test('a replacement before GPU readiness retains the original visible template and disposal cancels reveal',async()=>{
 const f=fadeFixture();try{await f.guard.ready;for(const name of ['photo','newer']){requestImageSource(f.image,'/'+name+'.svg');f.pending.get('http://local/'+name+'.svg')();await tick();}assert.equal(f.ghosts.length,1);assert.equal(f.ghosts[0].src,'http://local/template.svg');revealUploadedMedia(f.image);const changes=f.changes();f.guard.dispose();await tick();assert.equal(f.animations[0].cancelled,true);assert.equal(f.changes(),changes);revealUploadedMedia(f.image);assert.equal(f.animations.length,1);}finally{f.guard.dispose();}
});
test('native DOM fades without a GPU acknowledgement; WebGL reads current opacity, not a baked value',async()=>{
 const f=fadeFixture(false),previous=globalThis.getComputedStyle;try{await f.guard.ready;requestImageSource(f.image,'/photo.svg');f.pending.get('http://local/photo.svg')();await tick();assert.equal(f.animations.length,1);let opacity='1';globalThis.getComputedStyle=()=>({opacity});assert.equal(mediaGhostOpacity(f.ghosts[0]),1);opacity='.42';assert.equal(mediaGhostOpacity(f.ghosts[0]),.42);opacity='0';assert.equal(mediaGhostOpacity(f.ghosts[0]),0);assert.equal(mediaGhostOpacity(f.image),1);}finally{globalThis.getComputedStyle=previous;f.guard.dispose();}
});
function fixture(load){const faults=[],changes=[];const image={src:'http://local/original.svg',dataset:{},naturalWidth:0,naturalHeight:0,complete:false,isConnected:true,ownerDocument:{baseURI:'http://local/'},closest:()=>({dataset:{sceneVersion:'screen-1'}})};const guard=guardImage(image,{fallback:'data:image/svg+xml,neutral',fallbackAfter:5,attemptTimeout:200,onFault:e=>faults.push(e),onChange:()=>changes.push(image.src),makeImage:()=>({src:'',decode(){return this.src.startsWith('data:')?Promise.resolve():load(this.src);}})});return{image,guard,faults,changes};}
test('a slow frame becomes a neutral ready frame, then accepts its late decoded original',async()=>{let finish;const f=fixture(()=>new Promise(r=>finish=r));try{await f.guard.ready;assert.equal(f.image.dataset.mediaFallback,'true');assert.equal(f.image.dataset.gpuDecoded,'true');assert.equal(f.changes.length,1);finish();await tick();assert.equal(f.image.src,'http://local/original.svg');assert.equal(f.image.dataset.mediaFallback,'false');assert.equal(f.changes.length,2);}finally{f.guard.dispose();}});
test('a failed asset retains a usable fallback and disposal revokes pending retry ownership',async()=>{const f=fixture(()=>Promise.reject(Error('offline')));try{await f.guard.ready;assert.equal(f.image.src,'data:image/svg+xml,neutral');assert.equal(imageSource(f.image),'http://local/original.svg');assert.ok(f.faults.length);f.image.isConnected=false;retireDetachedMedia();const count=f.changes.length;await tick();assert.equal(f.changes.length,count);}finally{f.guard.dispose();}});
test('a new portrait wins over an old pending decode without removing the displayed fallback',async()=>{const pending=new Map(),f=fixture(src=>new Promise(r=>pending.set(src,r)));try{await f.guard.ready;requestImageSource(f.image,'/new-portrait.svg');assert.equal(f.image.src,'data:image/svg+xml,neutral');assert.equal(imageSource(f.image),'http://local/new-portrait.svg');pending.get('http://local/original.svg')();await tick();assert.equal(f.image.src,'data:image/svg+xml,neutral');pending.get('http://local/new-portrait.svg')();await tick();assert.equal(f.image.src,'http://local/new-portrait.svg');}finally{f.guard.dispose();}});

test('a late fallback decode cannot replace an original that recovered first',async()=>{const pending=new Map(),image={src:'http://local/original.svg',dataset:{},naturalWidth:0,complete:false,isConnected:true,closest:()=>null};const guard=guardImage(image,{fallback:'data:image/svg+xml,neutral',fallbackAfter:1,attemptTimeout:200,onFault:()=>{},makeImage:()=>({src:'',decode(){return new Promise(resolve=>pending.set(this.src,resolve));}})});try{await tick();pending.get('http://local/original.svg')();await guard.ready;pending.get('data:image/svg+xml,neutral')();await tick();assert.equal(image.src,'http://local/original.svg');assert.equal(image.dataset.mediaFallback,'false');}finally{guard.dispose();}});
test('screen fallback preserves the reviewed screen and photo fallback uses the template man',()=>{
 const source='http://local/assets/figma-20261003/296-13807.png',screen=fallbackImageSource({source});
 assert.ok(screen.startsWith('data:image/webp;base64,'));assert.notEqual(screen,TEMPLATE_PORTRAIT);
 const image={src:source,alt:'',dataset:{}};assert.equal(fallbackForImage(image),screen);
 const linked={src:'http://local/assets/kdw-linked/visitor/none/conversation/screen_1.svg',alt:'',dataset:{}};
 assert.equal(fallbackForImage(linked),fallbackImageSource({source:'assets/kdw-native/conversation/screen_1.svg'}));assert.notEqual(fallbackForImage(linked),TEMPLATE_PORTRAIT);
 assert.equal(fallbackForImage({src:'http://local/assets/kdw-linked/visitor/none/conversation/visitor-avatar.svg',alt:'Фото посетителя',dataset:{}}),TEMPLATE_AVATAR);
 assert.ok(TEMPLATE_PORTRAIT.startsWith('data:image/webp;base64,'));
 assert.equal(visitorMessage('Введите название канала'),'Введите название канала');const old=console.error;console.error=()=>{};try{assert.equal(visitorMessage('Не удалось загрузить экран'),'');}finally{console.error=old;}
});


test('every authored mission frame has an embedded copy independent of its file URL',()=>{
 const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))));
 for(const task of Object.values(catalog.tasks))for(const screen of Object.values(task.screens)){
  const asset=catalog.assets[screen.assetId];if(!asset)continue;
  assert.ok(templates.images[templates.media[asset.path]],screen.screenId+' '+asset.path);
 }
 for(const [id,path]of Object.entries(templates.assets))assert.ok(templates.images[templates.media[path]],id);
});
