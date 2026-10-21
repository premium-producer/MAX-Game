import {filterUserText} from './kdw-text-policy.mjs';

/** Shared by native/virtual keyboards. This never replaces a field or steals focus. */
export function moderateInput(input,{final=false,limit=Infinity}={}){
 const result=filterUserText(input.value,{start:input.selectionStart??input.value.length,end:input.selectionEnd??input.value.length,final});
 let value=result.value.slice(0,limit);if(/[\uD800-\uDBFF]$/.test(value))value=value.slice(0,-1);
 if(input.value!==value){const direction=input.selectionDirection,top=input.scrollTop,left=input.scrollLeft;input.value=value;input.setSelectionRange(Math.min(value.length,result.start),Math.min(value.length,result.end),direction);input.scrollTop=top;input.scrollLeft=left;}
 return {...result,value};
}
