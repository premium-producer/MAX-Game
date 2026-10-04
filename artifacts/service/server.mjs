import {DISCOVERY_DEFAULTS,normalizeDiscovery} from './public/discovery-settings.js';
import {DISCOVERY_TAG_DEFAULTS,normalizeDiscoveryTags} from './public/discovery-tags-settings.js';
import {emitRearFluid} from './public/rear-fluid-emission.js';
import {createMaxGameBackend} from './max-game/backend.mjs';
import {MAX_API_PREFIX} from './max-game/http-api.mjs';
import {createAssetAuditStore} from './max-game/asset-audit-store.mjs';
import {createStandTelemetry,cleanProbe} from './stand-telemetry.mjs';
import {maxGameLayout} from './public/max-game-layout.js';
import {SIMULATION_DEFAULTS,validateSimulation} from './public/visitor-simulation.js';
import {rearWallSize,rearWallSnapshot} from './public/rear-wall.js';
import {splitRingStroke} from './public/arch-loop.js';
import {DepthSilhouettes} from './depth-silhouettes.mjs';
import {emitDepthFluid,resetDepthFluid} from './depth-fluid.mjs';
import {byteRange} from './http-range.mjs';
import {normalizeDepth,validDepth} from './public/depth-settings.js';
import {buildPixelMap,mapUV,mapMetrics} from './public/pixel-map.js';
import {SharedFluid,mergeSilhouetteFrame} from './shared-fluid.mjs';
import {backgroundSettings,validBackground} from './public/shared-field-model.js';
import {surfaceVisual} from './public/surface-visual.js';
import {JOURNEY_ROUTES,activeJourney,validJourney,elapsed,duration,phase} from './public/journey-model.js';
import {normalizePreviewQuality,wantsWall60} from './public/browser-preview-policy.js';
import {normalizeCommonMapVisual,normalizeRowStreams} from './public/common-map-visual.js';
import {outputPlan,previewRect,previewSize} from './public/output-plan.js';
import {surfaceLayout} from './public/rear-wall-render.js';
import {sanitizeTiming} from './public/frame-timing.js';
import {TD_CONTROL_ATLASES,tdControlAtlas,validControlFrame} from './public/td-mask-sources.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID, randomBytes,createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {frameLayout} from './public/frame-layout.js';
import {ProjectStore} from './project-store.mjs';
import {createModuleRegistry} from './module-registry.mjs';
import {WallClusterConfig} from './wall-cluster-config.mjs';
import {defaultMaskPresetConfig,validateMaskPresetConfig,applyMaskPresetChange} from './common-map-mask-presets.mjs';
import {validOutputs,sanitizeNativeStatus} from './native-output.mjs';
import {LocalAgent} from './local-agent.mjs';
import {InputRouter} from './input-router.mjs';
import {loadLAN,installedDigest} from './lan-common.mjs';
import {createLANCoordinator} from './lan-coordinator.mjs';
import {projectRegistry,problem,validId,SERVICE_ROLES} from './shared.mjs';
import {makeRenderProfile,validRenderProfile} from './public/render-profile.js';
import {DEFAULT_MIN_SHORT_SIDE,renderPlan,planMessage,qualityStatus,frameMeetsProfile,developmentRenderProfile,showRenderProfile,validShowQuality,SHOW_QUALITY_PRESETS,DEVELOPMENT_SCALE,DEVELOPMENT_MAX_SIDE} from './public/quality-policy.js';

