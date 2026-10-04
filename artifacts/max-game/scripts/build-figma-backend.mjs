import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {collectSharedBackendFiles,writeSharedBackendBundle} from './build-shared-backend.mjs';
import {loadFigmaContentRelease,releaseModules,EXPORT_FOLDER,REVISION} from './figma-content-release.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const releaseTarget=path.join(root,'artifacts/workspace/dist/max-shared-backend-20261003-151916-v2');
export async function buildFigmaBackend(){
 const release=await loadFigmaContentRelease(path.join(root,'artifacts/DESIGN/figma-exports',EXPORT_FOLDER),path.join(root,'artifacts/max-game/public'));
 const old=await collectSharedBackendFiles();
 // Isolated source snapshot lets the existing builder validate the release itself.
 const tempRoot=path.join(root,'artifacts/workspace/tasks/max-figma-backend');await fs.mkdir(tempRoot,{recursive:true});
 const stage=await fs.mkdtemp(path.join(tempRoot,'stage-'));
 const modules=new Map([...old.files].filter(([name])=>name.startsWith('src/')));
 for(const [name,bytes] of releaseModules(release))modules.set(name,bytes);
 for(const [name,bytes] of [...modules,...[...release.files].map(([name,bytes])=>['public/'+name,bytes])]){
  const filename=path.join(stage,name);await fs.mkdir(path.dirname(filename),{recursive:true});await fs.writeFile(filename,bytes);
 }
 const built=await collectSharedBackendFiles({sourceRoot:stage,includeAssets:true});
 const extras=new Map([
  ['catalog.json',Buffer.from(JSON.stringify(release.catalog,null,2)+'\n')],
  ['content-source.json',Buffer.from(JSON.stringify(release.metadata,null,2)+'\n')],
  ['README.md',Buffer.from(`# MAX — backend ${REVISION}\n\n4 миссии, 15 заданий, 84 экрана, 17 исходных SVG иконок, красный вопрос-заглушка и общий финал с QR.\nЭкраны: ${EXPORT_FOLDER}. Иконки: artifacts/DESIGN/UI/max.\n\nТочка подключения: src/application/mission-session.mjs, createMissionSessionApplication с явным PersistencePort. Новый каталог подключён по умолчанию внутри этого комплекта.\nИмена сессий/хранилище должны быть отдельными от прежней версии; перенос прогресса не выполняется автоматически.\nВсе ресурсы локальные, пути относительно корня комплекта.\n\nРаботающий мастер и renderer не переключены. Новые неизвестные hotspots заменены одним действием ниже экрана; точное размещение кликов требует пользовательской приёмки.\nViewDescriptor передаёт icon для узлов и миссий, icons для управления и fallback. hasEmbeddedLabel=true означает готовую карточку с подписью: renderer не должен дублировать эту подпись.\ncontent-source.json содержит карту происхождения, исходный текст редакционных пометок и ограничения.\n`)]
 ]);
 for(const [name,bytes] of extras){built.files.set(name,bytes);built.manifest.files[name]=createHash('sha256').update(bytes).digest('hex');}
 built.manifest.sourceRelease={revision:REVISION,source:EXPORT_FOLDER,sourceCatalogSha256:release.metadata.sourceCatalogSha256};
 built.files.set('manifest.json',Buffer.from(JSON.stringify(built.manifest,null,2)+'\n'));
 return {...await writeSharedBackendBundle(releaseTarget,built),revision:REVISION,missionCount:4,screenCount:84,iconCount:18,reviewNotes:release.metadata.reviewNotes.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildFigmaBackend()));
