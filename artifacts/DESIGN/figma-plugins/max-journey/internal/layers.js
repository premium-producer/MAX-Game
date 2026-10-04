// Injected inside createJourneyWebGLUI only in the exporter bundle.
function exportLayers(){
 const out=[],hidden=[],hasPopup=!!root.querySelector('.context-popup,.field-success');
 scene.updateMatrixWorld(true);
 scene.traverse(mesh=>{
  const d=mesh.userData.maxExport;if(!d||!mesh.visible)return;
  // Blurred field objects must stay baked under the actual Frost mask.
  if(hasPopup&&mesh.layers.mask===1&&!mesh.material?.userData.el?.closest('.route-phone'))return;
  const opacity=mesh.material?.opacity??1;if(opacity<.005)return;
  hidden.push(mesh);mesh.visible=false;
  if(d.secondary)return;
  let x,y,w,h;
  if(d.kind==='svg'){
   const pos=mesh.parent.localToWorld(new THREE.Vector3(d.x,d.y,0));
   const scale=mesh.parent.getWorldScale(new THREE.Vector3());
   x=pos.x;y=pos.y;w=d.w*scale.x;h=d.h*scale.y;
  }else{
   const pos=mesh.getWorldPosition(new THREE.Vector3()),scale=mesh.getWorldScale(new THREE.Vector3());
   w=Math.abs(scale.x);h=Math.abs(scale.y);x=pos.x-w/2;y=pos.y-h/2;
  }
  if(w<=0||h<=0)return;
  out.push({...d,x,y,w,h,opacity,order:mesh.renderOrder});
 });
 return {layers:out.sort((a,b)=>a.order-b.order),restore(){for(const mesh of hidden)mesh.visible=true;}};
}
