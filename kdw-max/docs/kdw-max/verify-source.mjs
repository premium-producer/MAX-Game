import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const folder=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'SOURCE_MANIFEST.json'),'utf8'));
const root=path.resolve(folder,manifest.repositoryRoot);
const failures=[];let bytes=0;
for(const [name,pin] of Object.entries(manifest.files)){
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep))throw Error('Invalid manifest path');
 if(!fs.existsSync(file)){failures.push({path:name,error:'missing'});continue;}
 const raw=fs.readFileSync(file);
 if(raw.length!==pin.bytes||crypto.createHash('sha256').update(raw).digest('hex')!==pin.sha256){failures.push({path:name,error:raw.subarray(0,43).toString().startsWith('version https://git-lfs.github.com/spec/v1')?'LFS object not downloaded':'SHA256 mismatch'});continue;}
 bytes+=raw.length;
}
console.log(JSON.stringify({valid:failures.length===0,files:Object.keys(manifest.files).length,bytes,failures},null,2));
process.exitCode=failures.length?1:0;
