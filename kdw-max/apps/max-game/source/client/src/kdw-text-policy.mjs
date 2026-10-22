import {PROFANITY_DICTIONARIES} from '../../vendor/glin-profanity/words.mjs';
import {filterUserText as filterV1} from './kdw-text-policy-v1.mjs';

// Bump when matching rules or dictionaries change: accepted receipts retain their policy.
export const TEXT_POLICY='kdw-text-v2';
export const TEXT_REMOVED_NOTICE='Недопустимое слово удалено';
// Explicit product decision: roots match anywhere, with no benign-word exceptions.
// V1 remains frozen solely for replaying previously accepted receipts.
export const TEXT_ALLOW_WORDS=Object.freeze([]);
const extraWords=[
 'хуйня','хуя','хуе','хуи','хуем','хуями','хуёвина','хуина','хер','хера','хером',
 'херовый','охереть','охуеть','охуенно','охуенный','ахуеть','ахуенный',
 'пизда','пизды','пизде','пизду','пиздой','пиздец','пиздатый','пиздатая','пиздатые',
 'пиздануть','пизданул','пиздит','пиздят','пиздеж','пиздюк','пиздюки','пиздюлина',
 'ебать','ебет','ебаться','ебался','ебалась','ебутся','ебучий','ебучая','ебучее',
 'еблан','ебланы','ебало','ебальник','ебашить','ебашу','ебаный','ебанутая','ебанутый',
 'блять','блядь','бля','блядина','бляди','сука','суки','сучка','сучки','сучара',
 'сучий','сучонок','нахуй','нахуя','нахера','похуй','похера','заебал','заебала',
 'заебали','заебать','заебись','выебал','выебать','въебал','долбоеб','долбоебы',
 'гандон','гандоны','гондон','мудак','мудаки','говна','говном','говнюки',
 'дерьма','дерьмом','дерьмовый','жопы','жопе','жопой','шлюха','шлюхи',
 'fuck','fucked','fucking','shit','shitty','bitch','cunt','dick','whore','slut',
 'bastard','asshole','motherfucker','ebat','blyat','blyad','suka','huy','khuy','nahuy',
 'пенис','порно','порнография','порнографический','секс','сексуальный','эротика',
 'эротический','вагина','клитор','гениталии','анус','оргазм','мастурбация',
 'онанизм','минет','кунилингус','куннилингус','проституция','проститутка',
 'эскорт','педофил','педофилия','изнасилование','инцест','фаллоимитатор',
 'дилдо','вибратор','хентай','шлюхой','щлюха','porn','penis','sex','nude'
];
const ruMap={a:'а',c:'с',e:'е',o:'о',p:'р',x:'х',y:'у',k:'к',m:'м',t:'т',b:'в',h:'н',u:'у',
 'α':'а','ο':'о','ρ':'р','χ':'х','υ':'у','0':'о','3':'з','6':'б','9':'я','@':'а'};
const enMap={'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','у':'y','к':'k','м':'m','т':'t','в':'b','н':'h',
 'α':'a','ο':'o','ρ':'p','χ':'x','υ':'u','ս':'u','і':'i','ı':'i','0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i'};
const clean=s=>s.normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\p{Cf}]/gu,'');
const mapped=(s,map)=>[...s].map(c=>map[c]??c).join('');
const fold=s=>s.normalize('NFKD').replace(/\p{M}/gu,'');
const variants=s=>{const n=clean(s),seeds=[n,n.replace(/\*/g,''),n.replace(/^\d+|\d+$/g,'')],views=seeds.flatMap(v=>[v,mapped(fold(v),enMap),mapped(v,ruMap)]);return [...new Set([...views,...views.map(v=>v.replace(/(.)\1+/gu,'$1'))])];};
const banned=new Set([...Object.values(PROFANITY_DICTIONARIES).flat(),...extraWords]
 .flatMap(variants).filter(w=>[...w].length>=2)); // xxx must not make the letter x itself illegal.
