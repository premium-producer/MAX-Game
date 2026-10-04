import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {CHANNEL_CATALOG as catalog} from '../src/content/channel-catalog.mjs';
import {restoreGameModel} from '../src/core/game-core.mjs';
import {createExplicitImportArtifact, createSharedSessionExport, applyExplicitImport} from '../src/migration/explicit-import.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
import {createChannelFixture, createMissionFixture} from '../src/development/shared-fixtures.mjs';
import {createMissionImportCodec} from '../src/migration/mission-import-codec.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {checkSharedBoundaries} from '../scripts/check-shared-boundaries.mjs';
import {collectSharedBackendFiles} from '../scripts/build-shared-backend.mjs';

const options = source => ({sourceProfileId:'selected-profile', source, targetSessionId:'imported-session',
  catalogs:[catalog], taskId:catalog.taskId, contentRevision:catalog.contentRevision});
const importMemory = () => {
  const storage=createMemoryPersistencePort(),claims=new Map();
  return {...storage,async createImported(id,record,{importId}){await storage.create(id,record);claims.set(importId,id);return 0;},async getImportTarget(id){return claims.get(id)??null;}};
};

test('unknown legacy stages/answers are archived exactly, never fabricated into completion', () => {
  const source = {stage:9, completed:['channel'], answers:{channel:'public'}, coordinates:[{x:1,y:2}]};
  const before = JSON.stringify(source), result = createExplicitImportArtifact(options(source));
  assert.equal(result.disposition, 'archived-unproven');
  assert.equal(result.record.game.state.screenId, catalog.startScreenId);
  assert.equal(result.record.game.state.completion, null);
  assert.deepEqual(result.record.game.state.answers, {});
  assert.deepEqual(result.archive, source);
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(result.record.layouts, {});
});

test('versioned public-link import validates receipts and rebinds IDs, retaining actual selected type', () => {
  const record = createChannelFixture();
  const result = createExplicitImportArtifact(options(createSharedSessionExport({record,catalogs:[catalog]})));
  assert.equal(result.disposition, 'restored-confirmed');
  assert.equal(result.record.game.state.screenId, 'blogger.channel.public-link');
  assert.equal(result.record.game.state.answers['channel-type'], 'public');
  assert.equal(result.record.game.state.sessionId, 'imported-session');
  assert.equal(restoreGameModel(catalog,result.record.game).ok,true);
  assert.equal(result.record.game.state.completion,null);
});

test('completed private/public imports remain provable and exactly-once', () => {
  for (const branch of ['public','private']) {
    const record = createChannelFixture({branch,at:'completed'});
    const result = createExplicitImportArtifact(options(createSharedSessionExport({record,catalogs:[catalog]})));
    assert.equal(result.record.game.state.status,'completed');
    assert.equal(result.record.game.state.answers['channel-type'],branch);
    assert.equal(result.record.game.receipts.filter(item=>item.command.actionId==='channel.complete').length,1);
    assert.equal(restoreGameModel(catalog,result.record.game).ok,true);
  }
});

test('tampered receipts and incompatible versions preserve archive and start safely', () => {
  for (const alter of [copy=>copy.record.game.state.answers.fake='correct',copy=>copy.record.game.state.contentRevision='unknown-v99']) {
    const source = structuredClone(createSharedSessionExport({record:createChannelFixture(),catalogs:[catalog]}));
    alter(source);
    const result = createExplicitImportArtifact(options(source));
    assert.equal(result.disposition,'archived-unproven');
    assert.equal(result.record.game.state.revision,0);
    assert.deepEqual(result.archive,source);
  }
});

test('explicit selection and target required; raw object/function imports rejected', () => {
  assert.throws(()=>createExplicitImportArtifact({...options({}),sourceProfileId:undefined}));
  assert.throws(()=>createExplicitImportArtifact({...options({}),catalogs:[]}));
  assert.throws(()=>createExplicitImportArtifact(options({fn(){}})));
  assert.throws(()=>createExplicitImportArtifact(options({value:NaN})));
  assert.throws(()=>createSharedSessionExport({record:{schemaVersion:1},catalogs:[catalog]}));
});

test('import is deterministic, immutable and does not preserve unknown layout contracts', () => {
  const source = structuredClone(createSharedSessionExport({record:createChannelFixture(),catalogs:[catalog]}));
  source.record.layouts = {unknown:{x:20,y:30,temporary:true}};
  const first = createExplicitImportArtifact(options(source)), second=createExplicitImportArtifact(options(source));
  assert.deepEqual(first,second);
  assert.deepEqual(first.record.layouts,{});
  assert.equal(first.layoutDisposition,'archived-no-known-mapping');
  assert.equal(Object.isFrozen(first.archive.record.layouts.unknown),true);
});

test('fixtures reject a screen on another branch and use the same game core', () => {
  assert.throws(()=>createChannelFixture({branch:'private',at:'public-link'}));
  assert.throws(()=>createChannelFixture({branch:'invented'}));
  assert.equal(restoreGameModel(catalog,createChannelFixture({at:'chats'}).game).ok,true);
});

test('explicit activation commits archive before create and retry never overwrites target', async () => {
  const artifact=createExplicitImportArtifact(options({stage:10})), persistence=importMemory();
  let archived=null, creates=0;
  const archivePort={async saveOnce(id,value){if(archived){assert.deepEqual(value,archived);return 'existing-identical';}archived=value;return 'created';}};
  const wrapped={...persistence,async createImported(id,record,claim){assert.ok(archived);creates++;return persistence.createImported(id,record,claim);}};
  assert.equal((await applyExplicitImport({artifact,catalogs:[catalog],persistence:wrapped,archivePort})).created,true);
  assert.equal((await applyExplicitImport({artifact,catalogs:[catalog],persistence:wrapped,archivePort})).duplicate,true);
  assert.equal((await persistence.load('imported-session')).version,0);
  assert.equal(creates,2);
});