const json = (res, code, data) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
const fail = (code, message) => Object.assign(new Error(message), {status:code});
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.ttf':'font/ttf','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.md':'text/plain','.bin':'application/octet-stream'};
export function resolvePublic(root, requested) {
  if (requested.includes('\\') || requested.includes('\0') || requested.split('/').some(p => p.startsWith('.') || p.includes(':'))) throw fail(403,'Недопустимый путь');
  const candidate = path.resolve(root, requested || 'index.html');
  const relative = path.relative(root,candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw fail(403,'Недопустимый путь');
  const actual = fs.realpathSync(candidate), inside = path.relative(fs.realpathSync(root),actual);
  if (inside.startsWith('..') || path.isAbsolute(inside)) throw fail(403,'Внешние ссылки запрещены');
  return actual;
}
export function applyChanges(original, changes) {
  if (!Array.isArray(changes) || changes.length > 200) throw fail(400,'Некорректные изменения');
  const result = structuredClone(original);
  for (const change of changes) {
    if (!Array.isArray(change.path) || !change.path.length || change.path.length > 4) throw fail(400,'Некорректное поле');
    let node = result;
    for (const [i,key] of change.path.entries()) {
      if (typeof key !== 'string' || ['__proto__','constructor','prototype'].includes(key) || !node || !Object.hasOwn(node,key)) throw fail(400,'Неизвестное поле');
      if (i === change.path.length-1) node[key] = structuredClone(change.value); else node=node[key];
    }
  }
  return result;
}

export const is3DViewerPath=pathname=>['/viewer/','/viewer/index.html','/viewer/show/','/viewer/show/index.html','/viewer/settings/','/viewer/settings/index.html'].includes(pathname);

export async function createStandService({projectRoot, mode='dev', port=8770, spawnWorker, nodeExecutable='node', watch=true, stateFile, onShutdown=()=>{},lanConfig,lanDigest,developmentProfile=mode==='dev'&&!stateFile,developmentSpout=false,getDiagnostics=()=>null,getControlFrame=()=>null,maxGameSettings}) {
  if (!['dev','run'].includes(mode)) throw new Error('Mode must be dev or run');
  // Portable archives contain only apps/. A full checkout serves editable
  // sources in development; the execution profile works in either layout.
  const useSources=mode==='dev'&&fs.existsSync(path.join(projectRoot,'artifacts/ribbon/engine.js'))&&fs.existsSync(path.join(projectRoot,'artifacts/web/viewer.js'));
  const ribbonRoot = path.join(projectRoot,useSources?'artifacts/ribbon':'apps/ribbon-mvp');
  const viewerRoot = path.join(projectRoot,useSources?'artifacts/web':'apps/stand-viewer');
  const wallRoot=path.join(projectRoot,useSources?'artifacts/video-wall':'apps/video-wall');
  const flowRoot=path.join(projectRoot,useSources?'artifacts/vk-video':'apps/vk-video-flow');
  // MAX has an isolated, prebuilt Three.js bundle in both master modes.
  const maxGameRoot=path.join(projectRoot,'apps/max-game');
  const stellaRoot=path.join(projectRoot,'apps/stella-prototype');
  const publicRoot = fileURLToPath(new URL('./public/',import.meta.url));
  const modules=await createModuleRegistry(ribbonRoot,wallRoot,flowRoot),ribbon=modules.get('ribbon');
  const {normalize:normalizeContinuous,valid:validContinuous,clockTime,changeClock,validClock,validStroke}=ribbon;
  const screens=JSON.parse(fs.readFileSync(path.join(viewerRoot,'assets/screens.json'),'utf8')).screens;
  const fieldGeometry=JSON.parse(fs.readFileSync(path.join(publicRoot,'surface-geometry.json'),'utf8')).surfaces;
  let sharedFluid,silhouetteFluid,archFluid,depthEmitters=0;const depthSilhouettes=new DepthSilhouettes();
  const fieldSurface=id=>({
    'ribbon-up':'SCREEN_LINE_UP','ribbon-down':'SCREEN_LINE_DOWN','video-wall-left':'SCREEN_LEFT','vk-stella':'SCREEN_STELLA','vk-arch':'SCREEN_ARKA','max-wall-right':'SCREEN_RIGHT'
  }[id]||Object.keys(saved.assignments).find(k=>saved.assignments[k]===id)||'SCREEN_LINE_UP');
  const fieldInput=(id,data)=>{
    if(['max-wall','stella'].includes(saved.instances[id]?.appId))return true;
    const ringSettings=saved.instances['vk-arch'].settings.fluid;
    if(data.type==='clear'){(id==='vk-arch'?archFluid:sharedFluid).clear();if(id!=='vk-arch')silhouetteFluid.clear();return true;}
    if(id==='vk-arch'&&data.space!=='pixel-map'){archFluid.stroke(data.stroke,ringSettings);return true;}
    const map=pixelMap(),s=data.stroke,A=data.space==='pixel-map'?[s.ax,s.ay]:mapUV(map,fieldSurface(id),s.ax,s.ay),B=data.space==='pixel-map'?[s.bx,s.by]:mapUV(map,fieldSurface(id),s.bx,s.by);
    if(A&&B){const parts=splitRingStroke(map,{ax:A[0],ay:A[1],bx:B[0],by:B[1]});if(parts.ring)archFluid.stroke(parts.ring,ringSettings);for(const part of parts.shared)sharedFluid.stroke(part,saved.instances['ribbon-up'].settings.fluid);}return true;
  };
  const file=stateFile || path.join(projectRoot,'apps','stand-service','configs','stand-service.json');
  const assetAuditStore=createAssetAuditStore({file:path.join(path.dirname(file),'max-asset-audit.json'),catalogFile:path.join(maxGameRoot,'asset-audit/catalog.json')});
  const csrf=randomBytes(24).toString('hex'), clients=new Map(), fieldClients=new Set(), tickets=new Map(), peers=new Map(), runtimes=new Map();
  // Opt-in, lazy authority: shipping these files cannot activate a MAX session.
  let maxBackendPromise;
  const maxBackend=()=>maxBackendPromise??=createMaxGameBackend({projectRoot,mode,settings:maxGameSettings,authorize:req=>req.headers['x-vk-token']===csrf});
  let closing=false, origin, watchers=[], debounce, revision=0, server,lan=null;
  const lanSettings=lanConfig??(stateFile?null:loadLAN(projectRoot));
  if(lanSettings&&(mode!=='run'||lanSettings.role!=='coordinator'))throw Error('LAN coordinator requires --run; use --agent for an execution node');
  const initial=(surface,enabled)=>({appId:'ribbon',enabled,revision:0,settings:ribbon.defaults(surface),clock:{time:0,epoch:Date.now(),playing:true,rate:1}});
  const wall=modules.get('video-wall');
  const initialWall=()=>({appId:'video-wall',enabled:false,revision:0,settings:wall.defaults(),clock:{time:0,epoch:Date.now(),playing:true,rate:1},renderProfile:{...makeRenderProfile(...rearWallSize('SCREEN_LEFT')),minShortSide:1080},outputs:{spout:false,ndi:false}});
  const defaults={schemaVersion:1,instances:{'ribbon-up':initial('up',true)},assignments:{SCREEN_LINE_UP:'ribbon-up',SCREEN_LINE_DOWN:'ribbon-up'}};
  const validate=candidate=>{
    if(candidate.schemaVersion!==1 || !candidate.instances || !candidate.assignments) throw new Error('Некорректный apps/stand-service/configs/stand-service.json; файл сохранён без изменений');
    candidate.showQuality??='maximum';
    if(!validShowQuality(candidate.showQuality))throw fail(400,'Некорректный пресет качества показа');
    // Retired non-physical outer arch: never spawn it from older saved projects.
    delete candidate.instances['vk-arch-outer'];
    delete candidate.assignments.SCREEN_ARKA_OUTER;
    for(const [surface,id] of Object.entries(candidate.assignments))if(id==='vk-arch-outer')delete candidate.assignments[surface];
    // Both physical ribbons share one renderer and one clock. Migrate the old duplicate.
    if(candidate.instances['ribbon-down']){
      delete candidate.instances['ribbon-down'];
      for(const [surface,id] of Object.entries(candidate.assignments))if(id==='ribbon-down')candidate.assignments[surface]='ribbon-up';
      if(candidate.assignments.SCREEN_LINE_UP)candidate.assignments.SCREEN_LINE_DOWN=candidate.assignments.SCREEN_LINE_UP;
    }
    if(!Object.hasOwn(candidate.instances,'video-wall-left'))candidate.instances['video-wall-left']=initialWall();
    for(const [id,appId,size] of [['vk-stella','stella',[1080,1920]],['vk-arch','arch',[1280,320]],['max-wall-right','max-wall',rearWallSize('SCREEN_RIGHT')]])if(!candidate.instances[id])candidate.instances[id]={appId,enabled:false,revision:0,settings:modules.get(appId).defaults(),clock:{time:0,epoch:Date.now(),playing:true,rate:1},renderProfile:candidate.serviceRenderProfiles?.[appId==='max-wall'?'right':appId]||{...makeRenderProfile(...size),minShortSide:Math.min(1080,...size)},outputs:{spout:false,ndi:false}};
    candidate.commonMapVisual=normalizeCommonMapVisual(candidate.commonMapVisual);
    candidate.depthSilhouettes=normalizeDepth(candidate.depthSilhouettes);if(!validDepth(candidate.depthSilhouettes))throw fail(400,'Некорректные настройки depth');
    candidate.background=backgroundSettings(candidate.background);if(!validBackground(candidate.background))throw fail(400,'Некорректная палитра общего поля');
    const arch=candidate.instances['vk-arch'];if(!arch.settings.flow)arch.settings=normalizeContinuous(structuredClone(candidate.instances['ribbon-up'].settings));
    arch.background=backgroundSettings(arch.background??candidate.background);if(!validBackground(arch.background))throw fail(400,'Некорректная палитра арки');
    if(candidate.journey===undefined)candidate.journey=null;
    if(!validJourney(candidate.journey))throw fail(400,'Некорректный сценарий VK Видео');
    for(const id of Object.keys(defaults.instances))if(!candidate.instances[id])throw problem('invalid_reference','Отсутствует источник '+id);
    for(const [id,s] of Object.entries(candidate.instances)) {
      if(!validId(id))throw problem('invalid_reference','Некорректный ID источника');
      if(s.nodeId!==undefined&&!validId(s.nodeId))throw problem('invalid_reference','Некорректный узел источника');
      if(s.outputs!==undefined&&!validOutputs(s.outputs))throw fail(400,'Некорректные настройки выходов');
      if(s.renderProfile!==undefined&&!validRenderProfile(s.renderProfile))throw fail(400,'Некорректное рабочее разрешение');
      if(!s || !['ribbon','video-wall','stella','arch','max-wall'].includes(s.appId) || typeof s.enabled!=='boolean' || !modules.get(s.appId).valid(s.settings) || !validClock(s.clock)) throw new Error('Некорректный сохранённый источник '+id);
      candidate.instances[id]={...s,settings:modules.get(s.appId).normalize(s.settings),revision:Number.isSafeInteger(s.revision)?s.revision:0};
    }
    if(candidate.journey){const j=candidate.journey;for(const [role,appId] of Object.entries({stella:'stella',arch:'arch',ribbon:'ribbon',wall:'video-wall'}))if(candidate.instances[j.routes[role]]?.appId!==appId)throw fail(400,'Некорректный маршрут сценария');if(!candidate.instances[j.routes.wall].settings.owners.some(o=>o.ownerId===j.ownerId))throw fail(400,'Нет владельца сценария');}
    if(candidate.serviceRenderProfiles!==undefined){
      if(!candidate.serviceRenderProfiles||typeof candidate.serviceRenderProfiles!=='object'||Array.isArray(candidate.serviceRenderProfiles))throw fail(400,'Некорректные профили сервисов');
      for(const [id,p] of Object.entries(candidate.serviceRenderProfiles))if(!SERVICE_ROLES.some(r=>r.id===id&&r.id!=='ribbon')||!validRenderProfile(p))throw fail(400,'Некорректный профиль сервиса');
    }
    for(const [surface,id] of Object.entries(candidate.assignments)) if(!Object.hasOwn(screens,surface)||!Object.hasOwn(candidate.instances,id)) throw new Error('Некорректное назначение '+surface);
    return candidate;
  };
  const store=new ProjectStore({file,defaults,validate,identityFile:stateFile?path.join(path.dirname(file),'node-identity.json'):path.join(projectRoot,'artifacts/workspace/runtime/node-identity.json')});
  let saved=store.read();const activeShowQuality=saved.showQuality;let previousBackground=structuredClone(saved.background),backgroundEpoch=0;
  const clusterConfig=new WallClusterConfig(path.join(path.dirname(file),'video-wall-clusters.json'),wall.clusterSystem,wall.validateClusterSystem,saved.instances['video-wall-left']?.settings);
  const simulationStore=new WallClusterConfig(path.join(path.dirname(file),'visitor-simulation.json'),SIMULATION_DEFAULTS,validateSimulation);
  const {packCubesArt,packCubesJunctionRing}=await import(pathToFileURL(path.join(ribbonRoot,'cubes-art.js')));
  const validateMaskProfile=profile=>{
    const {largeZero,smallZero}=profile?.thresholds??{};
    if(!(Number.isFinite(largeZero)&&Number.isFinite(smallZero)&&smallZero>=0&&smallZero<largeZero&&largeZero<1))
      throw Error('Пороги маски: 0 ≤ мелкая < крупная < 1');
    packCubesArt(profile.art);packCubesJunctionRing(profile.art);
    return {art:structuredClone(profile.art),thresholds:{largeZero,smallZero}};
  };
  const maskPresetStore=new WallClusterConfig(path.join(path.dirname(file),'lumicells-mask-presets.json'),defaultMaskPresetConfig(),
    candidate=>validateMaskPresetConfig(candidate,validateMaskProfile));
  const {selectedSurfaceMasks}=await import(pathToFileURL(path.join(ribbonRoot,'cubes-surface-mask.js')));
  const maskArtFile=path.join(ribbonRoot,'cubes-art.json');
  const maskFillFile=path.join(viewerRoot,'common-map-fill.json');
  const rowStreamDefaults=normalizeRowStreams(JSON.parse(fs.readFileSync(maskFillFile,'utf8')).rowStreams);
  const rowStreamStore=new WallClusterConfig(path.join(path.dirname(file),'row-streams.json'),rowStreamDefaults,normalizeRowStreams);
  const discoveryStore=new WallClusterConfig(path.join(path.dirname(file),'discovery.json'),DISCOVERY_DEFAULTS,normalizeDiscovery);
  let activeDiscovery=discoveryStore.read().config;
  const discoveryTagStore=new WallClusterConfig(path.join(path.dirname(file),'discovery-tags.json'),DISCOVERY_TAG_DEFAULTS,normalizeDiscoveryTags);
  let activeDiscoveryTags=discoveryTagStore.read().config;
  let activeMasks=null,activeRowStreams=null,maskFingerprint='',maskVisualError=null;
  function readActiveMasks(){
    const presets=maskPresetStore.read();
    if(presets.error)throw Error('Пресеты маски: '+presets.error);
    const artText=fs.readFileSync(maskArtFile,'utf8');
    const fillText=fs.readFileSync(maskFillFile,'utf8');
    const fingerprint=createHash('sha256').update(presets.revision).update(artText).update(fillText).digest('hex');
    if(fingerprint===maskFingerprint)return false;
    const art=JSON.parse(artText),fill=JSON.parse(fillText),thresholds=fill.dualScale;
    activeMasks=selectedSurfaceMasks(presets.config,art,thresholds,validateMaskProfile);
    activeRowStreams=rowStreamStore.read().config;
    maskFingerprint=fingerprint;maskVisualError=null;
    return true;
  }
  try{readActiveMasks();}catch(error){maskVisualError=error.message;}
  const effectiveCommonMapVisual=()=>saved.commonMapVisual?
    {...saved.commonMapVisual,...(saved.commonMapVisual.dualScale&&activeMasks?{masks:activeMasks}:{}),
      rowStreams:activeRowStreams}:null;
  let simulationRead=simulationStore.read(),simulationReadAt=0;
  function simulationConfig(){if(Date.now()-simulationReadAt>=simulationRead.config.pollMs){simulationRead=simulationStore.read();simulationReadAt=Date.now();}return simulationRead.config;}
  function depthFrame(map){const c=simulationConfig();depthSilhouettes.hidePlayer=c.hidePlayerSilhouette;depthSilhouettes.allowSimulation=c.enabled;return depthSilhouettes.frame(saved.depthSilhouettes,map);}
  let cachedMap;const pixelMap=()=>{const rows=saved.instances['ribbon-up'].settings.flow.rows;if(!cachedMap||cachedMap.rows!==rows)cachedMap={rows,value:buildPixelMap(fieldGeometry,rows)};return cachedMap.value;};
  sharedFluid=new SharedFluid(...pixelMap().simulationSize);silhouetteFluid=new SharedFluid(...pixelMap().simulationSize);archFluid=new SharedFluid(256,24,{wrapX:true});
  const renderDefault=id=>{const s=saved.instances[id];if(s?.appId==='stella')return [1080,1920];if(s?.appId==='arch')return [1280,320];if(s?.appId==='video-wall')return rearWallSize('SCREEN_LEFT');if(s?.appId==='max-wall')return rearWallSize('SCREEN_RIGHT');if(s)return s.settings.surface==='down'?[3847,178]:[3884,179];const role=SERVICE_ROLES.find(r=>r.id===id);return screens[role.surfaces[0]].resolution;};
  const renderProfileFor=id=>saved.instances[id]?.renderProfile||saved.serviceRenderProfiles?.[id]||makeRenderProfile(...renderDefault(id));
  const executionProfileFor=id=>developmentProfile?developmentRenderProfile(renderProfileFor(id)):showRenderProfile(renderProfileFor(id),mode==='run'?activeShowQuality:'maximum');
  const executionOutputs=id=>mode==='run'?{spout:true,ndi:false}:developmentProfile?{spout:developmentSpout&&saved.instances[id]?.outputs?.spout===true,ndi:false}:{...saved.instances[id]?.outputs,ndi:false};
  const renderProfiles=()=>SERVICE_ROLES.flatMap(role=>{const ids=Object.keys(saved.instances).filter(id=>saved.instances[id].appId===role.moduleId);return (ids.length?ids:[role.id]).map(id=>({id,serviceId:role.id,label:role.id==='ribbon'?'Ribbon · обе ленты':role.label,available:ids.length>0,defaultSize:renderDefault(id),...renderProfileFor(id),plan:renderPlan(renderProfileFor(id))}));});
  const agent=new LocalAgent(store.node,spawnWorker);
  const persist=()=>{try{saved=store.commit(saved);}catch(error){saved=store.read();throw error;}};
  const runtime=id=>{if(!Object.hasOwn(saved.instances,id))throw fail(404,'Неизвестный источник');if(!runtimes.has(id))runtimes.set(id,{active:null,candidate:null,error:null,restarts:0});return runtimes.get(id);};
  const remoteNodes=()=>{const nodes=lan?.list()||[],ids=new Set(nodes.map(n=>n.id));for(const s of Object.values(saved.instances))if(s.nodeId&&s.nodeId!==store.node.id&&!ids.has(s.nodeId)){ids.add(s.nodeId);nodes.push({id:s.nodeId,label:'Не сопряжён: '+s.nodeId,role:'agent',status:'unavailable'});}return nodes;};
  const send=(res,event,data)=>{if(res.destroyed)return false;if(res.writableLength>256*1024){res.destroy();return false;}return res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);};
  const snapshot=()=>{const result={service:'vk-stand-service',version:'0.12.0',discovery:activeDiscovery,discoveryTags:activeDiscoveryTags,commonMapVisual:effectiveCommonMapVisual(),maskVisualError,archVisual:{aspect:fieldGeometry.SCREEN_ARKA.width/fieldGeometry.SCREEN_ARKA.height,settings:saved.instances['vk-arch'].settings,background:saved.instances['vk-arch'].background},depthSilhouettes:saved.depthSilhouettes,depthStatus:depthSilhouettes.status(saved.depthSilhouettes),depthFluid:{emitters:depthEmitters,lifetimeMs:500,trigger:'motion'},visual:surfaceVisual(saved.instances),background:saved.background,backgroundTransition:{from:previousBackground,to:saved.background,epoch:backgroundEpoch},pixelMap:pixelMap(),archField:{sequence:archFluid.sequence,time:archFluid.time,size:[archFluid.width,archFluid.height],topology:'loop-x'},field:{sequence:sharedFluid.sequence,time:sharedFluid.time,size:[sharedFluid.width,sharedFluid.height]},serverTime:Date.now(),mode,execution:{profile:developmentProfile?'development':'demonstration',renderScale:developmentProfile?DEVELOPMENT_SCALE:SHOW_QUALITY_PRESETS[activeShowQuality].scale,maxSide:developmentProfile?DEVELOPMENT_MAX_SIDE:SHOW_QUALITY_PRESETS[activeShowQuality].maxSide,targetBrowserFps:developmentProfile?30:15,spout:mode==='run'?'required':developmentProfile?developmentSpout:'configured',browser3d:mode!=='run',showQuality:activeShowQuality,nextShowQuality:saved.showQuality,ndi:false},revision,origin,journey:saved.journey,apps:modules.list().filter(m=>m.available),surfaces:Object.entries(screens).map(([id,s])=>({id,label:s.label,resolution:s.resolution})),assignments:saved.assignments,instances:Object.entries(saved.instances).map(([id,s])=>{
    const r=runtime(id),a=r.active,last=a?.lastStatus;
    return {id,...s,outputs:executionOutputs(id),configuredOutputs:s.outputs,renderLayout:a?.layout||null,programPlan:a?.programPlan||null,previewSize:last?.previewSize||null,tileFrameId:last?.tileFrameId||null,quality:qualityStatus(executionProfileFor(id),last?.renderSize),nativeOutputs:last?.nativeOutputs||null,tdMasks:last?.tdMasks||null,generation:a?.generation??null,sceneTime:clockTime(s.clock),status:!s.enabled?'stopped':r.candidate?'updating':a?(Date.now()-(a.lastHeartbeat||a.startedAt)>6000?'stale':s.clock.playing?'running':'paused'):r.error?'error':'starting',error:r.error,frame:last?.frame??0,timing:last?.timing??null,visualProfile:last?.visualProfile??null,renderSize:last?.renderSize??null,frameLayout:last?.frameLayout??null,codeRevision:a?.codeRevision??null,clients:[...peers.values()].filter(p=>p.instanceId===id).length};
  })};result.renderProfiles=renderProfiles();result.project={...store.manifest,revision:store.revision};result.registry=projectRegistry({manifest:store.manifest,node:{...store.node,role:'coordinator',status:'local'},extraNodes:remoteNodes(),modules:modules.list(),instances:result.instances,surfaces:result.surfaces,assignments:saved.assignments,revision:store.revision});result.rearWall=rearWallSnapshot(result);return result;};
  const broadcast=()=>{revision++;const s=snapshot();for(const c of clients.values())send(c,'state',s);};
  const postWorker=(ticket,event,data)=>ticket?.stream?send(ticket.stream,event,data):false;
  const inputRouter=new InputRouter({resolve:id=>{const active=runtimes.get(id)?.active;return active?.stream&&!active.stream.destroyed?{generation:active.generation,mappingRevision:store.revision}:null;},emit:fieldInput,emitPointer:(id,input)=>['max-wall','stella'].includes(saved.instances[id]?.appId)?postWorker(runtime(id).active,'game-pointer',input):true});
  const removePeer=id=>{const peer=peers.get(id);if(!peer)return;postWorker(tickets.get(peer.ticket),'peer-close',{peerId:id});peers.delete(id);const ticket=tickets.get(peer.ticket);if(!closing&&ticket&&runtime(peer.instanceId).active===ticket)postWorker(ticket,'config',workerSource(ticket));};
  const invalidatePeers=id=>{inputRouter.cancelInstance(id);for(const [key,p] of peers)if(p.instanceId===id){send(clients.get(p.clientId)||{destroyed:true},'reset',{instanceId:id});removePeer(key);}};
  const disposeTicket=t=>{if(!t)return;clearTimeout(t.timeout);tickets.delete(t.token);t.stream?.end();t.handle?.stop();};
  const workerFailed=(ticket,message)=>{
    if(!tickets.has(ticket.token)||closing)return;const r=runtime(ticket.id);r.error=String(message).slice(0,500);
    if(r.candidate===ticket)r.candidate=null;
    if(r.active===ticket){r.active=null;invalidatePeers(ticket.id);}disposeTicket(ticket);broadcast();
    if(r.queued&&saved.instances[ticket.id].enabled){r.queued=false;setTimeout(()=>startInstance(ticket.id,'queued-change'),250);}
  };
  const startInstance=(id,reason='start')=>{
    const r=runtime(id);if(!saved.instances[id].enabled||closing)return;if(r.candidate){r.queued=true;return;}
    r.error=null;
    const actualProfile=executionProfileFor(id),plan=renderPlan(actualProfile);
    if(actualProfile.minShortSide!==undefined&&!plan.runtimeReady){r.error=planMessage(plan);broadcast();return;}
    let programPlan,layout;try{programPlan=outputPlan(actualProfile.width,actualProfile.height);layout=['max-wall','stella'].includes(saved.instances[id].appId)?maxGameLayout(actualProfile.width,actualProfile.height):surfaceLayout(id,actualProfile.width,actualProfile.height);}catch(e){r.error=e.message;broadcast();return;}
    const token=randomBytes(24).toString('hex'),ticket={id,token,programPlan,renderProfile:{...actualProfile},layout,generation:randomUUID(),codeRevision:Date.now().toString(36),startedAt:Date.now(),lastHeartbeat:Date.now(),stream:null,reason};
    tickets.set(token,ticket);r.candidate=ticket;
    ticket.timeout=setTimeout(()=>workerFailed(ticket,'Источник не запустился за 45 секунд'),45000);
    try{const request={id,url:`${origin}${modules.get(saved.instances[id].appId).workerRoute}#${token}`,onFailure:message=>workerFailed(ticket,message)},nodeId=saved.instances[id].nodeId||store.node.id;ticket.nodeId=nodeId;ticket.handle=nodeId===store.node.id?agent.prepare(request):lan?.has(nodeId)?lan.prepare(nodeId,request):(()=>{throw Error('Узел не сопряжён; источник не запущен');})();}catch(e){workerFailed(ticket,e.message);}
    broadcast();
  };
  const stopInstance=id=>{const r=runtime(id);r.queued=false;invalidatePeers(id);disposeTicket(r.candidate);disposeTicket(r.active);r.candidate=null;r.active=null;r.error=null;};
  const body=async req=>{let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>160*1024)throw fail(413,'Слишком большой запрос');parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString());}catch{throw fail(400,'Некорректный JSON');}};
  const source=id=>{runtime(id);return saved.instances[id];};
  const workerCommonMapVisual=id=>{
    return ['video-wall','max-wall','ribbon','arch'].includes(source(id).appId)?effectiveCommonMapVisual():null;
  };
  const workerSource=t=>({...source(t.id),id:t.id,generation:t.generation,outputs:executionOutputs(t.id),execution:{profile:developmentProfile?'development':'demonstration',targetBrowserFps:developmentProfile?30:15,browserWall60:wantsWall60(developmentProfile?'development':'demonstration',source(t.id).appId,[...peers.values()].filter(p=>p.instanceId===t.id))},transportClock:saved.instances['ribbon-up'].clock,renderProfile:t.renderProfile,journey:t.id==='vk-arch'?null:saved.journey,discovery:['ribbon','arch'].includes(source(t.id).appId)?activeDiscovery:null,discoveryTags:source(t.id).appId==='arch'?activeDiscoveryTags:null,commonMapVisual:workerCommonMapVisual(t.id),commonMapRows:saved.instances['ribbon-up'].settings.flow.rows,visual:t.id==='vk-arch'?{engine:'ribbon-continuous',sourceId:t.id,revision:saved.instances[t.id].revision,settings:structuredClone(saved.instances[t.id].settings)}:surfaceVisual(saved.instances),background:t.id==='vk-arch'&&!saved.commonMapVisual?saved.instances[t.id].background:saved.background,backgroundTransition:t.id==='vk-arch'?null:{from:previousBackground,to:saved.background,epoch:backgroundEpoch},fieldSurface:fieldSurface(t.id),pixelMap:pixelMap(),fieldMetrics:t.id==='vk-arch'?{...mapMetrics(pixelMap(),fieldSurface(t.id)),rows:saved.instances[t.id].settings.flow.rows,columns:Math.round(fieldGeometry.SCREEN_ARKA.width/fieldGeometry.SCREEN_ARKA.height*saved.instances[t.id].settings.flow.rows)}:mapMetrics(pixelMap(),fieldSurface(t.id))});
  const refreshMaskVisual=()=>{
    try{
      const hadError=maskVisualError!==null,changed=readActiveMasks();
      maskVisualError=null;
      if(changed&&saved.commonMapVisual){
        for(const t of tickets.values())if(['video-wall','max-wall','ribbon','arch'].includes(source(t.id).appId))
          postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),serverTime:Date.now()});
      }
      if(changed||hadError)broadcast();
    }catch(error){if(maskVisualError!==error.message){maskVisualError=error.message;broadcast();}}
  };
  const syncJourney=()=>{for(const t of tickets.values())postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),serverTime:Date.now()});broadcast();};
  const journeyReady=j=>Object.entries(j.routes).filter(([role])=>role!=='arch').map(([,id])=>id).every(id=>{const s=saved.instances[id],r=runtime(id);return s.enabled&&s.clock.playing&&r.active&&!r.error&&Date.now()-(r.active.lastHeartbeat||r.active.startedAt)<6000;});
  const checkpoint=()=>{const j=saved.journey;if(!j||j.status!=='running')return;const now=Date.now(),t=elapsed(j,now);if(!journeyReady(j)){j.clock={time:t,epoch:now,playing:false};j.status='blocked';j.reason='Один из экранов недоступен. Восстановите источник и продолжите маршрут.';j.revision++;persist();syncJourney();return;}
    const stage=phase(j,now);if(t>=duration(j)){const w=saved.instances[j.routes.wall],o=w.settings.owners.find(o=>o.ownerId===j.ownerId);o.sessionId=j.sessionId;o.packet=structuredClone(j.packet);o.packet.receivedAt=now;o.present=false;w.revision++;j.clock={time:duration(j),epoch:now,playing:false};j.status='waiting';j.receipt=j.id;j.stage='waiting';j.revision++;persist();syncJourney();}
    else if(stage!==j.stage){j.stage=stage;j.clock={time:t,epoch:now,playing:true};j.revision++;persist();syncJourney();}};
  function stream(req,res,event,data,onClose) {res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write(': connected\n\n');send(res,event,data);req.on('close',onClose);}
  function walkWallPresence(){
    const wall=saved.instances[saved.journey?.routes?.wall??'video-wall-left'];
    const owners=wall?.settings?.owners??[],ownerId=owners.find(o=>o.ownerId===saved.journey?.ownerId)?.ownerId??owners[1]?.ownerId??owners[0]?.ownerId;
    return ownerId?depthSilhouettes.wallPresence(saved.depthSilhouettes,ownerId):null;
  }
  async function route(req,res) {
    if(req.headers.host!==new URL(origin).host)throw fail(403,'Недопустимый Host');
    if(req.headers.origin && req.headers.origin!==origin)throw fail(403,'Недопустимый Origin');
    const url=new URL(req.url,origin),p=url.pathname;
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    if(p===MAX_API_PREFIX||p.startsWith(MAX_API_PREFIX+'/')) {
      let backend;try{backend=await maxBackend();}catch{ return json(res,503,{error:{code:'MAX_BACKEND_UNAVAILABLE'}}); }
      if(!backend)return json(res,503,{error:{code:'MAX_BACKEND_DISABLED'}});
      return backend.handle(req,res,url);
    }
    if(p==='/api/state'&&req.method==='GET')return json(res,200,{...snapshot(),csrf});
    if(p==='/api/max-asset-audit'&&req.method==='GET')return json(res,200,await assetAuditStore.read());
    if(p==='/api/diagnostics'&&req.method==='GET')return json(res,200,telemetry.snapshot());
    if(p==='/api/diagnostics/history'&&req.method==='GET')return json(res,200,{schema:'vk-stand-diagnostics-history/v1',samples:telemetry.history()});
    if(p==='/api/wall/simulation-config'&&req.method==='GET'){simulationRead=simulationStore.read();simulationReadAt=Date.now();return json(res,200,simulationRead);}
    if(p==='/api/wall/cluster-config'&&req.method==='GET')return json(res,200,clusterConfig.read());
    if(p==='/api/common-map-mask-presets'&&req.method==='GET')return json(res,200,maskPresetStore.read());
    if(p==='/api/common-map-row-streams'&&req.method==='GET')return json(res,200,rowStreamStore.read());
    if(p==='/api/discovery'&&req.method==='GET')return json(res,200,discoveryStore.read());
    if(p==='/api/discovery-tags'&&req.method==='GET')return json(res,200,discoveryTagStore.read());
    if(p==='/api/td/control-frame'&&req.method==='GET'){
      const atlas=url.searchParams.get('atlas');
      if(!Object.hasOwn(TD_CONTROL_ATLASES,atlas))throw fail(400,'Неизвестный атлас TD');
      const f=getControlFrame(atlas),age=f?Date.now()-f.receivedAt:Infinity;
      if(!validControlFrame(f)||f.atlas!==atlas||!Number.isFinite(age)||age<0||age>=1500)return json(res,503,{error:'TD_CONTROL_UNAVAILABLE'});
      res.writeHead(200,{'Content-Type':'application/octet-stream','Cache-Control':'no-store','Content-Length':f.bytes.length,
        'X-TD-Schema':f.schema,'X-TD-Width':f.width,'X-TD-Height':f.height,'X-TD-Sequence':f.sequence,'X-TD-Source-Frame':f.sourceFrame,'X-TD-Age-Ms':age});
      return res.end(Buffer.from(f.bytes.buffer,f.bytes.byteOffset,f.bytes.byteLength));
    }
    if(p==='/api/wall/depth-mask'&&req.method==='GET'){
      const f=depthFrame(pixelMap());
      res.setHeader('Cache-Control','no-store');res.setHeader('X-Depth-Mode',saved.depthSilhouettes.mode);
      res.setHeader('X-Wall-Presence',JSON.stringify(walkWallPresence()));
      if(req.headers['if-none-match']===f.revision){res.writeHead(204);return res.end();}
      res.writeHead(200,{'Content-Type':'application/octet-stream','ETag':f.revision,'X-Depth-Encoding':'rgba8-coverage-edge-trail-v1','X-Depth-Style':JSON.stringify([saved.depthSilhouettes.dynamics,saved.depthSilhouettes.trail]),'X-Depth-Process-Ms':f.processMs.toFixed(2),'X-Depth-Input-Age-Ms':f.inputAgeMs??-1,'X-Depth-Width':f.width,'X-Depth-Height':f.height,'X-Depth-Crop':JSON.stringify(f.crop),'X-Depth-Gain':JSON.stringify([saved.depthSilhouettes.fill,saved.depthSilhouettes.edge]),'X-Depth-Map':pixelMap().key});return res.end(f.bytes);
    }
    if(p==='/api/events'&&req.method==='GET') {
      const id=url.searchParams.get('client');if(!/^[\w-]{20,60}$/.test(id||'')||(clients.size>=16&&!clients.has(id)))throw fail(400,'Некорректный клиент');
      if(clients.has(id)){for(const [key,peer] of peers)if(peer.clientId===id)removePeer(key);clients.get(id).end();}clients.set(id,res);if(url.searchParams.get('field')==='1')fieldClients.add(id);else fieldClients.delete(id);
      return stream(req,res,'state',snapshot(),()=>{if(clients.get(id)!==res)return;clients.delete(id);fieldClients.delete(id);inputRouter.cancelSource(id);for(const [key,peer] of peers)if(peer.clientId===id)removePeer(key);});
    }
    if(p.startsWith('/api/worker')) {
      const token=req.headers['x-worker-token']||url.searchParams.get('token'),t=tickets.get(token);if(!t)throw fail(403,'Недействительный исполнитель');
      if(req.method==='GET'&&p==='/api/worker/events') {
        t.stream?.end();t.stream=res;
        return stream(req,res,'config',{id:t.id,generation:t.generation,...workerSource(t),outputActive:runtime(t.id).active===t,serverTime:Date.now()},()=>{if(t.stream===res)t.stream=null;});
      }
      if(req.method!=='POST')throw fail(405,'Метод не поддерживается');
      const data=await body(req);
      if(p==='/api/worker/status') {
        if(data.error){workerFailed(t,data.error);return json(res,200,{ok:true});}
        if(data.ready&&!frameMeetsProfile(t.renderProfile,data.renderSize,data.sceneSize,data.tileProof,t.layout)){workerFailed(t,'Кадр не соответствует целевому разрешению: источник не принят, качество не снижено автоматически.');return json(res,200,{ok:true,outputActive:false,outputs:{}});}
        t.lastHeartbeat=Date.now();t.lastStatus={frame:Number(data.frame)||0,renderSize:Array.isArray(data.renderSize)?data.renderSize.slice(0,2):null,frameLayout:data.frameLayout?.format==='ribbon-tiles-v1'?frameLayout(data.frameLayout.width,data.frameLayout.height):null};
        t.lastStatus.nativeOutputs=sanitizeNativeStatus(data.nativeOutputs);t.lastStatus.tileFrameId=data.tileProof?.frameId??null;t.lastStatus.previewSize=previewSize([0,0,t.layout.width,t.layout.height]);t.lastStatus.timing=sanitizeTiming(data.timing);
        t.lastStatus.previewDiagnostics=cleanProbe(data.previewDiagnostics);
        const visual=data.visualProfile;
        t.lastStatus.visualProfile=visual&&['vanilla','cubes'].includes(visual.style)&&Number.isInteger(visual.fillMode)&&visual.fillMode>=0&&visual.fillMode<=3?{style:visual.style,fillMode:visual.fillMode}:null;
        t.lastStatus.tdMasks=Object.fromEntries(['large','fine'].map(kind=>{const m=data.tdMasks?.[kind],spec=TD_CONTROL_ATLASES[tdControlAtlas(t.id)]?.pages[kind+'Physical'];return [kind,spec&&m?.live===true&&Number.isSafeInteger(m.sequence)&&m.sequence>0?{live:true,sequence:m.sequence,size:spec.sourceSize,atlas:tdControlAtlas(t.id),sourceFrame:Number.isSafeInteger(m.sourceFrame)?m.sourceFrame:null}:{live:false}];}));
        const r=runtime(t.id);
        if(data.ready&&r.candidate===t){const old=r.active;r.active=t;r.candidate=null;clearTimeout(t.timeout);r.error=null;invalidatePeers(t.id);disposeTicket(old);broadcast();if(r.queued){r.queued=false;setTimeout(()=>startInstance(t.id,'queued-change'),250);}}
        return json(res,200,{ok:true,serverTime:Date.now(),outputActive:r.active===t,outputs:executionOutputs(t.id)});
      }
      if(p==='/api/worker/signal') {
        const peer=peers.get(data.peerId);if(!peer||peer.ticket!==token)throw fail(404,'Подписка закрыта');
        send(clients.get(peer.clientId)||{destroyed:true},'signal',{peerId:data.peerId,instanceId:t.id,generation:t.generation,description:data.description});return json(res,200,{ok:true});
      }
      throw fail(404,'Неизвестный маршрут');
    }
    if(p.startsWith('/api/')) {
      if(req.method!=='POST')throw fail(405,'Метод не поддерживается');
      if(req.headers['x-vk-token']!==csrf)throw fail(403,'Требуется токен сервиса');
      if(p==='/api/wall/walk-texture'){
        if(req.headers['content-type']!=='application/octet-stream')throw fail(415,'Нужна текстура coverage');
        let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>524288)throw fail(413,'Текстура слишком большая');parts.push(chunk);}
        depthSilhouettes.setWalkTexture(req.headers['x-depth-session'],Buffer.concat(parts));return json(res,200,{ok:true});
      }
      if(p==='/api/wall/depth-frame'){
        if(req.headers['content-type']!=='application/octet-stream')throw fail(415,'Нужен DEPTH16 little-endian');
        let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>2097152)throw fail(413,'Depth-кадр слишком большой');parts.push(chunk);}
        depthSilhouettes.accept({id:req.headers['x-depth-source'],token:req.headers['x-depth-session'],sequence:Number(req.headers['x-depth-sequence']),width:Number(req.headers['x-depth-width']),height:Number(req.headers['x-depth-height'])},Buffer.concat(parts));return json(res,200,{ok:true});
      }
      const data=await body(req);
      if(p==='/api/max-asset-audit')return json(res,200,await assetAuditStore.save(data));
      if(p==='/api/common-map-mask-presets'){
        const current=maskPresetStore.read();
        if(current.error)throw fail(409,'Исправьте серверный JSON пресетов: '+current.error);
        if(data.expectedRevision!==current.revision)throw fail(409,'Пресеты изменились в другом окне; обновите страницу');
        let next;try{next=applyMaskPresetChange(current.config,data,validateMaskProfile);}catch(error){throw fail(400,error.message);}
        const result=maskPresetStore.write(next);
        refreshMaskVisual();
        return json(res,200,result);
      }
      if(p==='/api/discovery'){
        const current=discoveryStore.read();
        if(current.error||data.expectedRevision!==current.revision)throw fail(409,current.error||'Discovery изменён в другом окне; обновите настройки');
        let result;try{result=discoveryStore.write(data.config);}catch(error){throw fail(400,error.message);}
        activeDiscovery=result.config;
        for(const t of tickets.values())if(['ribbon','arch'].includes(source(t.id).appId))postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),serverTime:Date.now()});
        broadcast();return json(res,200,result);
      }
      if(p==='/api/discovery-tags'){
        const current=discoveryTagStore.read();
        if(current.error||data.expectedRevision!==current.revision)throw fail(409,current.error||'Discovery-теги изменились в другом окне; обновите настройки');
        let result;try{result=discoveryTagStore.write(data.config);}catch(error){throw fail(400,error.message);}
        activeDiscoveryTags=result.config;
        for(const t of tickets.values())if(source(t.id).appId==='arch')postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),serverTime:Date.now()});
        broadcast();return json(res,200,result);
      }
      if(p==='/api/common-map-row-streams'){
        const current=rowStreamStore.read();
        if(current.error||data.expectedRevision!==current.revision)throw fail(409,current.error||'Полосы изменились в другом окне; обновите страницу');
        let result;try{result=rowStreamStore.write(data.config);}catch(error){throw fail(400,error.message);}
        activeRowStreams=result.config;
        if(saved.commonMapVisual)for(const t of tickets.values())if(['video-wall','max-wall'].includes(source(t.id).appId))
          postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),serverTime:Date.now()});
        broadcast();return json(res,200,result);
      }
      if(p==='/api/common-map-visual'){
        if(data.expectedRevision!==store.revision)throw fail(409,'Настройки мастера изменились; обновите карту');
        try{saved.commonMapVisual=normalizeCommonMapVisual(data.visual,validateMaskProfile);}catch(error){throw fail(400,error.message);}
        persist();
        for(const t of tickets.values())if(['video-wall','max-wall','ribbon','arch'].includes(source(t.id).appId))postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),serverTime:Date.now()});
        broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/diagnostics/receiver'){
        if(!clients.has(data.clientId)||!Array.isArray(data.rows)||data.rows.length>8)throw fail(400,'Некорректная телеметрия');
        telemetry.accept(data.clientId,data.rows);return json(res,200,{ok:true});
      }
      if(p==='/api/wall/simulation-config'){
        const current=simulationStore.read();if(current.error||data.expectedRevision!==current.revision)throw fail(409,current.error||'Симуляция уже изменена');
        let next;try{next=validateSimulation(applyChanges(current.config,data.changes));}catch(e){throw fail(400,e.message);}
        simulationRead=simulationStore.write(next);simulationReadAt=Date.now();return json(res,200,simulationRead);
      }
      if(p==='/api/wall/cluster-config'){
        const current=clusterConfig.read();
        if(current.error)throw fail(409,'Исправьте JSON перед сохранением из редактора: '+current.error);
        if(data.expectedRevision!==current.revision)throw fail(409,'Настройки кластеров изменились; повторите правку');
        let next;try{next=wall.validateClusterSystem(applyChanges(current.config,data.changes));}catch(e){throw fail(400,e.message);}
        return json(res,200,clusterConfig.write(next));
      }
      if(p==='/api/wall/walk-pose'){
        if(saved.depthSilhouettes.mode!=='walk')throw fail(409,'Режим прогулки выключен');
        const simulation=simulationConfig();
        if(data.poses){if(!simulation.enabled||!Array.isArray(data.poses)||data.poses.length!==simulation.actors.length||new Set(data.poses.map(p=>p?.ownerId)).size!==simulation.actors.length||data.poses.some(p=>!p||!simulation.actors.some(a=>a.ownerId===p.ownerId)))throw fail(400,'Неверные владельцы симуляции');depthSilhouettes.acceptWalkPoses(data.session,data.sequence,data.poses);}
        else{if(simulation.hidePlayerSilhouette)throw fail(409,'Силуэт игрока отключён в visitor-simulation.json');depthSilhouettes.acceptWalkPose(data.session,data.sequence,data.pose);}
        const map=pixelMap(),f=depthFrame(map);
        const message={width:f.width,height:f.height,crop:f.crop,mapKey:map.key,revision:f.revision,bytes:f.bytes.toString('base64'),gain:[saved.depthSilhouettes.fill,saved.depthSilhouettes.edge],style:[saved.depthSilhouettes.dynamics,saved.depthSilhouettes.trail],presence:walkWallPresence()};
        // Skip a congested stream: the next pose replaces it, never enqueue old bodies.
        for(const t of tickets.values())if(saved.instances[t.id]?.appId==='video-wall'&&t.stream&&!t.stream.writableLength)postWorker(t,'walk-mask',message);
        return json(res,200,{ok:true,processMs:f.processMs});
      }
      if(p==='/api/wall/depth-open')return json(res,200,{session:depthSilhouettes.open(data.sourceId,saved.depthSilhouettes)});
      if(p==='/api/wall/depth-close'){depthSilhouettes.close(data.sourceId,data.session);return json(res,200,{ok:true});}
      if(p==='/api/wall/depth-background'){if(data.action==='capture')depthSilhouettes.captureBackground(data.sourceId);else if(data.action==='clear')depthSilhouettes.clearBackground(data.sourceId);else throw fail(400,'Неизвестное действие');broadcast();return json(res,200,{ok:true});}
      if(p==='/api/wall/depth-config'){
        if(data.expectedRevision!==store.revision)throw fail(409,'Настройки изменились');const next=normalizeDepth(data.settings);if(!validDepth(next))throw fail(400,'Некорректные настройки depth');saved.depthSilhouettes=next;persist();broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/journey'){
        const old=saved.journey;
        if(data.action==='start'&&old?.id===data.runId)return json(res,200,snapshot());
        if(data.expectedRevision!==(old?.revision||0))throw fail(409,'Сценарий изменился; обновите страницу');
        if(data.action==='prepare'){
          for(const id of Object.values(JOURNEY_ROUTES)){saved.instances[id].enabled=true;}
          Object.assign(saved.assignments,{SCREEN_LINE_UP:JOURNEY_ROUTES.ribbon,SCREEN_LINE_DOWN:JOURNEY_ROUTES.ribbon,SCREEN_STELLA:JOURNEY_ROUTES.stella,SCREEN_ARKA:JOURNEY_ROUTES.arch,SCREEN_LEFT:JOURNEY_ROUTES.wall});
          persist();for(const id of Object.values(JOURNEY_ROUTES))if(!runtime(id).active&&!runtime(id).candidate)startInstance(id);broadcast();
        }else if(data.action==='start'){
          if(activeJourney(old))throw fail(409,'Маршрут уже занят. Дождитесь доставки или отмените его.');
          if(typeof data.runId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(data.runId))throw fail(400,'Некорректный ID запуска');
          const routes={...JOURNEY_ROUTES};if(!journeyReady({routes}))throw fail(409,'Сначала запустите экраны и дождитесь готовности источников маршрута');
          const target=saved.instances[routes.wall],from=saved.instances[routes.ribbon];
          if(!Array.isArray(data.tagIds)||data.tagIds.length<1||data.tagIds.length>8)throw fail(400,'Выберите от 1 до 8 текущих тегов');
          const packet=wall.receive(target.settings,data.ownerId,from,routes.ribbon,data.tagIds).owners.find(o=>o.ownerId===data.ownerId).packet;
          if(!packet.tags.length)throw fail(400,'Нужен хотя бы один тег');
          saved.journey={schemaVersion:1,id:data.runId,ownerId:data.ownerId,sessionId:'vk-'+data.runId,revision:(old?.revision||0)+1,status:'running',stage:'release',reason:null,clock:{time:0,epoch:Date.now()+500,playing:true},routes,packet,receipt:null};persist();syncJourney();
        }else if(['pause','resume','cancel'].includes(data.action)){
          if(!activeJourney(old))throw fail(409,'Нет активного маршрута');
          if(data.action==='resume'&&!journeyReady(old))throw fail(409,'Не все источники готовы');
          old.clock={time:elapsed(old),epoch:Date.now(),playing:data.action==='resume'};old.status=data.action==='pause'?'paused':data.action==='resume'?'running':'cancelled';old.reason=null;old.revision++;persist();syncJourney();
        }else throw fail(400,'Неизвестная команда сценария');
        return json(res,200,snapshot());
      }
      if(p==='/api/resolution'){
        if(data.expectedRevision!==store.revision)throw fail(409,'Проект изменился. Нажмите «Отменить» и повторите правку.');
        if(!renderProfiles().some(p=>p.id===data.id)||!validRenderProfile(data.profile))throw fail(400,'Проверьте размеры, пропорции и минимум короткой стороны (16–8192).');
        data.profile={...data.profile,minShortSide:data.profile.minShortSide??DEFAULT_MIN_SHORT_SIDE};
        const plan=renderPlan(data.profile);
        if(!plan.runtimeReady&&Object.hasOwn(saved.instances,data.id))throw fail(422,planMessage(plan)+' Текущие настройки не изменены.');
        if(plan.mode==='outside-plan-range')throw fail(422,planMessage(plan));
        const previous=renderProfileFor(data.id),previousSize=previous.minShortSide===undefined?[previous.width,previous.height]:renderPlan(previous).target;
        const sizeChanged=previousSize.some((n,i)=>n!==plan.target[i])||previous.minShortSide!==data.profile.minShortSide;
        if(Object.hasOwn(saved.instances,data.id))saved.instances[data.id].renderProfile={...data.profile};
        else saved.serviceRenderProfiles={...saved.serviceRenderProfiles,[data.id]:{...data.profile}};
        persist();if(sizeChanged&&saved.instances[data.id]?.enabled)startInstance(data.id,'resolution');
        broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/show-quality'){
        if(data.expectedRevision!==store.revision)throw fail(409,'Проект изменился; обновите данные');
        if(!validShowQuality(data.preset))throw fail(400,'Неизвестный пресет качества показа');
        for(const id of Object.keys(saved.instances))if(saved.instances[id].enabled){
          const plan=renderPlan(showRenderProfile(renderProfileFor(id),data.preset));
          if(!plan.runtimeReady)throw fail(422,`Источник ${id}: ${planMessage(plan)}`);
        }
        saved.showQuality=data.preset;persist();broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/output'){
        const s=source(data.id);if(data.expectedRevision!==store.revision)throw fail(409,'Проект изменился; повторите действие');
        if(developmentProfile)throw fail(409,'Выходы показа сохраняются без изменений. Для проверки Spout запустите режим разработки с VK_DEV_SPOUT=1.');
        if(mode==='run'&&data.kind==='spout'&&data.enabled===false)throw fail(409,'Spout обязателен в режиме показа; для отключения вернитесь в разработку.');
        if(data.kind==='ndi'&&data.enabled===true)throw fail(409,'NDI отключён: приоритет GPU Spout.');
        if(!['spout','ndi'].includes(data.kind)||typeof data.enabled!=='boolean')throw fail(400,'Некорректный выход');
        s.outputs={...s.outputs,[data.kind]:data.enabled};persist();
        for(const t of tickets.values())if(t.id===data.id)postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t),outputActive:runtime(t.id).active===t});
        broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/placement'){
        const s=source(data.id),r=runtime(data.id),old=s.nodeId||store.node.id;
        if(data.expectedRevision!==store.revision)throw fail(409,'Проект изменился; обновите данные');
        if(s.enabled||r.active||r.candidate)throw fail(409,'Сначала выключите источник');
        if(old!==store.node.id&&!lan?.stopped(old))throw fail(409,'Прежний узел ещё не подтвердил остановку всех своих источников');
        if(data.nodeId!==store.node.id&&!lan?.has(data.nodeId))throw fail(400,'Узел не сопряжён');
        if(data.nodeId===store.node.id)delete s.nodeId;else s.nodeId=data.nodeId;
        persist();broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/pointer-cancel'){
        if(!clients.has(data.clientId))throw fail(403,'Неизвестный источник ввода');
        inputRouter.cancelSource(data.clientId);return json(res,200,{ok:true});
      }
      if(p==='/api/pointer'){
        if(!clients.has(data.clientId)||data.inputSourceId!==data.clientId)throw fail(403,'Неизвестный источник ввода');
        return json(res,200,inputRouter.handle(data));
      }
      if(p==='/api/instance') {
        const s=source(data.id),r=runtime(data.id);
        if(data.action==='start'){s.enabled=true;persist();if(!r.active)startInstance(data.id);}
        else if(data.action==='stop'){s.enabled=false;persist();stopInstance(data.id);}
        else if(data.action==='restart'){if(s.enabled)startInstance(data.id,'manual');}
        else if(['pause','resume'].includes(data.action)){if(data.action==='pause')inputRouter.cancelInstance(data.id);s.clock=changeClock(s.clock,{playing:data.action==='resume'});s.revision++;persist();for(const t of tickets.values())if(t.id===data.id||data.id==='ribbon-up'&&t.id!=='vk-arch')postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t)});}
        else throw fail(400,'Неизвестное действие');
        broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/background'){if(data.expectedRevision!==store.revision)throw fail(409,'Настройки изменились');const next=backgroundSettings(data.settings);if(!validBackground(next))throw fail(400,'Некорректная палитра');previousBackground=structuredClone(saved.background);backgroundEpoch=Date.now();saved.background=next;persist();syncJourney();return json(res,200,snapshot());}
      if(p==='/api/config') {
        const s=source(data.id);if(data.expectedRevision!==s.revision)throw fail(409,'Настройки изменились; повторите правку');
        const next=applyChanges({settings:s.settings,clock:s.clock},data.changes);
        if(!modules.get(s.appId).valid(next.settings)||!validClock(next.clock))throw fail(400,'Некорректные настройки сцены');
        s.settings=modules.get(s.appId).normalize(next.settings);s.clock=next.clock;s.revision++;persist();
        const sharedPitchChanged=data.id==='ribbon-up'&&data.changes.some(change=>change.path?.join('.')==='settings.flow.rows');
        for(const t of tickets.values())if(t.id===data.id||data.id==='ribbon-up'&&(t.id!=='vk-arch'||sharedPitchChanged))postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t)});
        broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/wall/receive') {
        if(activeJourney(saved.journey)&&saved.journey.ownerId===data.ownerId)throw fail(409,'Набор владельца сейчас проходит маршрут');
        const target=source(data.id),from=source(data.sourceInstanceId);
        if(target.appId!=='video-wall'||from.appId!=='ribbon')throw fail(400,'Неверное направление передачи');
        if(data.expectedRevision!==target.revision)throw fail(409,'Набор изменился; повторите передачу');
        const next=wall.receive(target.settings,data.ownerId,from,data.sourceInstanceId,data.tagIds);
        target.settings=next;target.revision++;persist();
        for(const t of tickets.values())if(t.id===data.id||data.id==='ribbon-up'&&t.id!=='vk-arch')postWorker(t,'config',{id:t.id,generation:t.generation,...workerSource(t)});
        broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/assign') {
        if(data.expectedRevision!==undefined&&data.expectedRevision!==store.revision)throw fail(409,'Назначения изменились; обновите проект');
        if(!Object.hasOwn(screens,data.surfaceId)|| (data.instanceId!==null&&!Object.hasOwn(saved.instances,data.instanceId)))throw fail(400,'Неизвестный экран или источник');
        const targets=['SCREEN_LINE_UP','SCREEN_LINE_DOWN'].includes(data.surfaceId)?['SCREEN_LINE_UP','SCREEN_LINE_DOWN']:[data.surfaceId];
        for(const surface of targets)if(data.instanceId===null)delete saved.assignments[surface];else saved.assignments[surface]=data.instanceId;
        persist();broadcast();return json(res,200,snapshot());
      }
      if(p==='/api/input') {
        source(data.id);if(data.type!=='clear'&&(data.type!=='stroke'||!validStroke(data.stroke)))throw fail(400,'Некорректный ввод');
        if(data.space!==undefined&&(data.space!=='pixel-map'||data.mapKey!==pixelMap().key))throw fail(409,'Карта изменилась; повторите движение');
        fieldInput(data.id,data);return json(res,200,{ok:true});
      }
      if(p==='/api/subscribe') {
        if(mode==='run'&&req.headers.referer){let pathname;try{pathname=new URL(req.headers.referer).pathname;}catch{}if(is3DViewerPath(pathname))throw fail(409,'3D-просмотрщик отключён в режиме показа; проверяйте Spout в TD.');}
        source(data.id);if(!clients.has(data.clientId))throw fail(409,'Подключение клиента ещё не готово');
        const r=runtime(data.id);if(!r.active)throw fail(409,'Источник ещё не готов');
        if([...peers.values()].filter(p=>p.instanceId===data.id).length>=6)throw fail(429,'Не больше шести получателей на источник');
        let roi;try{roi=previewRect(data.roi,r.active.layout.width,r.active.layout.height);}catch(e){throw fail(400,e.message);}
        let quality;try{quality=normalizePreviewQuality(data.quality,source(data.id).appId);}catch(e){throw fail(400,e.message);}
        const views=new Set([...peers.values()].filter(p=>p.instanceId===data.id).map(p=>JSON.stringify([p.roi,p.quality])));views.add(JSON.stringify([roi,quality]));if(views.size>2)throw fail(429,'Не больше двух разных preview ROI на источник');
        const peerId=randomUUID();peers.set(peerId,{clientId:data.clientId,instanceId:data.id,ticket:r.active.token,roi,quality,answerDeadline:Date.now()+15000});postWorker(r.active,'config',workerSource(r.active));postWorker(r.active,'subscribe',{peerId,roi,quality});return json(res,200,{peerId});
      }
      if(p==='/api/signal'||p==='/api/unsubscribe') {
        const peer=peers.get(data.peerId);if(!peer||peer.clientId!==data.clientId)throw fail(404,'Подписка закрыта');
        if(p==='/api/unsubscribe')removePeer(data.peerId);else {
          if(data.description?.type!=='answer'||typeof data.description.sdp!=='string'||data.description.sdp.length>120000)throw fail(400,'Некорректный ответ');
          peer.answerDeadline=null;
          postWorker(tickets.get(peer.ticket),'signal',{peerId:data.peerId,description:data.description});
        }return json(res,200,{ok:true});
      }
      if(p==='/api/shutdown'){json(res,200,{ok:true});setTimeout(onShutdown,50);return;}
      throw fail(404,'Неизвестный маршрут');
    }
    if(req.method!=='GET'&&req.method!=='HEAD')throw fail(405,'Метод не поддерживается');
    let root,relative;
    if(p==='/'){root=publicRoot;relative='master.html';}
    else if(p==='/stella'){res.writeHead(302,{Location:'/stella/'});return res.end();}
    else if(p.startsWith('/stella/')){root=stellaRoot;relative=decodeURIComponent(p.slice(8))||'index.html';}
    else if(p==='/max-game'){res.writeHead(302,{Location:'/max-game/'});return res.end();}
    else if(p.startsWith('/max-game/')){root=maxGameRoot;relative=decodeURIComponent(p.slice(10))||'index.html';}
    else if(p==='/flow/service-worker.html'){root=publicRoot;relative='worker.html';}
    else if(p.startsWith('/flow/')){root=flowRoot;relative=decodeURIComponent(p.slice(6))||'index.html';}
    else if(p==='/wall/service-worker.html'){root=publicRoot;relative='worker.html';}
    else if(p.startsWith('/wall/')){root=wallRoot;relative=decodeURIComponent(p.slice(6))||'index.html';}
    else if(p==='/ribbon/service-worker.html'){root=publicRoot;relative='worker.html';}
    else if(p.startsWith('/service/')){root=publicRoot;relative=decodeURIComponent(p.slice(9));}
    else if(p.startsWith('/viewer/')){if(mode==='run'&&is3DViewerPath(p)){res.writeHead(302,{Location:'/', 'Cache-Control':'no-store'});return res.end();}root=viewerRoot;relative=decodeURIComponent(p.slice(8))||'index.html';}
    else if(p.startsWith('/ribbon/')){root=ribbonRoot;relative=decodeURIComponent(p.slice(8));}
    else throw fail(404,'Не найдено');
    if(relative.endsWith('/'))relative+='index.html';
    const ext=path.extname(relative).toLowerCase();if(!Object.hasOwn(mime,ext))throw fail(404,'Не найдено');
    const local=resolvePublic(root,relative),stat=fs.statSync(local);if(!stat.isFile())throw fail(404,'Не найдено');
    if(ext==='.html'&&(p.startsWith('/viewer/')||p.startsWith('/ribbon/'))&&p!=='/ribbon/service-worker.html'&&p!=='/ribbon/lumicells-original.html'){
      const html=fs.readFileSync(local,'utf8').replace('</body>','<script type="module" src="/service/navigation.js"></script></body>');
      res.writeHead(200,{'Content-Type':mime[ext],'Content-Length':Buffer.byteLength(html),'Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:html);
    }
    const range=['.mp4','.webm'].includes(ext)?byteRange(req.headers.range,stat.size):null;
    if(range===false){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
    const headers={'Content-Type':mime[ext],'Content-Length':range?range.end-range.start+1:stat.size,'Cache-Control':'no-store'};
    if(['.mp4','.webm'].includes(ext))headers['Accept-Ranges']='bytes';
    if(range)headers['Content-Range']=`bytes ${range.start}-${range.end}/${stat.size}`;
    res.writeHead(range?206:200,headers);
    if(req.method==='HEAD')return res.end();fs.createReadStream(local,range||{}).on('error',()=>res.destroy()).pipe(res);
  }
  server=http.createServer((req,res)=>route(req,res).catch(e=>{if(res.headersSent)return res.destroy();json(res,e.status||(['ENOENT','ENOTDIR'].includes(e.code)?404:500),{error:e.status||e.code==='ENOENT'?e.message:'Ошибка сервиса: '+e.message});}));
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'localhost',resolve);});}catch(error){store.close();throw error;}
  origin=`http://localhost:${server.address().port}`;
  const telemetry=createStandTelemetry({directory:path.join(projectRoot,'artifacts/workspace/runtime/diagnostics'),getState:snapshot,getHost:getDiagnostics,getWorker:id=>runtimes.get(id)?.active?.lastStatus?.previewDiagnostics,isPeer:(clientId,row)=>{const peer=peers.get(row.peerId);return !!peer&&(!clientId||peer.clientId===clientId)&&peer.instanceId===row.instanceId&&runtime(row.instanceId).active?.generation===row.generation;}});
  if(lanSettings){try{lan=await createLANCoordinator({...lanSettings,projectId:store.manifest.projectId,nodeId:store.node.id,digest:lanDigest||installedDigest(projectRoot),host:lanSettings.host,port:lanSettings.port,workerOrigin:origin,
    onReset:nodeId=>{for(const [id,s] of Object.entries(saved.instances))if(s.nodeId===nodeId)stopInstance(id);},
    onOnline:nodeId=>{for(const [id,s] of Object.entries(saved.instances))if(s.nodeId===nodeId&&s.enabled&&!runtime(id).active&&!runtime(id).candidate)startInstance(id);},
  });}catch(e){await new Promise(resolve=>server.close(resolve));store.close();throw e;}}
  if(activeJourney(saved.journey)&&saved.journey.clock.playing){saved.journey.clock.playing=false;saved.journey.status='paused';saved.journey.reason='Мастер перезапущен. Маршрут восстановлен с последней границы этапа.';saved.journey.revision++;persist();}
  for(const id of Object.keys(saved.instances))if(saved.instances[id].enabled)startInstance(id);
  let lastFieldTick=Date.now();
  const fieldPulse=setInterval(()=>{
    if(!fieldClients.size&&![...tickets.values()].some(t=>t.stream&&!t.stream.destroyed)){
      resetDepthFluid(silhouetteFluid);
      if(silhouetteFluid.contourActive)silhouetteFluid.clear();
      return;
    }
    const now=Date.now(),elapsed=Math.max(0,(now-lastFieldTick)/1000);lastFieldTick=now;
    const s=saved.instances['ribbon-up'],a=saved.instances['vk-arch'];depthEmitters=0;
    if(s.clock.playing){
      const dt=1/30*s.clock.rate;
      if(saved.depthSilhouettes.mode!=='off'){
        const map=pixelMap(),depth=depthFrame(map);
        depthEmitters=emitDepthFluid(silhouetteFluid,depth,map,s.settings.fluid,dt*(s.settings.fluid.speed??1),silhouetteFluid.time);
      }else resetDepthFluid(silhouetteFluid);
      emitRearFluid(sharedFluid,pixelMap(),s.settings.fluid,dt);
      sharedFluid.step(dt,s.settings.fluid,elapsed);
      if(silhouetteFluid.contourActive)silhouetteFluid.step(dt,{...s.settings.fluid,autoEmit:false},elapsed);
    }else resetDepthFluid(silhouetteFluid);
    if(a.clock.playing)archFluid.step(1/30*a.clock.rate,a.settings.fluid);
    const frame={...mergeSilhouetteFrame(sharedFluid.frame(),silhouetteFluid.frame()),serverTime:Date.now()};
    const ring={...archFluid.frame(),surface:'SCREEN_ARKA',serverTime:Date.now()};
    for(const t of tickets.values())postWorker(t,'field',t.id==='vk-arch'?ring:frame);
    for(const id of fieldClients){send(clients.get(id)||{destroyed:true},'field',frame);send(clients.get(id)||{destroyed:true},'field',ring);}
  },1000/30);
  const journeyPulse=setInterval(()=>{try{checkpoint();}catch(e){if(saved.journey){saved.journey.status='blocked';saved.journey.reason=e.message;saved.journey.clock.playing=false;}broadcast();}},200);
  const maskPulse=setInterval(refreshMaskVisual,750);
  const pulse=setInterval(()=>{inputRouter.sweep();for(const [id,peer] of peers)if(peer.answerDeadline&&Date.now()>=peer.answerDeadline)removePeer(id);broadcast();for(const t of tickets.values())if(t.stream)t.stream.write(': heartbeat\n\n');},2000);
  const changed=new Map();
  async function reloadChanged() {
    const list=[...changed.values()];changed.clear();
    try {
      for(const name of list.filter(n=>n.name.endsWith('.js')))await new Promise((resolve,reject)=>execFile(nodeExecutable,['--check',path.join(name.root,name.name)],{windowsHide:true,timeout:10000,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}},(error,stdout,stderr)=>error?reject(new Error(stderr||error.message)):resolve()));
      for(const id of Object.keys(saved.instances))if(saved.instances[id].enabled&&list.some(n=>n.appId==='ribbon'||n.appId===saved.instances[id].appId))startInstance(id,'source-change');
    }catch(e){for(const id of Object.keys(saved.instances))runtime(id).error='Правка не применена: '+e.message.slice(0,400);broadcast();}
  }
  if(useSources&&watch)for(const [appId,root] of [['ribbon',ribbonRoot],['video-wall',wallRoot],['stella',flowRoot],['arch',flowRoot]])watchers.push(fs.watch(root,{recursive:true},(_event,name)=>{if(!name||/^(vendor|node_modules)[\\/]/.test(name)||! /\.(js|json|glsl)$/.test(name))return;if(['stella','arch'].includes(appId)&&!['engine.js','scene-model.js'].includes(name.replaceAll('\\','/')))return;changed.set(appId+'/'+name,{appId,root,name});clearTimeout(debounce);debounce=setTimeout(reloadChanged,800);}));
  return {origin,snapshot,lan,async close(){if(closing)return;closing=true;await assetAuditStore.close();await telemetry.close();if(maxBackendPromise){const backend=await maxBackendPromise.catch(()=>null);await backend?.close();}clearInterval(fieldPulse);clearInterval(journeyPulse);clearInterval(maskPulse);if(activeJourney(saved.journey)&&saved.journey.clock.playing){saved.journey.clock={time:elapsed(saved.journey),epoch:Date.now(),playing:false};saved.journey.status='paused';saved.journey.revision++;persist();}clearInterval(pulse);clearTimeout(debounce);for(const watcher of watchers)watcher.close();for(const id of Object.keys(saved.instances))stopInstance(id);agent.close();await lan?.close();for(const c of clients.values())c.end();clients.clear();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();}};
}
