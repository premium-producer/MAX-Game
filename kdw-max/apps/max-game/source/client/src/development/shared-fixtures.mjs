import {CHANNEL_CATALOG} from '../content/channel-catalog.mjs';
import {createGameModel, dispatchGameCommand} from '../core/game-core.mjs';
import {MISSION_CATALOG} from '../content/mission-catalog.mjs';
import {createMissionModel, dispatchMissionCommand} from '../core/mission-core.mjs';

const prefix = ['channel.open-create-menu', 'channel.choose-create', 'channel.fill-name-example', 'channel.create'];
const branches = {
  private:[...prefix, 'channel.choose-private', 'channel.continue-private', 'channel.skip-invites', 'channel.complete'],
  public:[...prefix, 'channel.choose-public', 'channel.use-new-link', 'channel.fill-link-example', 'channel.save-public-link', 'channel.skip-invites', 'channel.complete'],
};

/** Synthetic development data; does not access or overwrite a user's profile. */
export function createChannelFixture({branch = 'public', at = 'public-link', sessionId = 'fixture-channel'} = {}) {
  if (!Object.hasOwn(branches, branch)) throw new TypeError('Unknown channel branch');
  const target = at === 'completed' ? null : `blogger.channel.${at}`;
  if (target && !Object.hasOwn(CHANNEL_CATALOG.screens, target)) throw new TypeError('Unknown screen fixture');
  let game = createGameModel(CHANNEL_CATALOG, {sessionId});
  for (const actionId of branches[branch]) {
    if (target === game.state.screenId) break;
    const state = game.state;
    const command = {schemaVersion:1, type:'ACT', commandId:`fixture-command-${state.revision + 1}`,
      sessionId, contentRevision:state.contentRevision, missionId:state.missionId, taskId:state.taskId,
      screenId:state.screenId, expectedRevision:state.revision, actionId};
    const result = dispatchGameCommand(CHANNEL_CATALOG, game, command);
    if (!result.reply.ok) throw new Error(result.reply.code);
    game = result.model;
  }
  if ((target && game.state.screenId !== target) || (!target && game.state.status !== 'completed')) throw new TypeError('Screen is not on the selected branch');
  return Object.freeze({schemaVersion:1, game, layouts:Object.freeze({})});
}

/** Real accepted commands in an isolated synthetic session, one fixture per mission. */
export function createMissionFixture({missionId = 'blogger', scanned = true, sessionId = `fixture-${missionId}`} = {}) {
  if (!Object.hasOwn(MISSION_CATALOG.missions, missionId)) throw new TypeError('Unknown mission fixture');
  let mission = createMissionModel(MISSION_CATALOG, {sessionId});
  const act = (type, fields = {}, internal = false, now = 0) => {
    const result = dispatchMissionCommand(MISSION_CATALOG, mission, {schemaVersion:1,type,
      commandId:`fixture-mission-${mission.state.revision + 1}`,sessionId,contentRevision:MISSION_CATALOG.contentRevision,
      expectedRevision:mission.state.revision,...fields},{now,internal});
    if (!result.reply.ok) throw new Error(result.reply.code);
    mission=result.model;
  };
  act('OWNER_CHANGED',{active:true},true);
  act('SELECT_MISSION',{missionId});
  if (scanned) act('HOLD_CONFIRMED',{},true,800);
  return Object.freeze({schemaVersion:2,mission,clockCheckpointAt:mission.receipts.at(-1)?.now??0,layouts:Object.freeze({layoutRevision:0,positions:Object.freeze({}),receipts:Object.freeze([])})});
}
