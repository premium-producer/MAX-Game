// Admission to the visible field is separate from the authoritative timeline.
// A saved/late snapshot may already contain flights halfway down the viewport.
// Keep their IDs valid in the core, but only reveal newly observed cards while
// their entire measured rectangle is still above the viewport. Once admitted,
// a flight survives pause/resize without being re-admitted or repositioned.
export function createFlowEntry(){
 let armed=false;const decisions=new Map();
 return {
  clear(){armed=false;decisions.clear();},
  update(rows,rectangle,ready){
   if(!armed&&!ready)return new Set();
   armed=true;
   const live=new Set(rows.map(r=>r.spawnId));
   for(const id of decisions.keys())if(!live.has(id))decisions.delete(id);
   for(const row of rows)if(!decisions.has(row.spawnId)){
    const r=rectangle(row);
    decisions.set(row.spawnId,Number.isFinite(r?.y)&&Number.isFinite(r?.h)&&r.y+r.h<=0);
   }
   return new Set(rows.filter(r=>decisions.get(r.spawnId)).map(r=>r.spawnId));
  },
 };
}
