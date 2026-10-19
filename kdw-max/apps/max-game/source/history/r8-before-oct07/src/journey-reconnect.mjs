// Coordinate motion and adding a node do not invalidate existing route roles.
export function changesExistingRoute(before,after){
 return Object.entries(before).some(([id,slot])=>after[id]!==slot);
}

// Only a semantic replacement/swap arms this gate. Observe a prepared frame
// before allowing it to settle: render() can sync links before new poses exist.
export class RouteReconnect {
 constructor(){this.active=false;this.firstFrame=false;}
 begin(){this.active=true;this.firstFrame=true;}
 prepared(moving){
  if(!this.active)return;
  if(this.firstFrame){this.firstFrame=false;return;}
  if(!moving)this.active=false;
 }
}
