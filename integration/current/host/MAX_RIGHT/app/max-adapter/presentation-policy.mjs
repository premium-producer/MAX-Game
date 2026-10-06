const MODES=new Set(['standard','background','assets']);
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export function presentationState(value){
 if(!value||typeof value!=='object'||!MODES.has(value.desiredMode)||(value.effectiveMode!==null&&!MODES.has(value.effectiveMode))||!Number.isSafeInteger(value.revision)||value.revision<0||!Number.isSafeInteger(value.modeEpoch)||value.modeEpoch<0||typeof value.phase!=='string')throw Object.assign(Error('MAX_PRESENTATION_INVALID'),{code:'MAX_PRESENTATION_INVALID',status:503});
 return value;
}
export function presentationCommand(action,value){
 const fields=action==='attach'?['rendererBootId','expectedEpoch']:action==='ack'?['rendererBootId','revision','modeEpoch','mode']:[];
 if(!fields.length||!value||Object.keys(value).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(value,k))||!ID.test(value.rendererBootId??'')||(action==='attach'? !Number.isSafeInteger(value.expectedEpoch)||value.expectedEpoch<0:!Number.isSafeInteger(value.revision)||value.revision<0||!Number.isSafeInteger(value.modeEpoch)||value.modeEpoch<0||!MODES.has(value.mode)))throw Object.assign(Error('MAX_PRESENTATION_COMMAND_INVALID'),{code:'MAX_PRESENTATION_COMMAND_INVALID',status:400});
 return value;
}
