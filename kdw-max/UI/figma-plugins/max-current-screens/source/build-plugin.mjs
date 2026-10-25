import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),plugin=path.resolve(dir,'..');
export function buildPlugin(pack){
 fs.writeFileSync(plugin+'/code.js','const PACK='+JSON.stringify(pack)+';\n'+['comment-mapper.js','comments-runtime.js','final-runtime.js'].map(f=>fs.readFileSync(dir+'/'+f,'utf8')).join('\n'));
 fs.writeFileSync(plugin+'/ui.html',fs.readFileSync(dir+'/final-ui-template.html','utf8').replace('/*PACK_READER*/',fs.readFileSync(dir+'/pack-reader.js','utf8')).replace('/*COMMENTS_UI*/',fs.readFileSync(dir+'/comments-ui.js','utf8')));
 fs.writeFileSync(plugin+'/manifest.json',JSON.stringify({name:'MAX — финальные скриншоты · 3072×1536',id:'max-current-screens-local-20261022',api:'1.0.0',main:'code.js',ui:'ui.html',editorType:['figma'],documentAccess:'dynamic-page',networkAccess:{allowedDomains:['https://api.figma.com'],reasoning:'Read comments from the selected Figma file on explicit request using a temporary user-provided token.'}},null,2));
}
