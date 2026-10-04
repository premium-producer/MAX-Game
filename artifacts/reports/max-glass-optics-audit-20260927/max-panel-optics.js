// User's Figma reference. Depth is a visual calibration input, not physical millimetres.
export const PANEL_GLASS_REFERENCE=Object.freeze({lightAngleDegrees:-68,lightIntensity:.7,refraction:100,depth:116.91,dispersion:0,frost:0,splay:0});
export function panelOptics(width){
 const scale=4096/width;
 return {blur:0,shift:Math.min(72,56*scale)}; // Clear refraction, 8 native pixels left inside halo64.
}

// Finite squircle bezel from the surface-profile approach described by kube:
// https://kube.io/blog/liquid-glass-css-svg/ (math, independently implemented).
// Critical: bevel < corner radius. Normals must reach the flat face BEFORE the
// rounded-box distance field's medial axis, where nearest-edge direction flips.
export const PANEL_RADIUS=56;
export const PANEL_BEZEL=48;
// Face magnification is an explicit screen-space lens, separate from Snell's
// edge refraction. See ybouane/liquidglass shaders.ts dome mode (not vendored).
export const PANEL_MAGNIFICATION=1.08;
export const PANEL_OPTICS_GLSL=`
vec3 panelSurface(vec2 p,vec4 b,out float distance,out float height){
 vec2 local=p-b.xy-b.zw*.5;
 vec2 outside=max(abs(local)-(b.zw*.5-${PANEL_RADIUS}.),0.);
 vec2 delta=abs(local)-(b.zw*.5-${PANEL_RADIUS}.);
 distance=length(outside)+min(max(delta.x,delta.y),0.)-${PANEL_RADIUS}.;
 float t=clamp(-distance/${PANEL_BEZEL}.,0.,1.);
 float k=1.-t,k2=k*k,k4=k2*k2;
 height=pow(max(0.,1.-k4),.25);
 // Analytic derivative of h(t)=(1-(1-t)^4)^.25 without infinity at t=0.
 vec2 outward=sign(local)*outside/max(length(outside),.0001);
 return normalize(vec3(outward*k*k2,pow(max(0.,1.-k4),.75)));
}
vec2 panelRayShift(vec3 normal,float height,float ior,float depth,float limit,vec2 local,float inside){
 vec3 ray=refract(vec3(0.,0.,-1.),normal,1./ior);
 vec2 shift=ray.xy/max(-ray.z,.001)*(depth+${PANEL_BEZEL}.*height);
 shift-=local*${1-1/1.08}*smoothstep(0.,${PANEL_BEZEL}.,inside)*clamp((ior-1.)/.46,0.,1.);
 return shift/sqrt(1.+dot(shift,shift)/(limit*limit));
}
`;

// CPU reference for continuity, symmetry and tile-support regression checks.
export function panelSample(p,b,{width=4096,ior=1.46,depth=PANEL_GLASS_REFERENCE.depth}={}){
 const local=p.map((v,i)=>v-b[i]-b[i+2]/2);
 const delta=local.map((v,i)=>Math.abs(v)-(b[i+2]/2-PANEL_RADIUS));
 const outside=delta.map(v=>Math.max(0,v)),length=Math.hypot(...outside);
 const distance=length+Math.min(Math.max(...delta),0)-PANEL_RADIUS;
 const t=Math.max(0,Math.min(1,-distance/PANEL_BEZEL)),k=1-t,a=Math.max(0,1-k**4),height=a**.25;
 const n=[...local.map((v,i)=>Math.sign(v)*outside[i]/Math.max(length,.0001)*k**3),a**.75];
 const norm=Math.hypot(...n),normal=n.map(v=>v/norm),eta=1/ior;
 const nz=normal[2],f=eta*nz-Math.sqrt(1-eta*eta*(1-nz*nz));
 const ray=[f*normal[0],f*normal[1],-eta+f*nz];
 const face=t*t*(3-2*t)*(1-1/PANEL_MAGNIFICATION)*Math.max(0,Math.min(1,(ior-1)/.46));
 const raw=ray.slice(0,2).map((v,i)=>v/Math.max(-ray[2],.001)*(depth+PANEL_BEZEL*height)-local[i]*face);
 const limit=panelOptics(width).shift,denom=Math.sqrt(1+(Math.hypot(...raw)/limit)**2);
 return {distance,normal,shift:raw.map(v=>v/denom),height};
}
