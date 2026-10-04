// Versioned optical variants of ONE rear canvas. Simulation and authored layout
// are preserved; neither server owns an independent background look.
export const REAR_LOOK_ID='luminous-material-v6';
export const REAR_LOOKS=Object.freeze({
 'continuous-v1':Object.freeze({underlayGain:1,dyeGain:1}),
 'contrast-flow-v2':Object.freeze({underlayGain:.32,dyeGain:3,
  highlights:Object.freeze({threshold:.045,width:.38,gain:2.2,cyan:1}),
  neon:Object.freeze({bloom:1.3,radius:10,knee:1.4}),
  lighting:Object.freeze({gain:2.4,spill:.008,radius:1.1,softness:.55})}),
 'broad-flow-v3':Object.freeze({underlayGain:.32,dyeGain:3,ambientGlow:.42,
  sourceRadius:.12,sourceRadiusStep:.02,sourceSpread:.85,
  highlights:Object.freeze({threshold:.045,width:.38,gain:2.2,cyan:1}),
  neon:Object.freeze({bloom:1.3,radius:10,knee:1.4}),
  lighting:Object.freeze({gain:2.4,spill:.008,radius:1.1,softness:.55})}),
 'fine-core-v4':Object.freeze({underlayGain:.32,dyeGain:1,ambientGlow:.22,
  sourceRadius:.12,sourceRadiusStep:.02,sourceSpread:.85,exposure:1.8,
  contour:Object.freeze({level:1.05,width:.10,density:3,haloWidth:.65,haloGain:.32}),
  highlights:Object.freeze({threshold:.32,width:.5,gain:.65,cyan:.2}),
  neon:Object.freeze({bloom:.85,radius:16,knee:1.4}),
  lighting:Object.freeze({gain:1.25,spill:.005,radius:.7,softness:.35})}),
 'luminous-material-v6':Object.freeze({organic:true,luminous:true,underlayGain:1,dyeGain:1,exposure:1,highlights:Object.freeze({threshold:.32,width:.5,gain:.8,cyan:.25}),neon:Object.freeze({bloom:.8,radius:14,knee:1.4}),lighting:Object.freeze({gain:1.1,spill:.005,radius:.7,softness:.35})}),
 'organic-material-v5':Object.freeze({organic:true,underlayGain:1,dyeGain:1,exposure:1.4,
  highlights:Object.freeze({threshold:.32,width:.5,gain:.8,cyan:.25}),
  neon:Object.freeze({bloom:.8,radius:14,knee:1.4}),
  lighting:Object.freeze({gain:1.1,spill:.005,radius:.7,softness:.35})})
});
export const REAR_CONTRAST=REAR_LOOK_ID!=='continuous-v1';
export const REAR_STYLE=REAR_LOOKS[REAR_LOOK_ID];
export const LUMINOUS_ENABLED=Boolean(REAR_STYLE.luminous);
export const ORGANIC_ENABLED=Boolean(REAR_STYLE.organic);
export const surfaceStyleSettings=(s,rear=false)=>rear||ORGANIC_ENABLED?rearStyleSettings(s):s;
export function rearStyleSettings(s,id=REAR_LOOK_ID){
 if(id==='continuous-v1')return s;
 const p=REAR_LOOKS[id];if(!p)throw Error('Unknown rear-wall look: '+id);
 return {...s,highlights:{...s.highlights,...p.highlights},neon:{...s.neon,...p.neon},
  lighting:{...s.lighting,...p.lighting},blue:{...s.blue,saturation:1,fluidSaturation:0},
  cellDepth:{...s.cellDepth,blur:.8},vortex:{...s.vortex,exposure:p.exposure??2.4}};
}
// Bounded optical response to transported dye, independent of simulation state.
// High-density interiors no longer become a filled emissive plateau.
export function rearContourResponse(density,id=REAR_LOOK_ID){
 const style=REAR_LOOKS[id],c=style.contour,d=Math.max(0,density);
 if(!c)return {core:d*style.dyeGain,halo:0};
 const t=Math.min(1,d/.3),gate=t*t*(3-2*t),distance=d-c.level;
 return {core:Math.exp(-((distance/c.width)**2))*c.density*gate,
  halo:(Math.exp(-((distance/c.haloWidth)**2))+.24*Math.exp(-((distance/(c.haloWidth*2.4))**2)))*c.haloGain*gate};
}
