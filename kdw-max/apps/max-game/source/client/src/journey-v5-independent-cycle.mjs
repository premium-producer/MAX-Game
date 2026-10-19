import {setup,assign,createActor} from 'xstate';

export const DEFAULT_CYCLE_ASSETS=['device.custom.home-photo-no-benefits','device.custom.tv-first-30s'];
// XState owns the delayed transition. A stopped generation is never restarted;
// native media lifetime remains with the existing device scene.
export function createIndependentCycle({assetFor,onSelect,clock}){
 let actor=null,specKey='',epoch=0,selection=null,closed=false;
 const token=c=>`${c.epoch}:${c.turn}`;
 const machine=setup({
  guards:{current:({context,event})=>event.token===token(context),video:({context})=>assetFor(context.ids[context.index]).kind==='video'},
  delays:{staticWait:({context})=>context.waitSeconds*1000},
  actions:{select:({context})=>{selection={assetId:context.ids[context.index],token:token(context)};onSelect(selection);},next:assign(({context})=>({index:(context.index+1)%context.ids.length,turn:context.turn+1}))}
 }).createMachine({id:'independent-cycle',context:({input})=>input,initial:'preparing',states:{
  preparing:{entry:'select',on:{READY:{guard:'current',target:'route'}}},
  route:{always:[{guard:'video',target:'video'},{target:'static'}]},
  static:{after:{staticWait:{target:'preparing',actions:'next'}},on:{HIDE:'held'}},
  video:{on:{ENDED:{guard:'current',target:'preparing',actions:'next'},HIDE:'held'}},
  held:{on:{READY:{guard:'current',target:'route'}}}
 }});
 return {
  configure(settings){
   if(closed)return false;
   const enabled=settings.cycleEnabled??false,ids=settings.cycleAssetIds??DEFAULT_CYCLE_ASSETS,waitSeconds=settings.staticWaitSeconds??5;
   if(typeof enabled!=='boolean'||!Array.isArray(ids)||ids.length!==2||ids.some(id=>typeof id!=='string'||!assetFor(id))||!Number.isFinite(waitSeconds)||waitSeconds<.5||waitSeconds>3600)throw Error('MAX_ASSET_CYCLE_INVALID');
   const key=JSON.stringify([enabled,ids,waitSeconds]);if(key===specKey)return false;
   actor?.stop();actor=null;selection=null;specKey=key;epoch++;
   if(enabled){actor=createActor(machine,{input:{ids:[...ids],waitSeconds,epoch,index:0,turn:0},...(clock?{clock}:{})});actor.start();}
   return true;
  },
  selected:()=>selection,
  ready(value){actor?.send({type:'READY',token:value});},
  hide(){actor?.send({type:'HIDE'});},
  ended(value){actor?.send({type:'ENDED',token:value});},
  dispose(){if(closed)return;closed=true;actor?.stop();actor=null;selection=null;}
 };
}