test('failed archive never writes target; unrelated occupied target is not replaced', async () => {
  const artifact=createExplicitImportArtifact(options({})), persistence=importMemory();
  await assert.rejects(applyExplicitImport({artifact,catalogs:[catalog],persistence,archivePort:{async saveOnce(){throw new Error('archive failed');}}}),/archive failed/);
  assert.equal(await persistence.load('imported-session'),null);
  await persistence.create('imported-session',artifact.record);
  let saved=false;const archivePort={async saveOnce(){const ack=saved?'existing-identical':'created';saved=true;return ack;}};
  for(let attempt=0;attempt<2;attempt++)await assert.rejects(applyExplicitImport({artifact,catalogs:[catalog],persistence,archivePort}),{code:'IMPORT_TARGET_CONFLICT'});
  assert.equal((await persistence.load('imported-session')).version,0);
});

test('archive commit followed by target failure can resume create without losing provenance', async () => {
  const artifact=createExplicitImportArtifact(options({completed:true})), persistence=importMemory();
  let saved=false, fail=true;
  const archivePort={async saveOnce(){const value=saved?'existing-identical':'created';saved=true;return value;}};
  const wrapped={...persistence,async createImported(id,record,claim){if(fail){fail=false;throw new Error('disk unavailable');}return persistence.createImported(id,record,claim);}};
  await assert.rejects(applyExplicitImport({artifact,catalogs:[catalog],persistence:wrapped,archivePort}),/disk unavailable/);
  assert.equal((await applyExplicitImport({artifact,catalogs:[catalog],persistence:wrapped,archivePort})).created,true);
  assert.equal(saved,true);
});

test('architecture guard catches core renderer/storage and new adapter progress access', async () => {
  const root=path.resolve('artifacts/workspace/tests/max-shared-migration-bundle/guard');
  await fs.mkdir(path.join(root,'core'),{recursive:true});
  await fs.mkdir(path.join(root,'adapters'),{recursive:true});
  await fs.writeFile(path.join(root,'core','bad.mjs'),"import x from '../adapters/view.mjs';\nlocalStorage.setItem('progress', 'completed');\n");
  await fs.writeFile(path.join(root,'adapters','bad.mjs'),"import {dispatchGameCommand} from '../core/game-core.mjs';\n");
  const result=await checkSharedBoundaries(root);
  assert.equal(result.ok,false);
  assert.equal(result.violations.length,4);
  assert.equal((await checkSharedBoundaries()).ok,true);
});

test('bundle includes portable modules + original content hashes, activates no renderer', async () => {
  const {files,manifest}=await collectSharedBackendFiles();
  assert.equal(manifest.rendererActivation,'none');
  assert.ok(manifest.tasks.some(task=>task.taskId===catalog.taskId));
  assert.equal(manifest.assets['client.frame-91504'].sha256,catalog.assets['client.frame-91504'].sha256);
  assert.ok(files.has('src/core/game-core.mjs'));
  assert.ok(files.has('src/migration/explicit-import.mjs'));
  assert.equal(manifest.assetBase,'../');
  assert.equal(files.has('assets/client-media/frame-91504.png'),false);
  const portable=await collectSharedBackendFiles({includeAssets:true});
  assert.equal(portable.manifest.assetBase,'./');
  assert.equal(portable.files.has('assets/client-media/frame-91504.png'),true);
  assert.equal(manifest.missions.length,6);
  assert.ok(manifest.tasks.some(task=>task.taskId==='business.store'));
  assert.ok(manifest.versions.content.includes(MISSION_CATALOG.contentRevision));
});

test('all six mission fixtures export and import confirmed semantic state', () => {
  const missionCodec=createMissionImportCodec();
  for(const missionId of Object.keys(MISSION_CATALOG.missions)){
    const record=createMissionFixture({missionId});
    const source=createSharedSessionExport({record,missionCodec});
    const result=createExplicitImportArtifact({sourceProfileId:`profile-${missionId}`,source,targetSessionId:`import-${missionId}`,missionCodec});
    assert.equal(result.disposition,'restored-confirmed');
    assert.equal(result.record.mission.state.status,'task');
    assert.equal(result.record.mission.state.missionId,missionId);
    assert.equal(result.record.mission.state.scanned,true);
    assert.equal(missionCodec.restore(result.record.mission).ok,true);
    assert.deepEqual(result.record.mission.state.progress[missionId].completed,[]);
  }
});

test('unknown old mission progress resumes menu safely; tampered new mission stays archived', () => {
  const missionCodec=createMissionImportCodec();
  const old={mission:'blogger',stage:9,scanned:true,completed:['channel']};
  const result=createExplicitImportArtifact({sourceProfileId:'old-profile',source:old,targetSessionId:'safe-menu',missionCodec});
  assert.equal(result.record.mission.state.status,'menu');
  assert.equal(result.record.mission.state.scanned,false);
  assert.deepEqual(result.record.mission.state.progress,{});
  const tampered=structuredClone(createSharedSessionExport({record:createMissionFixture(),missionCodec}));
  tampered.record.mission.state.progress.blogger.completed=['blogger.channel'];
  const rejected=createExplicitImportArtifact({sourceProfileId:'tampered-profile',source:tampered,targetSessionId:'safe-tampered',missionCodec});
  assert.equal(rejected.disposition,'archived-unproven');
  assert.equal(rejected.record.mission.state.status,'menu');
});
