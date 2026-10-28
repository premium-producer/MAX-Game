'use strict';
const path=require('node:path');
const {read,atomic,revision,compare,fail,serialHandler}=require('./operator-http.cjs');
const policy=require('./stand-settings.cjs');
const {DEFAULT_TARGETS,validateTargets,readTargets}=require('./operator-calibration.cjs');
const DEFAULT_LIDAR={enabled:false,bindAddress:'0.0.0.0',sourceAddress:'10.0.0.11',port:9001,timeoutMs:350,width:3072,height:1536,rawPoints:null,targetPoints:null};
exports.createOperator=({root,origin,link,getOutput})=>{
 const file=name=>path.join(root,name),settings=()=>policy.validate(read(file('settings/stand.json'),policy.DEFAULTS));
 const lidar=()=>require('./lidar.cjs').automaticLidarConfig(read(file('data/lidar.local.json'),DEFAULT_LIDAR)),presentation=()=>read(file('data/operator.local.json'),{cursorVisible:false});
 const idle=()=>{const pointer=read(file('data/link/active.json'),null);if(!pointer?.gameId)return;const g=read(file('data/link/games/'+pointer.gameId+'.json'),null);if(g&&!['released','superseded','completed','expired','incomplete'].includes(g.status))throw fail('Сначала завершите текущую игру или ожидание посетителя',409);};
 const output=()=>{const o=getOutput();if(!o)throw fail('Spout ещё не запущен. Запустите MAX обычным ярлыком',409);return o;};
 const targets=()=>readTargets(read(file('data/calibration-targets.local.json'),{targets:DEFAULT_TARGETS}).targets);
 const state=()=>({settings:settings(),settingsRevision:revision(settings()),lidar:lidar(),lidarRevision:revision(lidar()),calibrationTargets:targets(),calibrationTargetsRevision:revision(targets()),presentation:presentation(),activeGameId:read(file('data/link/active.json'),null)?.gameId??null,output:getOutput()?.operatorStatus()??null});
 return{handle:serialHandler(origin,async(action,input)=>{
  if(action==='state'&&input===null)return state();
  if(action==='game/start'&&input){const o=output().operatorStatus();if(!o.contentReady||o.calibration)throw fail('Дождитесь готовности игрового экрана и завершите калибровку',409);await link.operatorChange({action:'start',missionId:input.missionId,gameId:input.gameId});return state();}
  if(action==='game/close'&&input){await link.operatorChange({action:'close',gameId:input.gameId});return state();}
  if(action==='game/control'&&input){if(!['next','back'].includes(input.action)||typeof input.token!=='string'||input.token.length>512)throw fail('Некорректная команда');const o=output();if(o.operatorStatus().calibration)throw fail('Сначала завершите калибровку',409);const game=await o.gameControl({action:input.action,token:input.token});return{...state(),game};}
  if(action==='settings'&&input){const value=policy.validate(input.value);compare(input.revision,settings());atomic(file('settings/stand.json'),value);link.settings();return state();}
  if(action==='presentation'&&input){if(typeof input.cursorVisible!=='boolean')throw fail('Некорректная настройка курсора');atomic(file('data/operator.local.json'),{cursorVisible:input.cursorVisible});await getOutput()?.setCursor(input.cursorVisible);return state();}
  if(action==='lidar'&&input){idle();const o=output();if(o.operatorStatus().calibration)throw fail('Сначала завершите калибровку',409);compare(input.revision,lidar());const validated=require('./lidar.cjs').validateLidarConfig(require('./lidar.cjs').automaticLidarConfig(input.value));await o.configureLidar(validated);atomic(file('data/lidar.local.json'),validated);return state();}
  if(action==='arm'&&input){if(typeof input.armed!=='boolean')throw fail('Некорректный ARM');await output().setArmed(input.armed);return state();}
  if(action==='calibration/targets'&&input){const o=getOutput()?.operatorStatus();if(o?.calibration)throw fail('Завершите текущую калибровку перед изменением мишеней',409);compare(input.revision,targets());atomic(file('data/calibration-targets.local.json'),{targets:validateTargets(input.targets)});return state();}
  if(action==='calibration/start'&&input){idle();await output().beginCalibration({config:lidar(),targets:input.targets?validateTargets(input.targets):targets(),autoCapture:input.autoCapture===true});return state();}
  if(action==='calibration/capture'&&input){await output().captureCalibration();return state();}
  if(action==='calibration/save'&&input){idle();compare(input.revision,lidar());const value=await output().saveCalibration();atomic(file('data/lidar.local.json'),value);return state();}
  if(action==='calibration/cancel'&&input){await output().cancelCalibration();return state();}
  throw fail('Неизвестное действие',404);
 })};
};
