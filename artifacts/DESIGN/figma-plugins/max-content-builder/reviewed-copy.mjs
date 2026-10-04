// Exact client copy overrides the game's current information-panel text.
// Editorial instructions themselves are never displayed as visitor-facing copy.
export function reviewedCatalog(source, review) {
  const catalog=structuredClone(source);
  const comments=new Map(review.commentMap.map(c=>[c.id,c]));
  const screens=Object.fromEntries(Object.values(catalog.tasks).flatMap(t=>Object.entries(t.screens)));
  for(const s of Object.values(screens))s.instructionSource={kind:'game-catalog',screenId:s.screenId,contentRevision:source.contentRevision};
  const replacements=[
    ['blogger.channel.chats','1948114254','last-paragraph'],
    ['blogger.channel.name','1948125302'],['blogger.channel.filled','1948125302'],
    ['blogger.channel.created','1948126808'],
    ['blogger.comments.post','1948132883'],
    ['blogger.statistics.menu','1948143428'],['blogger.statistics.statistics','1948144941'],
    ['digital-id.create-id.start','1948755352'],
    ['digital-id.create-id.redirect','1949245720','remove'],
    ['digital-id.create-id.confirm','1949249148'],
    ['digital-id.create-id.quick','1949249679'],
    ['digital-id.create-id.biometry','1949306461','remove'],
    ['digital-id.create-id.ready','1949250740'],
    ['digital-id.benefit.arrival','1948760459'],
    ['communication.call.chat','1949259240','last-paragraph'],
    ['communication.call.calling','1949260033'],
    ['communication.call.connected','1949260371','remove'],
    ['communication.message.voice-recording','1949263629'],
    ['communication.message.video-ready','1949263927'],
    ['business.platform.login','1949355857'],['business.platform.verification','1949355857']
  ];
  function apply(s,id,mode='exact'){
    const c=comments.get(id);if(!s||!c)throw Error('Missing reviewed copy source: '+id);
    s.instruction=mode==='remove'?'':mode==='last-paragraph'?c.message.split(/\n\s*\n/).at(-1).trim():c.message;
    s.instructionSource={kind:'client-comment',fileKey:review.fileKey,commentId:id,createdAt:c.created_at,mode,originalComment:c.message};
  }
  for(const [id,comment,mode] of replacements)apply(screens[id],comment,mode);
  const channel=catalog.tasks['blogger.channel'];
  // A real result comment, shown as a reference card, not a new game action.
  const result=structuredClone(channel.screens['blogger.channel.created']);
  result.screenId='blogger.channel.result';result.actions=[];result.annotations=[];result.presentationOnly=true;
  apply(result,'1948128129');channel.screens[result.screenId]=result;
  catalog.reviewSource={fileKey:review.fileKey,exportedAt:review.exportedAt,copyRevision:'client-copy-20261002-v1',replacements:replacements.length,resultCards:1,
    scope:'Original local review export plus current game catalog; newer mission rules remain authoritative.',
    decisions:[
      {commentId:'1949263050',status:'superseded',reason:'Выбор голосового или видео отменён: оба формата последовательно по 1949267292 и последнему уточнению клиента.'},
      {commentId:'1949366519',status:'superseded',reason:'Выбор одного бизнес-инструмента отменён последним бизнес-сценарием; все три инструмента обязательны.'},
      {commentId:'1948759765',status:'not-copy-replacement',reason:'Короткая подпись «Заселение с Цифровым ID» не подменяет весь текст инструкции.'},
      {commentId:'1949251568',status:'not-copy-replacement',reason:'Уточнение термина «Цифровой ID», не новый текст справки.'},
      {commentId:'1949252510',status:'not-copy-replacement',reason:'Фрагмент «подтверждения возраста», не полный текст справки.'}
    ]};
  return catalog;
}
