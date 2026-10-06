// One pending intent per zone. Contextual clicks belong to the state that was
// visible when pressed; navigation may supersede them across a screen commit.
const navigation=new Set(['START','MENU','MISSION','RESET','FINAL','CLOSE']);
export class JourneyIntent {
 constructor(){this.pending=null;}
 offer(action,state,{contentBusy=false}={}){
  if(action.type==='ANSWER'&&contentBusy)return 'acknowledged';
  const global=navigation.has(action.type);
  if(!global&&this.pending?.global)return 'superseded';
  this.pending={action,state,global};return 'queued';
 }
 take(state){const p=this.pending;this.pending=null;return p&&(p.global||p.state===state)?p.action:null;}
 clear(){this.pending=null;}
}
