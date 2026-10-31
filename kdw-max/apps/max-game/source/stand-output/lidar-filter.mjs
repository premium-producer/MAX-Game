import {OneEuroFilter} from './vendor/one-euro-filter/OneEuroFilter.mjs';

// Screen pixels and milliseconds, after calibration. No timer can invent a touch.
export const DEFAULT_INPUT_FILTER=Object.freeze({
  enabled:true,minCutoff:1.2,beta:0.006,confirmMs:24,
  maxJumpPx:160,maxGapMs:250,
});

export function inputFilterOptions(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(DEFAULT_INPUT_FILTER,k)))throw Error('Некорректные настройки фильтра лидара');
  const options={...DEFAULT_INPUT_FILTER,...value};
  const ranges={minCutoff:[0.1,20],beta:[0,1],confirmMs:[0,100],maxJumpPx:[20,1000],maxGapMs:[50,350]};
  if(typeof options.enabled!=='boolean'||Object.entries(ranges).some(([key,[min,max]])=>!Number.isFinite(options[key])||options[key]<min||options[key]>max))throw Error('Проверьте параметры сглаживания и подтверждения контакта');
  return options;
}

export function createLidarFilter(value){
  const options=inputFilterOptions(value);
  const xFilter=new OneEuroFilter(60,options.minCutoff,options.beta);
  const yFilter=new OneEuroFilter(60,options.minCutoff,options.beta);
  const stats={accepted:0,suppressed:0,sourceSwitches:0,discontinuities:0};
  let source=null,last=null,candidate=null,lastObservedAt=null,filtered=null;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function reset(){source=null;last=null;candidate=null;lastObservedAt=null;filtered=null;xFilter.reset();yFilter.reset();}
  function accept(point,id,at,restart){
    if(restart){xFilter.reset();yFilter.reset();}
    source=id;last={...point,at};candidate=null;stats.accepted++;
    filtered={...point,x:xFilter.filter(point.x,at/1000),y:yFilter.filter(point.y,at/1000)};
    return {point:filtered,restart};
  }
  return {
    update(point,id,at){
      if(!Number.isFinite(at)||![point?.x,point?.y].every(Number.isFinite)){stats.suppressed++;return null;}
      id=String(id);
      if(!options.enabled){source=id;last={...point,at};filtered={...point};stats.accepted++;return{point:filtered,restart:false};}
      // A repeated/stale sample (including another hand's packet) is not evidence.
      if(lastObservedAt!==null&&at<=lastObservedAt){stats.suppressed++;return null;}
      const gap=lastObservedAt!==null&&at-lastObservedAt>options.maxGapMs||last!==null&&at-last.at>options.maxGapMs;
      if(gap){reset();stats.discontinuities++;}
      lastObservedAt=at;
      const sameSource=source===id;
      if(last&&sameSource&&distance(point,last)<=options.maxJumpPx)return accept(point,id,at,false);

      // A new source or a large isolated jump must persist in fresh samples.
      if(!candidate||candidate.id!==id||distance(point,candidate.previous)>options.maxJumpPx){
        candidate={id,previous:{...point},at,count:1};stats.suppressed++;
        return gap?{cancel:true}:null;
      }
      candidate.previous={...point};candidate.count++;
      if(candidate.count<2||at-candidate.at<options.confirmMs){stats.suppressed++;return gap?{cancel:true}:null;}
      if(source!==null&&!sameSource)stats.sourceSwitches++;
      return accept(point,id,at,true);
    },
    reset,
    snapshot:()=>({options:{...options},...stats,pending:!!candidate,sourceContactId:source,point:filtered?{x:filtered.x,y:filtered.y}:null}),
  };
}
