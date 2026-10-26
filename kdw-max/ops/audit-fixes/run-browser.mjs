import {spawn} from 'node:child_process';import {once} from 'node:events';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const host=spawn(process.execPath,['ops/audit-fixes/serve-fixtures.cjs'],{cwd:root,stdio:['pipe','pipe','inherit']});
try{
 await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Fixture startup timed out')),15000);host.stdout.on('data',chunk=>{text+=chunk;if(text.includes('"ready":true')){clearTimeout(timer);resolve();}});host.once('error',reject);host.once('exit',code=>{clearTimeout(timer);reject(Error('Fixture exited '+code));});});
 const browser=spawn(process.execPath,[process.argv[2]||'ops/audit-fixes/browser-check.mjs'],{cwd:root,stdio:'inherit'});const [code]=await once(browser,'exit');process.exitCode=code??1;
}finally{host.kill('SIGTERM');await once(host,'exit').catch(()=>{});}
