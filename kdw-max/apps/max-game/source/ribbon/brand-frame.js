import * as THREE from 'three';

// One original SVG texture shared by all cards in this module/context.
export const brandFrameUniform={value:null};
let frameReady;
export function ensureBrandFrame(){
 return frameReady??=new THREE.TextureLoader().loadAsync(new URL('./assets/brands/vk-video/assets/graphics/frame-main.svg',import.meta.url).href).then(texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;
  brandFrameUniform.value=texture;
  return texture;
 });
}

// Source: vk-video-frame-main, 1501 x 844. Nine-slice preserves the original
// corner shapes, strokes and glow; only straight horizontal spans adapt.
export const BRAND_FRAME_GLSL=`
uniform sampler2D uBrandFrame;
float vkRect(vec2 p,vec2 halfSize,float radius){vec2 q=abs(p)-halfSize+radius;return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;}
vec3 vkLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
float vkSliceX(float x,float width){
 const float edge=140.;
 if(x<edge)return x;
 if(x>width-edge)return 1501.-(width-x);
 return edge+(x-edge)*(1501.-2.*edge)/(width-2.*edge);
}
vec4 vkFrame(sampler2D map,vec2 uv,float aspect,vec4 crop,float mediaAspect,bool videoSRGB){
 if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec4(0.);
 vec2 size=vec2(aspect,1.)*844.,p=uv*size;
 vec2 frameUV=vec2(vkSliceX(p.x,size.x)/1501.,uv.y);
 // Use the physical pixel footprint, not the stretched center UV derivative.
 // Otherwise mip selection smears the horizontal strokes on portrait cards.
 vec4 frame=textureGrad(uBrandFrame,frameUV,dFdx(p)/vec2(1501.,844.),dFdy(p)/vec2(1501.,844.));
 // Original inner red stroke: x=81..1419, y=71..773, width=5.89492.
 // Keep the stroke intact; replace only its black interior with media.
 vec2 low=vec2(83.94746,73.94746),high=vec2(size.x-84.94746,size.y-73.94746);
 vec2 center=(low+high)*.5,halfSize=(high-low)*.5;
 float d=vkRect(p-center,halfSize,8.01344),aa=max(fwidth(d),.1);
 float inside=1.-smoothstep(-aa,aa,d);
 vec2 aperture=(p-low)/(high-low);float apertureAspect=halfSize.x/halfSize.y;
 vec2 fit=vec2(max(1.,apertureAspect/mediaAspect),max(1.,mediaAspect/apertureAspect));
 vec2 sourceUV=(aperture-.5)*fit+.5;
 vec4 content=texture2D(map,crop.xy+clamp(sourceUV,0.,1.)*crop.zw);
 if(any(lessThan(sourceUV,vec2(0.)))||any(greaterThan(sourceUV,vec2(1.))))content=vec4(0.,0.,0.,1.);
 if(videoSRGB)content.rgb=vkLinear(content.rgb);
 // SVG/image sampling decodes sRGB; video is decoded exactly once.
 return vec4(mix(frame.rgb,content.rgb*content.a,inside),1.);
}
`;
