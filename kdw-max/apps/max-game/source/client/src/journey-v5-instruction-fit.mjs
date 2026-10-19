// Logical host coordinates. Never feed a previously shifted pose back into fit.
export const V5_INSTRUCTION_WIDTH=760;
export function v5InstructionShift({phoneX,cameraX,deviceWidth,hostWidth,visible=false,gap=64,padding=32}){
 if(!visible)return 0;
 const right=phoneX-cameraX+deviceWidth/2+gap+V5_INSTRUCTION_WIDTH;
 return Math.max(0,right-(hostWidth-padding));
}
