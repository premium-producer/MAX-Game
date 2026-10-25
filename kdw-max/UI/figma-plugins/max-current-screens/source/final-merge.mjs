import fs from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../..'),report=root+'/docs/verification-figma-final-20261023',data=JSON.parse(fs.readFileSync(dir+'/final-fixtures.json')),rows=[],checks=[];
for(let shard=0;shard<3;shard++){
 const check=JSON.parse(fs.readFileSync(report+'/capture-checks-shard'+shard+'.json'));if(!check.passed||check.errors.length)throw Error('Shard failed: '+shard);checks.push(check);
 const current=JSON.parse(fs.readFileSync(dir+'/final-captures-shard'+shard+'.json')),expected=data.fixtures.filter((f,i)=>i%3===shard).length+(shard===0?1:0);if(current.length!==expected)throw Error('Shard incomplete: '+shard);rows.push(...current);
}
if(rows.length!==data.fixtures.length+1||new Set(rows.map(f=>f.id)).size!==rows.length)throw Error('Capture missing or duplicated');
rows.sort((a,b)=>a.id==='shared.standby'?-1:b.id==='shared.standby'?1:data.fixtures.findIndex(f=>f.id===a.id)-data.fixtures.findIndex(f=>f.id===b.id));
fs.writeFileSync(dir+'/final-captures.json',JSON.stringify(rows,null,2));fs.writeFileSync(report+'/capture-checks.json',JSON.stringify({passed:true,complete:true,revision:data.revision,width:3072,height:1536,count:rows.length,expected:rows.length,errors:[],shards:checks.map(c=>c.count),production:JSON.parse(fs.readFileSync(dir+'/final-provenance.json')).productionBundleSha256},null,2));console.log({frames:rows.length});
