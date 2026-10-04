import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const runtime=path.join(project,'apps/max-game');
const release=new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/,'Z');
const output=path.join(project,'artifacts/workspace/dist/max-game',release);
const build=JSON.parse(await fs.readFile(path.join(runtime,'build-manifest.json'),'utf8'));
// Only static, public game dependencies. No docs, source maps, launchers or credentials.
const entries=['index.html','client/index.html','large-blocks/index.html','guided/index.html','guided-line/index.html','guided-reveal/index.html','app.js','guided-app.js','src/journey.css','src/journey-guided.css','src/journey-guided-line.css','src/journey-guided-reveal.css'];
const allowed=name=>entries.includes(name)||/^(assets|audio|brand|cards|config|earth|icons|licenses)\//.test(name);
for(const name of entries)if(!build.files[name])throw Error('Required public entry missing: '+name);
const files={};
for(const [name,expected] of Object.entries(build.files).filter(([n])=>allowed(n))){
 if(name.includes('..')||path.isAbsolute(name))throw Error('Unsafe runtime path');
 const data=await fs.readFile(path.join(runtime,name));
 const digest=createHash('sha256').update(data).digest('hex');
 if(digest!==expected)throw Error('Build mismatch: '+name);
 files[name]=digest;await fs.mkdir(path.dirname(path.join(output,name)),{recursive:true});await fs.writeFile(path.join(output,name),data);
}
await fs.writeFile(path.join(output,'release.json'),JSON.stringify({application:'MAX',version:build.version,release,files},null,2)+'\n');
await fs.writeFile(path.join(output,'SHA256SUMS'),Object.entries(files).map(([name,hash])=>`${hash}  ${name}`).join('\n')+'\n');
console.log(JSON.stringify({release,output,files:Object.keys(files).length}));
