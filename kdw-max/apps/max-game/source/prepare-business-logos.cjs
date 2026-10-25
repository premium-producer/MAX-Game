const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),{createHash}=require('crypto');
const source=__dirname,root=path.resolve(source,'../../..'),manifest=path.join(source,'client/src/kdw-business-all-assets.json'),data=JSON.parse(fs.readFileSync(manifest));
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true,sandbox:true}});try{
 await w.loadURL('about:blank');
 for(const [sector,group,suffix]of [['cafe','coffe','1'],['flowers','flower','2'],['auto','auto','3']]){
  const file=`${group}-screens/screen17.${suffix}.svg`,original=fs.readFileSync(path.join(root,'docs/review-business-screens-20261022/unpacked',file));
  const svg=original.toString().replace(/<svg\b[^>]*>/,tag=>tag.replace(/width="[^"]+"/,'width="152"').replace(/height="[^"]+"/,'height="152"').replace(/viewBox="[^"]+"/,'viewBox="46 57 38 38"'));
  const png=await w.webContents.executeJavaScript(`(async()=>{const i=new Image();i.src=${JSON.stringify('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'))};await i.decode();const c=document.createElement('canvas');c.width=c.height=152;c.getContext('2d').drawImage(i,0,0,152,152);return c.toDataURL('image/png').split(',')[1]})()`);
  const bytes=Buffer.from(png,'base64'),assetId='kdw.business-all.logo-'+sector,assetPath='assets/kdw-native/business-all/logo-'+sector+'.png';fs.writeFileSync(path.join(source,'client/public',assetPath),bytes);
  data.assets[assetId]={assetId,path:assetPath,width:152,height:152,mimeType:'image/png',sha256:createHash('sha256').update(bytes).digest('hex'),origin:{file,sha256:createHash('sha256').update(original).digest('hex'),crop:[46,57,38,38]}};
 }
 fs.writeFileSync(manifest,JSON.stringify(data,null,2)+'\n');w.destroy();app.exit(0);
}catch(e){console.error(e);w.destroy();app.exit(1);}});
