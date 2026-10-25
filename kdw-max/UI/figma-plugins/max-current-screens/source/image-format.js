// Shared by the pack builder, runtime and tests. Inspect bytes, not file names.
export function imageFormat(b) {
 if(b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return 'png';
 if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return 'jpeg';
 if(b.length>=12&&[82,73,70,70].every((v,i)=>b[i]===v)&&[87,69,66,80].every((v,i)=>b[i+8]===v))return 'webp';
 return 'unknown';
}
