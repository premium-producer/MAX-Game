// A world point has exactly one field coordinate, irrespective of surface/UV seam.
export const FIELD_SIZE=Object.freeze([192,72]);
export const BACKGROUND_DEFAULTS=Object.freeze({blue:'#0077FF',deepBlue:'#0040FF',purple:'#471AFF',violet:'#9500FF',transitionX:.75,transitionWidth:1.8,purpleAmount:1});
export const backgroundSettings=s=>({...BACKGROUND_DEFAULTS,...s});
export function validBackground(s){return s&&['blue','deepBlue','purple','violet'].every(k=>/^#[0-9a-f]{6}$/i.test(s[k]))&&[['transitionX',-4,4],['transitionWidth',.2,6],['purpleAmount',0,1]].every(([k,a,b])=>Number.isFinite(s[k])&&s[k]>=a&&s[k]<=b);}
export function worldFieldUV(p){return [(p[0]+p[2]*.35+4.5)/10,(p[1]+.3)/3.8];}
export function worldAtUV(mesh,u,v){
 const {uv,positions,indices}=mesh;
 for(let n=0;n<indices.length;n+=3){const [a,b,c]=indices.slice(n,n+3),A=uv[a],B=uv[b],C=uv[c],d=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(Math.abs(d)<1e-12)continue;
  const x=((B[1]-C[1])*(u-C[0])+(C[0]-B[0])*(v-C[1]))/d,y=((C[1]-A[1])*(u-C[0])+(A[0]-C[0])*(v-C[1]))/d,z=1-x-y;
  if(Math.min(x,y,z)>=-1e-5)return positions[a].map((q,i)=>q*x+positions[b][i]*y+positions[c][i]*z);
 }return null;
}
export const FIELD_COORD_GLSL=`vec2 worldFieldUV(vec3 p){return vec2((p.x+p.z*.35+4.5)/10.,(p.y+.3)/3.8);}`;
