process.noAsar=true; // Hash archive bytes instead of Electron's virtual archive contents.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'EXPORT-MANIFEST.json'),'utf8'));
let count=0,bytes=0;
for(const [name,pin] of Object.entries(manifest.files)){
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep))throw Error('Invalid manifest path');
 const content=fs.readFileSync(file),digest=crypto.createHash('sha256').update(content).digest('hex');
 if(content.length!==pin.bytes||digest!==pin.sha256)throw Error('Changed or damaged file: '+name);
 count++;bytes+=content.length;
}
console.log(JSON.stringify({valid:true,files:count,bytes}));
