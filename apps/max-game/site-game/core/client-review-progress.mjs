import {CLIENT_REVIEW_MISSIONS} from '../content/client-review.mjs';
import {REVIEW_FLOWS} from '../content/client-review-flows.mjs';

export const REVIEW_SAVE_KEY = 'max-site-game:client-review:v1';
const missionFor = id => CLIENT_REVIEW_MISSIONS.find(m => m.id === id);
export function taskAt(state) {
  const mission = missionFor(state.missionId);
  if (!mission) return null;
  return mission.taskIds[state.step] ?? (state.step === mission.taskIds.length ? state.branch : null);
}
export function newReviewProgress(missionId) {
  if (!missionFor(missionId)) throw new Error(`Unknown mission: ${missionId}`);
  const state = {version:1, missionId, scanned:false, step:0, screen:null, branch:null, completed:[], skipped:[], answers:[], revision:0, commandIds:[]};
  state.screen = REVIEW_FLOWS[taskAt(state)]?.start ?? null;
  return state;
}
export function restoreReviewProgress(raw, missionId) {
  try {
    const state=JSON.parse(raw);
    if (state?.version!==1 || state.missionId!==missionId || !missionFor(missionId)) return null;
    const count=missionFor(missionId).taskIds.length+Number(missionFor(missionId).branchTaskIds.length>0);
    if (!Number.isInteger(state.step)||state.step<0||state.step>count||!Number.isInteger(state.revision)||state.revision<0) return null;
    if (state.branch!==null&&!missionFor(missionId).branchTaskIds.includes(state.branch)) return null;
    if (missionFor(missionId).branchTaskIds.length && state.step===missionFor(missionId).taskIds.length && !state.branch) return null;
    if (!Array.isArray(state.completed)||!Array.isArray(state.skipped)||!Array.isArray(state.answers)||!Array.isArray(state.commandIds)) return null;
    const active=taskAt(state);
    if (active && !Object.hasOwn(REVIEW_FLOWS[active] ?? {},'screens') && active!=='blogger.channel') return null;
    if (active!=='blogger.channel'&&active!==null&&!REVIEW_FLOWS[active].screens[state.screen]) return null;
    return state;
  } catch { return null; }
}
export function applyReviewAction(state,{commandId,taskId,screenId,actionId,expectedRevision}) {
  if (!commandId || typeof commandId!=='string') return {accepted:false,reason:'invalid-command',state};
  if (state.commandIds.includes(commandId)) return {accepted:true,duplicate:true,state};
  if (expectedRevision!==state.revision) return {accepted:false,reason:'stale-revision',state};
  if (taskAt(state)!==taskId || state.screen!==screenId) return {accepted:false,reason:'stale-screen',state};
  const flow=REVIEW_FLOWS[taskId],screen=flow?.screens[screenId];
  const action=screen?.actions.find(a=>a.id===actionId);
  if (!action) return {accepted:false,reason:'invalid-action',state};
  const next={...state,completed:[...state.completed],skipped:[...state.skipped],answers:[...state.answers],commandIds:[...state.commandIds,commandId],revision:state.revision+1};
  next.answers.push({taskId,screenId,actionId});
  if (action.branch) next.branch=action.branch;
  if (action.to==='complete'||action.to==='skip') {
    const target=action.to==='complete'?next.completed:next.skipped;
    if (!target.includes(taskId)) target.push(taskId);
    next.step++;
    const nextTask=taskAt(next);
    next.screen=nextTask?REVIEW_FLOWS[nextTask]?.start??null:null;
  } else if (flow.screens[action.to]) next.screen=action.to;
  else return {accepted:false,reason:'bad-target',state};
  return {accepted:true,duplicate:false,state:next};
}
export function completeChannel(state,commandId) {
  if (state.commandIds.includes(commandId)) return {accepted:true,duplicate:true,state};
  if (taskAt(state)!=='blogger.channel') return {accepted:false,reason:'stale-task',state};
  const next={...state,step:state.step+1,screen:REVIEW_FLOWS['blogger.comments'].start,
    completed:[...state.completed,'blogger.channel'],revision:state.revision+1,commandIds:[...state.commandIds,commandId]};
  return {accepted:true,duplicate:false,state:next};
}
