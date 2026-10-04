import fs from 'node:fs/promises';
const root=new URL('./',import.meta.url),shared=new URL('../max-material-collector/',root);
const read=p=>fs.readFile(p,'utf8');
await fs.writeFile(new URL('code.js',root),(await read(new URL('core.cjs',shared)))+'\n'+await read(new URL('map.cjs',root))+'\n'+await read(new URL('runtime.js',shared)));
const sha=await read(new URL('../pdf-export/internal/src/sha256.js',root)),client=await read(new URL('server-client.js',shared));
const readSummary=await read(new URL('summary.cjs',root));
await fs.writeFile(new URL('ui.html',root),(await read(new URL('ui.template.html',root))).replace('/*__AUDIT_SUMMARY__*/',()=>readSummary).replace('/*__SERVER_CLIENT__*/',()=>sha+'\n'+client));
console.log('Built MAX content exporter (shared Frame Archive transport)');
