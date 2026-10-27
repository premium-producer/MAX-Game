// Build into a disposable app; never rewrite the operator's app.json for a test.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),original=path.join(root,'apps/max-game'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-build-profile-')),app=path.join(temp,'max-game');
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
try{
 fs.mkdirSync(path.join(app,'source'),{recursive:true});fs.mkdirSync(path.join(app,'launcher'));
 fs.symlinkSync(path.join(root,'apps/STARTUP'),path.join(temp,'STARTUP'),'dir');
 for(const name of ['client','stand-base','vendor','stand-output','operator'])fs.symlinkSync(path.join(original,'source',name),path.join(app,'source',name),'dir');
 copy(path.join(original,'source/build.mjs'),path.join(app,'source/build.mjs'));
 for(const name of Object.keys(JSON.parse(fs.readFileSync(path.join(original,'source/stand-base/manifest.json'))).files).filter(n=>n.startsWith('public/'))){const relative=name.slice(7);copy(path.join(original,'www',relative),path.join(app,'www',relative));}
 for(const name of ['r6-app.js','build.json'])copy(path.join(original,'www/webgl-v5',name),path.join(app,'www/webgl-v5',name));
 const config={...JSON.parse(fs.readFileSync(path.join(original,'app.json'))),production:false,entry:'/webgl-v5/client.html?view=browser&custom=preserve',version:'test-profile',port:19567};const bytes=JSON.stringify(config,null,2)+'\n';fs.writeFileSync(path.join(app,'app.json'),bytes);
 const run=spawnSync(process.execPath,[path.join(app,'source/build.mjs'),path.join(original,'source/client/node_modules')],{cwd:root,encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(fs.readFileSync(path.join(app,'app.json'),'utf8'),bytes);
 const built=JSON.parse(fs.readFileSync(path.join(app,'www/webgl-v5/r9-build.json')));assert.match(built.buildId,/^[0-9a-f]{20}$/);
 const result={passed:true,productionPreserved:false,entryPreserved:config.entry,portPreserved:config.port,versionPreserved:config.version,buildId:built.buildId};fs.writeFileSync(path.join(root,'docs/verification-audit-fixes-20261026/build-profile.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS: build preserves custom dev launch profile');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
