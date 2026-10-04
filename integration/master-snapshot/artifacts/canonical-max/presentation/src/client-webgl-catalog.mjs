// Adapt client content to the existing mission engine without changing its visual system.
export function createClientWebglCatalog(content, icons) {
  const connection = {policy:'screenProjected', corridorWidth:2, ambiguityEpsilon:0.0001};
  const feedback = {invalid:'neutral'};
  const system = {schemaVersion:2, icons, pointIcons:['point-a','point-b'], objectTypes:{}, objectSettings:{}, equipmentSets:{}, missionSelectObjects:[], screenAppearance:{fieldScale:1,objectScale:1,showRangeCircle:true,sizes:{}}, connection, feedback};
  const missions = content.missions.map((source,index) => {
    const steps = [...source.steps, ...(source.branches ? [source.branches[0].step] : [])];
    const radius = 3.3 / (steps.length + 1) * 0.66;
    const types = steps.map((step,i) => {
      const type = `${source.id}-${step.id}`;
      system.objectTypes[type] = {label:step.label,short:step.label,icon:`step-${i+1}`,behavior:'ground',placementSurface:'any'};
      system.objectSettings[type] = {size:1,signalRadius:radius};
      return type;
    });
    return {
      number:source.number,id:source.id,name:source.title,summary:source.description,
      description:source.description+'\n\nРазмести действия по порядку от А к Б. Сближай соседние узлы, чтобы соединить маршрут.',
      timeSeconds:600, // Required by legacy schema; client mode does not run its countdown.
      mapPosition:{latitude:-15,longitude:-66+44*index},
      endpoints:{A:{label:source.start,icon:'point-a',roles:['start'],latitude:-5,longitude:-55},B:{label:source.finish,icon:'point-b',roles:['finish'],latitude:-5,longitude:55}},
      connectEndpointsOnComplete:true,inventory:Object.fromEntries(types.map(type=>[type,1])),
      objectives:steps.map((step,i)=>({id:step.id,label:step.label,condition:{type:'placed',object:types[i],count:1}})),
      successText:source.result,unlock:{requiresCompleted:[]},
      topology:{paths:[{id:'main',from:'A',to:'B',steps:types.map(type=>({role:type,type})),connection}]},
      completion:{type:'allPaths'},feedback,
      objectSettings:{'endpoint:A':{signalRadius:radius,size:1},'endpoint:B':{signalRadius:radius,size:1}},
      feedbackEvents:{success:[{id:'mission-complete',eyebrow:'МИССИЯ ВЫПОЛНЕНА',title:'МАРШРУТ СОБРАН',message:source.result,condition:{type:'missionComplete'},action:'complete'}],error:[]},
    };
  });
  return {schemaVersion:2,revision:`${content.revision}-webgl`,system,missions};
}