// Stems deliberately include overlaps with ordinary words (e.g. спорно/страхуй).
// Targeted ш/щ and и/й spellings cover reported substitutions without fuzzy guessing.
const roots=[
 'хуй','хуи','хуе','хуя','хую','пизд','пезд','еба','ебу','ебл','ебн','ебы','ебе','ебуч',
 'бля','бляд','блять','бл@','хер','хрен','сука','суки','суч','шлюх','щлюх','шлух','щлух',
 'мудак','мудач','мудил','гандон','гондон','говн','дерьм','жоп','залуп','дроч','пидор','пидар','педик',
 'пенис','пенес','порн','секс','эрот','вагин','клитор','генитал','анус','оргазм',
 'мастурб','онан','минет','кунилинг','куннилинг','проститут','проституц','эскорт',
 'педоф','изнасил','инцест','фалло','дилдо','вибратор','хентай',
 'fuck','shit','bitch','cunt','dick','cock','whore','slut','ass','tit','cum',
 'porn','penis','sex','nude','nudity','vagin','clitor','genital','anus','orgasm',
 'masturb','blowjob','handjob','hentai','dildo','incest','pedoph','paedoph',
 'ebat','ebal','pizd','blya','suka','huy','khuy','shlyuh','shluh','shliuh'
];
const rootViews=[...new Set(roots.flatMap(variants))];
const ruFamily=/^(?:(?:на|за|вы|пере|про|от|под|при|до|об|съ|въ|разъ|раз|по|не|о|а|у)){0,2}(?:пизд[а-я]*|еб(?:а[а-я]*|уч[а-я]*|лан[а-я]*|ло[а-я]*|ну[а-я]*)|ху(?:й[а-я]*|[еи][вплнтм][а-я]*|я(?:ми|м|х|ч[а-я]*)?))$/u;
const latinFamily=/^(?:(?:na|za|vy|pere|pro|ot|pod|pri|do|ob|po|ne|o|a|u)){0,2}(?:pizd[a-z]*|ebat[a-z]*|ebal[a-z]*|ebann[a-z]*|huy[a-z]*|khuy[a-z]*)$/;
const cache=new Map();
function forbidden(word){
 if(cache.has(word))return cache.get(word);
 const views=variants(word),bad=views.some(v=>banned.has(v)||rootViews.some(root=>v.includes(root))||ruFamily.test(v)||latinFamily.test(v));
 if(cache.size>=512)cache.delete(cache.keys().next().value);cache.set(word,bad);return bad;
}
const TOKEN=/(?:[\p{L}\p{N}]|[@$](?=[\p{L}\p{N}]))(?:[\p{L}\p{M}\p{N}\p{Cf}]|[@$!*](?=[\p{L}\p{N}]))*/gu;
/** Offsets always address the original UTF-16 input, including emoji before a match.
 * Strict V2 removes the entire current token as soon as a root is recognizable. */
function filterPass(value,{start=value.length,end=start,final=false}={}){
 const tokens=[...value.matchAll(TOKEN)].map(m=>({word:m[0],start:m.index,end:m.index+m[0].length})),ranges=[];let pending=false;
 const accept=(word,a,b)=>{
  if(!forbidden(word))return;
  ranges.push([a,b]);
 };
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i];accept(t.word,t.start,t.end);
  // A bounded run of short fragments catches f.u.c.k and х у й without joining prose.
  if([...t.word].length>3)continue;
  let joined=t.word;
  for(let j=i+1;j<Math.min(tokens.length,i+8);j++){
   const previous=tokens[j-1],next=tokens[j],gap=value.slice(previous.end,next.start);
   if([...next.word].length>3||!/^([ ._*·\-]){1,3}$/u.test(gap))break;
   // Spaces split prose: only isolated letters may bridge a space boundary.
   if(gap.includes(' ')&&([...previous.word].length!==1||[...next.word].length!==1))break;
   joined+=next.word;if(joined.length>24)break;accept(joined,t.start,next.end);
  }
 }
 ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
 for(const r of ranges){const last=merged.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push([...r]);}
 let text='',offset=0;for(const [a,b]of merged){text+=value.slice(offset,a);offset=b;}text+=value.slice(offset);
 const caret=p=>Math.max(0,p-merged.reduce((n,[a,b])=>n+Math.max(0,Math.min(p,b)-a),0));
 return {value:text,start:caret(start),end:caret(end),removed:merged.length,pending,ranges:merged};
}
export function filterUserText(value,options={}){
 const original=value,removedIndices=new Set();let indices=Array.from({length:value.length},(_,i)=>i),start=options.start??value.length,end=options.end??start,pending=false;
 // Every productive pass removes at least one original code unit. Deletion cannot loop.
 for(let pass=0;pass<=original.length;pass++){
  const r=filterPass(value,{...options,start,end});pending=r.pending;if(!r.removed)break;
  const next=[];for(let i=0;i<indices.length;i++){if(r.ranges.some(([a,b])=>i>=a&&i<b))removedIndices.add(indices[i]);else next.push(indices[i]);}
  indices=next;value=r.value;start=r.start;end=r.end;
 }
 const ranges=[];for(const i of [...removedIndices].sort((a,b)=>a-b)){const last=ranges.at(-1);if(last?.[1]===i)last[1]++;else ranges.push([i,i+1]);}
 return {value,start,end,removed:ranges.length,pending,ranges};
}
export const containsDisallowedText=(value,policy=TEXT_POLICY)=>typeof value==='string'&&(policy==='kdw-text-v1'?filterV1:filterUserText)(value,{final:true}).removed>0;
export const forbiddenFields=(value,policy=TEXT_POLICY)=>['name','description','slug','reply'].some(k=>containsDisallowedText(value?.[k],policy));
/** Old accepted histories replay as authored. New UI stamps both saves and actions. */
export const catalogForTextReceipt=(catalog,receipt)=>receipt.command.textPolicy===TEXT_POLICY?catalog:receipt.command.textPolicy==='kdw-text-v1'?{...catalog,kdwTextReplayVersion:'kdw-text-v1'}:{...catalog,kdwTextReplayLegacy:true};
