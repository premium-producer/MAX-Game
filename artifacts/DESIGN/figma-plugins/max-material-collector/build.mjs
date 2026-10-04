import fs from 'node:fs/promises';
const root=new URL('./',import.meta.url);
await fs.writeFile(new URL('code.js',root),(await fs.readFile(new URL('core.cjs',root),'utf8'))+'\n'+await fs.readFile(new URL('runtime.js',root),'utf8'));
const sha=await fs.readFile(new URL('../pdf-export/internal/src/sha256.js',root),'utf8');
const client=await fs.readFile(new URL('server-client.js',root),'utf8');
const ui=await fs.readFile(new URL('ui.template.html',root),'utf8');
await fs.writeFile(new URL('ui.html',root),ui.replace('/*__SERVER_CLIENT__*/',()=>sha+'\n'+client));
console.log('Built MAX material collector');
