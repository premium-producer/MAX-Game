function p(o){return{...o,kind:"number",live:o.live??"uniform",gpu:o.gpu??!1}}function ye(o){return{...o,kind:"int",live:o.live??"uniform",gpu:o.gpu??!1}}function re(o){let e=o.min??0,t=o.max??360;return{...o,kind:"angle",min:e,max:t,step:o.step??1,unit:"\xB0",fullCircle:t-e>=360,live:o.live??"uniform",gpu:o.gpu??!1}}function we(o){return{...o,kind:"boolean",live:o.live??"uniform",gpu:o.gpu??!1}}function Qe(o){return{...o,kind:"color",live:o.live??"uniform",gpu:o.gpu??!1}}function Te(o){return{...o,kind:"vec2",live:o.live??"uniform",gpu:o.gpu??!1}}function j(o){return{...o,kind:"enum",transition:o.transition??"instant",live:o.live??"uniform",gpu:o.gpu??!1}}function Ti(o){return{...o,kind:"palette",minStops:o.minStops??1,maxStops:o.maxStops??32,live:o.live??"lut",gpu:o.gpu??!1}}function k(o,e){let{kind:t,...i}=o,r={...i,kind:"group",fields:e};return t==="mode"&&(r.role="mode"),r}function R(o){return o?.kind==="group"}var xr=k({label:"Grid",order:10,description:"Size and shape of the pixel-grid cells."},{sizing:j({values:["pitch","count"],default:"count",label:"Cell sizing",description:"Size the grid by a fixed pitch in pixels or by the number of cells along the shorter side of the container.",labels:{pitch:"Pitch in px",count:"Cell count"},live:"realloc"}),pitch:p({min:4,max:96,step:1,unit:"px",default:24,label:"Pitch",description:"Distance between the centers of neighboring cells, in CSS pixels.",live:"realloc",visibleWhen:{path:"grid.sizing",eq:"pitch"}}),count:ye({min:8,max:200,step:1,default:31,label:"Cells",description:"How many cells fit along the shorter side of the container, so the composition looks the same in a square, a banner or full screen.",live:"realloc",visibleWhen:{path:"grid.sizing",eq:"count"}}),gap:p({min:.02,max:.6,step:.01,default:.27,label:"Gap",description:"Fraction of the pitch taken by the dark gap between cells.",gpu:!0}),roundness:p({min:0,max:1,step:.01,default:.3,label:"Roundness",description:"Corner radius as a fraction of half a cell: 0 is a square, 1 is a circle.",gpu:!0}),softness:p({min:0,max:3,step:.05,unit:"px",default:.6,label:"Edge softness",description:"Feathering of the cell edge, in device pixels.",gpu:!0}),emitter:p({min:0,max:.6,step:.01,default:.18,label:"Emitter",description:"How much brighter the center of a cell is than its edges.",gpu:!0}),bevel:p({min:0,max:.15,step:.01,default:0,label:"Bevel",description:"Subtle depth: a light top edge and a dark bottom edge on each cell.",gpu:!0,advanced:!0})}),_r=k({label:"Composition",order:20,description:"Position and scale of the whole picture inside the container."},{center:Te({min:-1,max:1,step:.01,default:[-.02,-.02],label:"Center",description:"Composition center in mode units (1 = half of the shorter side).",gpu:!0}),zoom:p({min:.25,max:4,step:.01,scale:"log",default:1,label:"Zoom",description:"Magnifies all modes around the center.",gpu:!0})}),vr=k({label:"Animation",order:30,description:"Global speed, mode blending and cell liveliness."},{speed:p({min:0,max:4,step:.01,default:1,label:"Speed",description:"Global time multiplier for all modes."}),blend:j({values:["screen","add","max"],default:"screen",label:"Mode blending",description:"How several active modes are combined.",labels:{screen:"Screen",add:"Add",max:"Max"},gpu:!0}),brightness:p({min:0,max:3,step:.01,default:1,label:"Brightness",description:"Cell intensity multiplier.",gpu:!0}),gamma:p({min:.3,max:3,step:.01,default:1.15,label:"Contrast (gamma)",description:"Values above 1 darken the midtones and increase contrast.",gpu:!0}),floor:p({min:0,max:.5,step:.01,default:.16,label:"Unlit visibility",description:"How visible the unlit cells are.",gpu:!0}),energy:p({min:0,max:3,step:.01,default:1,label:"Energy",description:"External drive: handy for modulating with audio or events.",gpu:!0}),flicker:k({label:"Flicker",description:"Slow random brightness breathing of each cell."},{amount:p({min:0,max:1,step:.01,default:.4,label:"Amount",description:"Flicker amplitude.",gpu:!0}),rate:p({min:.05,max:5,step:.01,unit:"Hz",default:.3,label:"Rate",description:"How fast the brightness changes.",gpu:!0})}),sparkle:k({label:"Sparkle",description:"Rare short flashes of individual cells."},{amount:p({min:0,max:2,step:.01,default:.35,label:"Amount",description:"Brightness added during a flash.",gpu:!0}),rate:p({min:0,max:.05,step:.001,default:.008,label:"Rate",description:"Flash probability per cell per second.",gpu:!0}),duration:p({min:.1,max:2,step:.01,unit:"s",default:.5,label:"Duration",description:"Length of a single flash.",gpu:!0})}),sparsity:k({label:"Sparsity",description:"On the outskirts cells switch off entirely instead of dimming."},{amount:p({min:0,max:1,step:.01,default:.55,label:"Amount",description:"Share of switched-off cells in weak areas.",gpu:!0}),period:p({min:.5,max:10,step:.1,unit:"s",default:3,label:"Period",description:"How often the switched-off cells are reshuffled.",gpu:!0})})}),ne=(o,e="Weight")=>p({min:0,max:1,step:.01,default:o,label:e,description:"Contribution of the mode to the final image; 0 turns the mode off.",gpu:!0}),yr=k({label:"Animation modes",order:40,description:"Layers of the brightness field; several modes can be mixed at once."},{flow:k({label:"Flow",kind:"mode",description:"A smoothly flowing noise pattern."},{weight:ne(.1),scale:p({min:.2,max:8,step:.01,scale:"log",default:1.6,label:"Scale",description:"Noise frequency: higher values give smaller blobs.",gpu:!0}),speed:p({min:0,max:3,step:.01,default:.25,label:"Speed",description:"How fast the pattern flows."}),direction:re({default:30,label:"Direction",description:"Where the pattern flows.",gpu:!0}),threshold:p({min:0,max:1,step:.01,default:.45,label:"Threshold",description:"Higher values leave fewer glowing blobs.",gpu:!0}),softness:p({min:.02,max:1,step:.01,default:.3,label:"Softness",description:"Width of the transition from dark to light.",gpu:!0})}),sphere:k({label:"Sphere",kind:"mode",description:"A glowing hollow orb with a rim and a soft fade."},{weight:ne(1),radius:p({min:.1,max:1.6,step:.01,default:.68,label:"Radius",description:"Sphere radius in mode units.",gpu:!0}),shift:Te({min:-1,max:1,step:.01,default:[.02,.16],label:"Shell offset",description:"Offset of the glowing shell relative to the hole: the ring is thicker and denser on that side while the hole stays centered.",gpu:!0}),hole:p({min:0,max:.9,step:.01,default:.25,label:"Hole",description:"Radius of the dark middle; 0 gives a solid orb.",gpu:!0}),holeSoftness:p({min:.01,max:.5,step:.01,default:.12,label:"Hole softness",description:"Width of the transition from the hole to the bright ring.",gpu:!0}),rimPower:p({min:.3,max:6,step:.01,default:1.3,label:"Rim",description:"Higher values push the light toward the edge of the sphere.",gpu:!0}),outerFalloff:p({min:.05,max:1.5,step:.01,default:.38,label:"Outer falloff",description:"How far the light reaches beyond the sphere radius.",gpu:!0}),lightAngle:re({default:200,label:"Light direction",description:"Which side of the sphere is lit more strongly.",gpu:!0}),lightStrength:p({min:0,max:1,step:.01,default:.45,label:"Light strength",description:"Contrast between the lit side and the shadow side.",gpu:!0}),rotationSpeed:p({min:-2,max:2,step:.01,default:.12,label:"Rotation",description:"Rotation speed of the sphere surface (the sign sets the direction)."}),tilt:re({min:-60,max:60,default:20,label:"Axis tilt",description:"Tilt of the rotation axis.",gpu:!0}),surface:p({min:0,max:1,step:.01,default:.55,label:"Surface",description:"Strength of the pattern on the sphere surface.",gpu:!0}),surfaceScale:p({min:.5,max:8,step:.01,default:2.5,label:"Surface scale",description:"Frequency of the surface pattern.",gpu:!0}),wobble:p({min:0,max:.3,step:.005,default:.08,label:"Wobble",description:"Noise distortion of the sphere outline.",gpu:!0}),breathe:p({min:0,max:.2,step:.005,default:.025,label:"Breathing",description:"Amplitude of the radius pulsation.",gpu:!0}),breatheSpeed:p({min:0,max:3,step:.01,default:.35,label:"Breathing rate",description:"Frequency of the radius pulsation."}),fadeAngle:re({default:345,label:"Fade side",description:"Direction in which the sphere dissolves into the background.",gpu:!0}),fadeAmount:p({min:0,max:1,step:.01,default:1,label:"Fade amount",description:"How strongly the fade side dims.",gpu:!0})}),pulse:k({label:"Pulse",kind:"mode",description:"Concentric rings spreading from the center."},{weight:ne(0),speed:p({min:0,max:3,step:.01,default:.45,label:"Speed",description:"How fast the rings expand."}),frequency:p({min:.5,max:12,step:.01,default:3,label:"Frequency",description:"Rings per mode unit.",gpu:!0}),width:p({min:.02,max:.6,step:.01,default:.14,label:"Width",description:"Ring thickness.",gpu:!0}),breathe:p({min:0,max:1,step:.01,default:.35,label:"Breathing",description:"Overall brightness pulsation.",gpu:!0}),falloff:p({min:0,max:3,step:.01,default:1,label:"Falloff",description:"How fast the rings fade with distance.",gpu:!0}),origin:Te({min:-1,max:1,step:.01,default:[0,0],label:"Origin",description:"Ring center relative to the composition center.",gpu:!0})}),wave:k({label:"Waves",kind:"mode",description:"Traveling plane waves with interference."},{weight:ne(0),angle:re({default:20,label:"Direction",description:"Direction in which the waves travel.",gpu:!0}),frequency:p({min:.2,max:12,step:.01,default:2.5,label:"Frequency",description:"Crests per mode unit.",gpu:!0}),speed:p({min:0,max:3,step:.01,default:.5,label:"Speed",description:"How fast the waves travel."}),sharpness:p({min:0,max:1,step:.01,default:.35,label:"Sharpness",description:"Higher values give narrow bright crests.",gpu:!0}),interference:p({min:0,max:1,step:.01,default:.5,label:"Interference",description:"Mix of a second wave at a different angle.",gpu:!0})}),ripple:k({label:"Ripples",kind:"mode",description:"Random rings, like drops falling on water."},{weight:ne(0),rate:p({min:0,max:6,step:.01,unit:"/s",default:1.2,label:"Rate",description:"How many drops appear per second.",gpu:!0}),speed:p({min:.05,max:2,step:.01,default:.4,label:"Speed",description:"How fast a ring expands.",gpu:!0}),width:p({min:.02,max:.4,step:.01,default:.09,label:"Width",description:"Ring thickness.",gpu:!0}),life:p({min:.5,max:6,step:.1,unit:"s",default:2.5,label:"Lifetime",description:"How long a single ring lives.",gpu:!0})}),vortex:k({label:"Vortex",kind:"mode",description:"Twisted spiral arms."},{weight:ne(0),arms:ye({min:1,max:8,step:1,default:3,label:"Arms",description:"Number of spiral arms.",gpu:!0}),twist:p({min:-10,max:10,step:.1,default:3,label:"Twist",description:"How tightly the arms are wound (the sign sets the direction).",gpu:!0}),speed:p({min:-3,max:3,step:.01,default:.3,label:"Speed",description:"Rotation speed of the vortex."}),falloff:p({min:0,max:3,step:.01,default:.9,label:"Falloff",description:"How fast the vortex fades away from the center.",gpu:!0}),sharpness:p({min:0,max:1,step:.01,default:.4,label:"Sharpness",description:"Crispness of the arm edges.",gpu:!0})}),life:k({label:"Life",kind:"mode",description:"A cellular automaton in the spirit of Conway's Game of Life."},{weight:ne(0),stepRate:p({min:1,max:30,step:.1,unit:"Hz",default:8,label:"Steps per second",description:"Evolution speed of the automaton."}),birthRate:p({min:0,max:.05,step:5e-4,default:.004,label:"Spontaneous births",description:"Chance of a random cell birth per step; keeps the field from dying out."}),fadeSteps:ye({min:1,max:16,step:1,default:4,label:"Fade",description:"How many steps a dead cell takes to fade out.",gpu:!0}),seedDensity:p({min:0,max:1,step:.01,default:.3,label:"Seed density",description:"Share of live cells after a reset."}),rule:j({values:["conway","highlife","daynight","seeds"],default:"conway",label:"Rule",description:"Birth and survival rule; changing it restarts the field.",labels:{conway:"Conway B3/S23",highlife:"HighLife B36/S23",daynight:"Day & Night",seeds:"Seeds B2/S"},live:"restart"})}),rain:k({label:"Rain",kind:"mode",description:"Falling glowing drops with a trail."},{weight:ne(0),speed:p({min:.1,max:5,step:.01,default:1,label:"Speed",description:"How fast the drops fall."}),density:p({min:0,max:1,step:.01,default:.25,label:"Density",description:"Share of columns with rain.",gpu:!0}),tail:p({min:.05,max:1.5,step:.01,default:.5,label:"Trail",description:"Length of the glowing trail behind a drop.",gpu:!0}),angle:re({min:-45,max:45,default:0,label:"Slant",description:"Deviation of the rain from vertical.",gpu:!0})})}),wr=k({label:"Color",order:50,description:"The palette and how it is laid over the grid."},{palette:Ti({default:["#a0206a","#f21239","#e0267a","#5a44d0","#2a55e0","#1f5fe8","#0870f8","#0476ff","#0a84f2","#0a8cf0","#0a78e8","#0b5ccc"],minStops:1,maxStops:32,label:"Palette",description:"Gradient color stops, from start to end."}),interpolation:j({values:["oklab","linear","steps"],default:"oklab",label:"Interpolation",description:"How neighboring palette colors are blended.",labels:{oklab:"OKLab (smooth)",linear:"Linear (RGB)",steps:"Steps"},live:"lut"}),mapping:j({values:["spatial","radial","angular","intensity","noise"],default:"spatial",label:"Mapping",description:"What sets the position of a cell on the palette.",labels:{spatial:"Along axis",radial:"Radial",angular:"Angular",intensity:"By brightness",noise:"Noise"},transition:"crossfade",gpu:!0}),angle:re({default:22,label:"Axis angle",description:"Direction from the start of the palette to its end (axis mapping).",gpu:!0}),bend:p({min:-1,max:1,step:.01,default:.35,label:"Axis bend",description:"Bends the color boundaries into arcs around the center (axis mapping): the start color gathers into a crescent on one side.",gpu:!0}),scale:p({min:.1,max:4,step:.01,scale:"log",default:1,label:"Stretch",description:"Higher values repeat the palette more often.",gpu:!0}),offset:p({min:-1,max:1,step:.01,default:0,label:"Offset",description:"Shifts the palette along the mapping.",gpu:!0}),warp:p({min:0,max:1,step:.01,default:.12,label:"Warp",description:"Noise distortion of the color boundaries.",gpu:!0}),warpScale:p({min:.2,max:6,step:.01,default:1.3,label:"Warp scale",description:"Frequency of the warp noise.",gpu:!0}),jitter:p({min:0,max:.5,step:.01,default:.12,label:"Jitter",description:"Random color offset of each cell.",gpu:!0}),intensityShift:p({min:-1,max:1,step:.01,default:.12,label:"Brightness shift",description:"Bright cells move along the palette.",gpu:!0}),drift:p({min:-.5,max:.5,step:.001,default:0,label:"Drift",description:"Palette scrolling, in cycles per second."}),saturation:p({min:0,max:2,step:.01,default:1.05,label:"Saturation",description:"Saturation of the cell colors.",gpu:!0}),hot:k({label:"Hot core",description:"The brightest cells turn lighter in a tint of their own color."},{amount:p({min:0,max:1,step:.01,default:.15,label:"Amount",description:"How much the bright cells lighten.",gpu:!0}),threshold:p({min:0,max:1,step:.01,default:.92,label:"Threshold",description:"Brightness at which the hot core starts.",gpu:!0}),core:p({min:.1,max:1,step:.01,default:.8,label:"Core",description:"Size of the hot middle of a cell.",gpu:!0})}),accent:k({label:"Accent",description:"Organic patches of a second color on the inner edge of the sphere, only in the cool half of the palette (teal within blue)."},{color:Qe({default:"#12c0d8",label:"Color",description:"Color of the accent patches.",gpu:!0}),amount:p({min:0,max:1,step:.01,default:.9,label:"Amount",description:"How strongly the patches take the accent color; 0 turns it off.",gpu:!0})})}),Ri=(o,e,t,i,r)=>k({label:o,description:"A soft color spot on the background."},{color:Qe({default:e,label:"Color",description:"Spot color.",gpu:!0}),position:Te({min:-2,max:2,step:.01,default:t,label:"Position",description:"Spot center in mode units.",gpu:!0}),radius:p({min:.1,max:4,step:.01,default:i,label:"Radius",description:"Spot size.",gpu:!0}),strength:p({min:0,max:1,step:.01,default:r,label:"Strength",description:"Spot brightness.",gpu:!0})}),Pr=k({label:"Background",order:60,description:"The backdrop under the grid: color, vignette and color spots."},{color:Qe({default:"#000032",label:"Color",description:"Main background color.",gpu:!0}),vignette:p({min:0,max:1,step:.01,default:.35,label:"Vignette",description:"Darkens the background corners (the cells are not affected).",gpu:!0}),spotA:Ri("Spot A","#6a1f6e",[-1.3,-.2],1.25,.65),spotB:Ri("Spot B","#16207e",[-.8,1.1],.9,.5)}),kr=k({label:"Glow",order:70,description:"Halo around the cells, bloom and atmospheric haze."},{halo:k({label:"Halo",description:"Dense glow in the gaps around the cells."},{strength:p({min:0,max:2,step:.01,default:.5,label:"Strength",description:"Halo brightness.",gpu:!0}),radius:p({min:.02,max:.5,step:.01,unit:"cells",default:.18,label:"Radius",description:"How far the halo reaches into the gap.",gpu:!0})}),bloom:k({label:"Bloom",description:"Soft glow of the bright areas."},{strength:p({min:0,max:2,step:.01,default:.8,label:"Strength",description:"Bloom brightness.",gpu:!0}),radius:p({min:.5,max:3,step:.05,unit:"cells",default:1.3,label:"Radius",description:"Bloom blur width, in cells."}),threshold:p({min:0,max:1,step:.01,default:.35,label:"Threshold",description:"Brightness at which a cell starts to glow.",gpu:!0}),knee:p({min:0,max:1,step:.01,default:.5,label:"Threshold knee",description:"Softness of the transition through the threshold.",gpu:!0})}),haze:k({label:"Haze",description:"Wide atmospheric glow."},{strength:p({min:0,max:1,step:.01,default:.12,label:"Strength",description:"Haze brightness.",gpu:!0}),radius:p({min:2,max:12,step:.1,unit:"cells",default:4,label:"Radius",description:"Haze blur width, in cells."})}),saturation:p({min:0,max:2,step:.01,default:1.15,label:"Glow saturation",description:"Saturation of the halo, bloom and haze.",gpu:!0}),exposure:p({min:.2,max:4,step:.01,scale:"log",default:1,label:"Exposure",description:"Overall brightness before tone mapping.",gpu:!0}),whitePoint:p({min:1,max:16,step:.1,default:4,label:"White point",description:"Brightness that maps to white; higher values give softer highlights.",gpu:!0})}),Ni={path:"lift.style",eq:"float"},Er=k({label:"Lifted pixels",order:80,description:"Individual cells rise above the grid and settle back."},{enabled:we({default:!0,label:"Enabled",description:"Show lifted pixels."}),style:j({values:["pop","float"],default:"pop",label:"Style",description:"Pop up in place or float upward like bubbles.",labels:{pop:"Pop",float:"Float"}}),amount:p({min:0,max:.06,step:.001,default:.016,label:"Amount",description:"Share of cells lifted at the same time."}),max:ye({min:0,max:128,step:1,default:96,label:"Maximum",description:"Limit on simultaneously lifted cells.",live:"static"}),scale:p({min:1,max:2.5,step:.01,default:1.5,label:"Scale",description:"How many times larger a lifted cell is."}),height:p({min:0,max:2,step:.01,unit:"cells",default:.35,label:"Height",description:"Upward offset while lifted."}),parallax:p({min:0,max:.3,step:.01,default:.06,label:"Parallax",description:"Offset away from the center that adds a sense of depth."}),tilt:p({min:0,max:20,step:.5,unit:"\xB0",default:6,label:"Tilt",description:"Random tilt of a lifted cell."}),holdMin:p({min:.2,max:10,step:.1,unit:"s",default:1.5,label:"Hold min",description:"Minimum time spent lifted."}),holdMax:p({min:.2,max:10,step:.1,unit:"s",default:3.5,label:"Hold max",description:"Maximum time spent lifted."}),rise:p({min:.1,max:2,step:.01,unit:"s",default:.6,label:"Rise",description:"Rise duration (with a springy overshoot)."}),fall:p({min:.1,max:2,step:.01,unit:"s",default:.45,label:"Fall",description:"Duration of the return to place."}),brightness:p({min:0,max:2,step:.01,default:.9,label:"Brightness",description:"Extra brightness of a lifted cell.",gpu:!0}),whiten:p({min:0,max:1,step:.01,default:.12,label:"Whiten",description:"Shifts the color toward a lighter tint.",gpu:!0}),bokeh:p({min:0,max:1,step:.01,default:.3,label:"Bokeh",description:"Share of lifted cells blurred as if out of focus."}),shadow:p({min:0,max:1,step:.01,default:.4,label:"Shadow",description:"Density of the shadow under a lifted cell.",gpu:!0}),halo:p({min:0,max:2,step:.01,default:.8,label:"Halo",description:"Glow around a lifted cell.",gpu:!0}),socket:p({min:0,max:1,step:.01,default:.6,label:"Socket",description:"How much the spot a cell rose from darkens."}),threshold:p({min:0,max:1,step:.01,default:.2,label:"Threshold",description:"Minimum cell brightness required to lift.",gpu:!0}),outerBias:p({min:0,max:1,step:.01,default:.85,label:"Edge bias",description:"Prefer outer and dim areas."}),cluster:p({min:0,max:.5,step:.01,default:.15,label:"Clusters",description:"Chance to lift neighboring cells together with a cell."}),landing:p({min:0,max:1,step:.01,default:.25,label:"Landing",description:"Strength of the ripple ring when a cell lands."}),floatSpeed:p({min:.1,max:4,step:.01,unit:"cells/s",default:.9,label:"Float speed",description:"Rise speed in the Float style.",visibleWhen:Ni}),floatDrift:p({min:0,max:1,step:.01,default:.4,label:"Drift",description:"Sideways sway while floating.",visibleWhen:Ni})}),Sr=k({label:"Interaction",order:90,description:"Response to the pointer and clicks, and defaults for bound elements."},{pointer:we({default:!1,label:"Pointer",description:"Light up the cells under the pointer."}),pointerRadius:p({min:1,max:30,step:.5,unit:"cells",default:4,label:"Pointer radius",description:"Size of the light spot around the pointer.",visibleWhen:{path:"interaction.pointer",eq:!0}}),pointerStrength:p({min:0,max:2,step:.01,default:.6,label:"Pointer strength",description:"Brightness of the highlight under the pointer.",visibleWhen:{path:"interaction.pointer",eq:!0}}),pointerLift:we({default:!0,label:"Lift on hover",description:"Lift cells under the pointer.",visibleWhen:{path:"interaction.pointer",eq:!0}}),click:we({default:!0,label:"Click",description:"Start a ripple on click."}),rippleStrength:p({min:0,max:2,step:.01,default:.8,label:"Ripple strength",description:"Brightness of the click ripple.",visibleWhen:{path:"interaction.click",eq:!0}}),rippleSpeed:p({min:2,max:60,step:.5,unit:"cells/s",default:18,label:"Ripple speed",description:"How fast the ripple expands.",visibleWhen:{path:"interaction.click",eq:!0}}),rippleWidth:p({min:.5,max:6,step:.1,unit:"cells",default:1.5,label:"Ripple width",description:"Thickness of the ripple ring.",visibleWhen:{path:"interaction.click",eq:!0}}),influenceStrength:p({min:0,max:2,step:.01,default:.8,label:"Influence strength",description:"Default strength for bound elements (bindElement / addInfluence)."}),influenceFalloff:p({min:.2,max:10,step:.1,unit:"cells",default:2,label:"Influence falloff",description:"Default width of the soft edge of an influence."})}),Ar=k({label:"Performance",order:100,advanced:!0,description:"Quality, resolution and frame rate."},{quality:j({values:["auto","high","medium","low"],default:"auto",label:"Quality",description:'"Auto" lowers the quality when the device cannot keep up.',labels:{auto:"Auto",high:"High",medium:"Medium",low:"Low"},live:"static"}),maxDpr:p({min:.5,max:3,step:.05,default:2,label:"Max DPR",description:"Upper limit of the canvas pixel density.",live:"static"}),maxPixels:p({min:.3,max:12,step:.1,unit:"MP",default:4.2,label:"Max pixels",description:"Upper limit of the canvas size; phones are capped at 2.4 MP.",live:"static"}),overflow:p({min:0,max:300,step:1,unit:"px",default:0,label:"Overflow",description:"The canvas extends past the container so the glow is not clipped.",live:"static"}),maxFps:ye({min:0,max:240,step:1,default:0,label:"Max FPS",description:"0 follows the display rate; otherwise an integer divisor of the refresh rate.",live:"static"}),pauseOffscreen:we({default:!0,label:"Pause offscreen",description:"Stop rendering while the background is not visible.",live:"static"}),reducedMotion:j({values:["respect","ignore"],default:"respect",label:"Reduced motion",description:"Whether to honor the system prefers-reduced-motion setting.",labels:{respect:"Respect",ignore:"Ignore"},live:"static"})}),Lr=p({min:0,max:5e3,step:10,unit:"ms",default:600,label:"Transition",description:"Duration of the smooth transition when settings change.",live:"static"}),O=k({label:"LumiCells"},{grid:xr,scene:_r,animation:vr,modes:yr,color:wr,background:Pr,glow:kr,lift:Er,interaction:Sr,render:Ar,transition:Lr}),G=1,Bi=["flow","sphere","pulse","wave","ripple","vortex","life","rain"];function Oi(o){let e={};for(let t of Object.keys(o.fields)){let i=o.fields[t];i&&(R(i)?e[t]=Oi(i):e[t]=Array.isArray(i.default)?i.default.slice():i.default)}return e}function Re(){return{version:G,...Oi(O)}}var Di=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;function Jt(o){return typeof o=="string"&&Di.test(o.trim())}function Q(o){let e=Di.exec(o.trim());if(!e?.[1])return[0,0,0];let t=e[1];t.length===3&&(t=t.replace(/./g,r=>r+r));let i=Number.parseInt(t,16);return[(i>>16&255)/255,(i>>8&255)/255,(i&255)/255]}function Fr([o,e,t]){let i=r=>Math.round(Math.min(1,Math.max(0,r))*255).toString(16).padStart(2,"0");return`#${i(o)}${i(e)}${i(t)}`}function zi(o){return Fr(Q(o))}function C(o){return o<=.04045?o/12.92:((o+.055)/1.055)**2.4}function Je(o,e=O){let t=[],i=(r,n)=>{t.push(r);for(let s of Object.keys(r.fields)){let a=r.fields[s],l=n?`${n}.${s}`:s,c=o(a,l,t.slice());R(a)&&c!==!1&&i(a,l)}t.pop()};i(e,"")}var Zt=null;function Ui(){if(!Zt){let o=[],e=new Map;Je((t,i)=>{R(t)||(o.push(i),e.set(i,t))}),Zt={paths:o,fields:e}}return Zt}function Ze(){return Ui().paths}function et(o){return Ui().fields.get(o)}function H(o){if(typeof o!="object"||o===null||Array.isArray(o))return!1;let e=Object.getPrototypeOf(o);return e===Object.prototype||e===null}function se(o,e){let t=o;for(let i of e.split(".")){if(!H(t)||!Object.hasOwn(t,i))return;t=t[i]}return t}function ei(o,e){if(Object.is(o,e))return!0;if(Array.isArray(o)&&Array.isArray(e)){if(o.length!==e.length)return!1;for(let t=0;t<o.length;t++)if(!ei(o[t],e[t]))return!1;return!0}if(H(o)&&H(e)){let t=Object.keys(o);return t.length!==Object.keys(e).length?!1:t.every(i=>Object.hasOwn(e,i)&&ei(o[i],e[i]))}return!1}function ti(o,e){let t=[];for(let i of Ze())ei(se(o,i),se(e,i))||t.push(i);return t}function ue(o){if(Array.isArray(o))return o.map(ue);if(H(o)){let e={};for(let t of Object.keys(o))e[t]=ue(o[t]);return e}return o}function Ne(o,e){if(e===void 0)return o;if(!H(o)||!H(e))return ue(e);let t={...o};for(let i of Object.keys(e)){let r=e[i];r!==void 0&&(t[i]=Ne(t[i],r))}return t}var tt=["reference","orb","pulse","life","vortex","waves","ripples","rain","minimal"],ii={reference:{label:"Reference",description:"Hollow neon sphere: crimson top left, blue bottom right, fading into navy.",config:{}},orb:{label:"Orb",description:"Solid rotating planet: a lit sky-blue rim, a deep indigo shadow and a thin atmosphere.",config:{grid:{count:34},modes:{flow:{weight:0},sphere:{weight:1,radius:.68,shift:[0,0],hole:0,rimPower:.8,outerFalloff:.16,lightAngle:215,lightStrength:.95,rotationSpeed:.3,tilt:20,surface:.7,surfaceScale:2.6,wobble:.02,breathe:.01,fadeAmount:0}},animation:{floor:.1,flicker:{amount:.2},sparsity:{amount:.6}},color:{palette:["#120a45","#2a1f9e","#1f4fe0","#0a84f2","#10c4e8","#8ff4ff"],mapping:"intensity",scale:1.3,warp:.1,jitter:.08,intensityShift:0,hot:{amount:.2,threshold:.9},accent:{color:"#18d6c8",amount:.4}},background:{color:"#01061f",spotA:{color:"#0c1f6e",position:[-1.1,-.7],radius:1.2,strength:.4},spotB:{color:"#081a44",position:[1.1,1],strength:.35}},glow:{bloom:{strength:.55},haze:{strength:.2}}}},pulse:{label:"Pulse",description:"Crisp rings spread from the center and gently breathe: crimson, pink, violet.",config:{grid:{count:33},modes:{sphere:{weight:0},flow:{weight:0},pulse:{weight:1,speed:.4,frequency:2.2,width:.09,breathe:.5,falloff:.4}},animation:{brightness:1.15,floor:.07,flicker:{amount:.2},sparsity:{amount:.25}},color:{palette:["#3a0a6e","#7b1fa2","#c2189b","#f72585","#ff6ec7","#ff9ad8"],mapping:"radial",scale:.8,offset:.15,warp:.12,jitter:.08,intensityShift:.25,hot:{amount:.25,threshold:.88}},background:{color:"#0a0019",spotA:{color:"#4a0d52",position:[-1.1,-.8],strength:.45},spotB:{color:"#22106a",position:[1,1],strength:.4}},glow:{bloom:{strength:.7}}}},life:{label:"Life",description:"Conway's cellular automaton: cells flash quickly and fade out smoothly, in teal and mint.",config:{grid:{count:40,gap:.22,roundness:.2},modes:{sphere:{weight:0},flow:{weight:0},life:{weight:1,stepRate:6,birthRate:.003,fadeSteps:6,seedDensity:.28}},animation:{floor:.07,flicker:{amount:.08},sparsity:{amount:0},sparkle:{amount:.12}},color:{palette:["#03302a","#0d7a6a","#14b8a6","#2ee6c5","#6ff2dc","#b8fff0"],mapping:"noise",warp:.2,warpScale:.8,jitter:.08,intensityShift:.15,hot:{amount:.2,threshold:.9}},background:{color:"#010d0c",vignette:.45,spotA:{color:"#053b33",position:[-1.2,-.4],strength:.4},spotB:{color:"#063447",position:[.9,1],strength:.35}},lift:{amount:.006}}},vortex:{label:"Vortex",description:"Three-armed galaxy: a golden core, fiery arms and violet outskirts.",config:{modes:{sphere:{weight:0},flow:{weight:.08},vortex:{weight:1,arms:3,twist:3.2,speed:.3,falloff:.75,sharpness:.55}},animation:{floor:.08,sparsity:{amount:.45}},color:{palette:["#ffe8a3","#ffb347","#f5652a","#d11d5b","#8a1a9b","#3d0f7a"],mapping:"radial",scale:1.1,warp:.12,jitter:.08,intensityShift:-.2,hot:{amount:.2,threshold:.9}},background:{color:"#0b0014",spotA:{color:"#3f0d4a",position:[-1.2,.4],strength:.45},spotB:{color:"#3a1405",position:[1.2,-.8],strength:.3}},glow:{bloom:{strength:.6}}}},waves:{label:"Waves",description:"Interference plasma: bending crests from indigo through violet to sky blue.",config:{grid:{count:34},modes:{sphere:{weight:0},flow:{weight:0},wave:{weight:1,angle:25,frequency:1.3,speed:.3,sharpness:.45,interference:.85}},animation:{floor:.08,flicker:{amount:.15},sparsity:{amount:.35}},color:{palette:["#0b0630","#2a0f7a","#5b2bd6","#3f6df0","#22c3ee","#a7f3ff"],mapping:"intensity",scale:1.1,warp:.15,jitter:.06,intensityShift:0,hot:{amount:.25,threshold:.9}},background:{color:"#04021a",spotA:{color:"#1e0b5a",position:[-1.2,-.6],strength:.45},spotB:{color:"#062a4a",position:[.8,1.1],strength:.4}}}},ripples:{label:"Ripples",description:"Dark water under the moon: silvery blue rings spread from random drops.",config:{modes:{sphere:{weight:0},flow:{weight:.12,scale:1.1,speed:.12,threshold:.62},ripple:{weight:1,rate:1.8,speed:.42,width:.07,life:3.2}},animation:{floor:.06,flicker:{amount:.15},sparkle:{amount:.2},sparsity:{amount:.35}},color:{palette:["#0a1830","#1c3a66","#3d6aa8","#7fa6d9","#c6dcff","#f2f7ff"],mapping:"intensity",scale:1.2,warp:.05,jitter:.05,intensityShift:0,saturation:.85,hot:{amount:.3,threshold:.85}},background:{color:"#030814",vignette:.5,spotA:{color:"#12254a",position:[-1.1,-.5],strength:.35},spotB:{color:"#0b1733",position:[1,1],strength:.3}},glow:{halo:{strength:.55},bloom:{strength:.55},haze:{strength:.1},saturation:.9}}},rain:{label:"Rain",description:'Green "digital rain" on a near-black background, with a fine grid.',config:{grid:{count:56,gap:.2,roundness:.15},modes:{sphere:{weight:0},flow:{weight:.08},rain:{weight:1,speed:.6,density:.32,tail:.6,angle:0}},animation:{floor:.1,sparsity:{amount:.2},flicker:{amount:.1}},color:{palette:["#001a00","#003b00","#008f11","#00ff41","#b6ffb0"],interpolation:"linear",mapping:"intensity",warp:0,jitter:.1,intensityShift:0,hot:{amount:.5,threshold:.85}},background:{color:"#000600",vignette:.5,spotA:{color:"#002a08",position:[-1,-.8],strength:.3},spotB:{color:"#001a10",position:[1,1],strength:.25}},glow:{halo:{strength:.45},bloom:{strength:.3},haze:{strength:.15}},lift:{amount:.006,style:"float"}}},minimal:{label:"Minimal",description:"Monochrome white islands drift slowly over a charcoal background, with a restrained glow.",config:{grid:{count:36,gap:.3,roundness:.25},modes:{sphere:{weight:0},flow:{weight:1,scale:1.5,speed:.12,threshold:.64,softness:.4}},animation:{floor:.08,gamma:1.5,flicker:{amount:.25},sparsity:{amount:.4},sparkle:{amount:.2}},color:{palette:["#5c5c5c","#d9d9d9","#ffffff"],mapping:"intensity",scale:1,warp:0,jitter:0,intensityShift:0,saturation:0,hot:{amount:0},accent:{amount:0}},background:{color:"#050505",vignette:.25,spotA:{strength:0},spotB:{strength:0}},glow:{halo:{strength:.25},bloom:{strength:.12},haze:{strength:.06},saturation:0},lift:{amount:.004,whiten:0,halo:.4}}}};var Mr=[],Cr=new Set(["$schema","version","extends"]);function Ir(o){return typeof o=="string"&&tt.includes(o)}var Pe=o=>o===null?"null":Array.isArray(o)?"array":typeof o=="number"&&!Number.isFinite(o)?String(o):typeof o;function Gi(o,e,t){if(typeof o=="number"&&Number.isFinite(o))return o;if(typeof o=="string"&&o.trim()!==""){let i=Number(o);if(Number.isFinite(i))return t.push({path:e,code:"bad-type",message:`expected number, coerced string "${o}"`,value:o}),i}t.push({path:e,code:"bad-type",message:`expected number, got ${Pe(o)}`,value:o})}function Hi(o,e,t,i){if(e.kind==="angle"&&e.fullCircle){let r=e.max-e.min;return o>=e.min&&o<=e.max?o:((o-e.min)%r+r)%r+e.min}if(o<e.min||o>e.max){let r=Math.min(e.max,Math.max(e.min,o));return i.push({path:t,code:"clamped",message:`${o} is outside [${e.min}, ${e.max}], clamped to ${r}`,value:o}),r}return o}function Vi(o,e,t){if(Jt(o))return zi(o);t.push({path:e,code:"bad-color",message:`invalid color ${JSON.stringify(o)}`,value:o})}function Tr(o,e,t,i){let r;if(Array.isArray(o))r=o;else if(typeof o=="string"&&Jt(o))i.push({path:t,code:"bad-type",message:"expected array of colors, got one color",value:o}),r=[o];else return i.push({path:t,code:"bad-type",message:`expected array of colors, got ${Pe(o)}`,value:o}),{ok:!1};let n=[];return r.forEach((s,a)=>{let l=Vi(s,`${t}.${a}`,i);l!==void 0&&n.push(l)}),n.length>e.maxStops&&(i.push({path:t,code:"out-of-range",message:`${n.length} stops exceed the maximum of ${e.maxStops}, extra stops dropped`,value:n.length}),n.length=e.maxStops),n.length<e.minStops?(i.push({path:t,code:"out-of-range",message:`palette needs at least ${e.minStops} valid color(s)`,value:o}),{ok:!1}):{ok:!0,value:n}}function Rr(o,e,t,i){switch(o.kind){case"number":case"angle":case"int":{let r=Gi(e,t,i);if(r===void 0)return{ok:!1};let n=Hi(r,o,t,i);return{ok:!0,value:o.kind==="int"?Math.round(n):n}}case"boolean":{if(typeof e=="boolean")return{ok:!0,value:e};let r=e==="true"||e===1||e==="1"||e===""?!0:e==="false"||e===0||e==="0"?!1:void 0;return r!==void 0?(i.push({path:t,code:"bad-type",message:`expected boolean, coerced ${JSON.stringify(e)}`,value:e}),{ok:!0,value:r}):(i.push({path:t,code:"bad-type",message:`expected boolean, got ${Pe(e)}`,value:e}),{ok:!1})}case"color":{let r=Vi(e,t,i);return r===void 0?{ok:!1}:{ok:!0,value:r}}case"vec2":{if(!Array.isArray(e)||e.length!==2)return i.push({path:t,code:"bad-type",message:`expected [x, y], got ${Pe(e)}`,value:e}),{ok:!1};let r=[];for(let n=0;n<2;n++){let s=Gi(e[n],`${t}.${n}`,i);if(s===void 0)return{ok:!1};r.push(Hi(s,o,`${t}.${n}`,i))}return{ok:!0,value:r}}case"enum":return typeof e=="string"&&o.values.includes(e)?{ok:!0,value:e}:(i.push({path:t,code:"bad-type",message:`expected one of ${o.values.join(" | ")}, got ${JSON.stringify(e)}`,value:e}),{ok:!1});case"palette":return Tr(e,o,t,i)}}function it(o,e,t,i,r){let n={};for(let s of Object.keys(o.fields)){let a=o.fields[s];if(!a)continue;let l=i?`${i}.${s}`:s,c=Object.hasOwn(e,s)&&e[s]!==void 0,u=t?.[s];if(R(a)){let f=c?e[s]:void 0;c&&!H(f)&&r.push({path:l,code:"bad-type",message:`expected object, got ${Pe(f)}`,value:f});let h=it(a,H(f)?f:{},t?u:void 0,l,r);(t||Object.keys(h).length>0)&&(n[s]=h);continue}if(!c){t&&(n[s]=ue(u));continue}let d=Rr(a,e[s],l,r);d.ok?n[s]=d.value:t&&(n[s]=ue(u))}for(let s of Object.keys(e)){if(Object.hasOwn(o.fields,s)||!i&&Cr.has(s))continue;let a=i?`${i}.${s}`:s;r.push({path:a,code:"unknown-key",message:`unknown key '${a}' dropped`,value:e[s]})}return n}function qi(o,e){if(!Object.hasOwn(o,"version")||o.version===void 0)return o;let t=o.version;if(typeof t!="number"||!Number.isInteger(t))return e.push({path:"version",code:"bad-type",message:"version must be an integer",value:t}),o;let i=o;for(let r=0;r<32&&t!==G;r++){let n=Mr.find(s=>s.from===t);if(!n)break;try{i=n.up(i)}catch{break}e.push({path:"version",code:"migrated",message:`migrated from v${n.from} to v${n.to}`,value:n.from}),t=n.to}return t!==G&&e.push({path:"version",code:"out-of-range",message:`unsupported version ${t}, read as v${G}`,value:t}),i}function Wi(o,e){let t=o.extends;if(t!==void 0){if(Ir(t))return t;e.push({path:"extends",code:"bad-type",message:`unknown preset ${JSON.stringify(t)}; expected one of ${tt.join(", ")}`,value:t})}}function Xi(o,e){return o==null?{}:H(o)?o:(e.push({path:"",code:"bad-type",message:`expected config object, got ${Pe(o)}`,value:o}),{})}var $i=new Map;function Ki(o){let e=$i.get(o);if(!e){let t=ii[o],i=Ne(Re(),t?.config??{});e={...it(O,i,Re(),"",[]),version:G},$i.set(o,e)}return ue(e)}function ot(o){let e=[],t=Xi(o,e);t=qi(t,e);let i=Wi(t,e),r=i?Ki(i):Re(),n=it(O,t,r,"",e);return{config:{version:G,...n},issues:e}}function Yi(o){let e=[],t=Xi(o,e);t=qi(t,e);let i=Wi(t,e),r=it(O,t,void 0,"",e);return{patch:i?{extends:i,...r}:r,issues:e}}function ji(o,e){let t=(l,c)=>{let u=Math.floor((o[28+l]??0)+.5);return u>0?Math.min(u,c):0},i=t(0,64),r=t(1,16),n=t(2,128),s=0,a=(l,c)=>{if(!(c<=l)){if(s>0&&l-e[s*2-1]<=64){e[s*2-1]=c;return}e[s*2]=l,e[s*2+1]=c,s++}};return a(0,44+i*3*4),a(812,812+r*3*4),a(1004,1004+n*4),s}function Be(o,e,t){let i=Math.floor(t);o[e]=i,o[e+1]=t-i}var Qi={light:0,shadow:1,lift:2,seed:3,repel:4},Ji=`
#define MAX_INFLUENCES 64
#define MAX_PULSES 16
#define MAX_LIFTS 128
#define EPOCH_MASK 1048575u
#define FLICKER_RATE_STEPS 256u
layout(std140) uniform FrameBlock {
  vec4 f_phaseA;
  vec4 f_phaseB;
  vec4 f_clock;
  vec4 f_grid;
  vec4 f_origin;
  vec4 f_host;
  vec4 f_space;
  vec4 f_counts;
  vec4 f_misc;
  vec4 f_epochA;
  vec4 f_epochB;
  vec4 f_inf[MAX_INFLUENCES * 3];
  vec4 f_pulse[MAX_PULSES * 3];
  vec4 f_socket[MAX_LIFTS];
};

// Hash epochs: the CPU accumulates each effect's phase in epochs (wrapped at EPOCH_WRAP) and
// uploads it as (whole epochs, fraction). Epoch indices are taken modulo the wrap, so crossing it
// continues the same epoch sequence; offset (a per-cell or per-slot shift, >= 0) is added to the
// fraction only, which keeps full fp32 precision. Returns the fraction, e = epoch index.
float epochAt(vec2 ph, float offset, out uint e) {
  float s = ph.y + offset;
  float fl = floor(s);
  e = (uint(ph.x) + uint(fl)) & EPOCH_MASK;
  return s - fl;
}
`;var S=Math.PI*2;function Zi(o,e,t){return o<e?e:o>t?t:o}function Nr(o){return o<0?0:o>1?1:o}function de(o,e,t){let i=Nr((t-o)/(e-o));return i*i*(3-2*i)}function oi(o,e,t){return o+(e-o)*t}function A(o,e){let t=o%e;return t<0?t+e:t}function eo(o,e){return A(e-o+180,360)-180}function to(o){let e=o>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function ri(o,e,t,i,r=0){let n=Math.cbrt(.4122214708*o+.5363325363*e+.0514459929*t),s=Math.cbrt(.2119034982*o+.6806995451*e+.1073969566*t),a=Math.cbrt(.0883024619*o+.2817188376*e+.6299787005*t);i[r]=.2104542553*n+.793617785*s-.0040720468*a,i[r+1]=1.9779984951*n-2.428592205*s+.4505937099*a,i[r+2]=.0259040371*n+.7827717662*s-.808675766*a}function io(o,e,t,i,r=0){let n=o+.3963377774*e+.2158037573*t,s=o-.1055613458*e-.0638541728*t,a=o-.0894841775*e-1.291485548*t,l=n*n*n,c=s*s*s,u=a*a*a;i[r]=4.0767416621*l-3.3077115913*c+.2309699292*u,i[r+1]=-1.2684380046*l+2.6097574011*c-.3413193965*u,i[r+2]=-.0041960863*l-.7034186147*c+1.707614701*u}function rt(o,e,t=0){let[i,r,n]=Q(o);e[t]=C(i),e[t+1]=C(r),e[t+2]=C(n)}function Oe(o,e,t=0){let[i,r,n]=Q(o);ri(C(i),C(r),C(n),e,t)}var st=1024,Br=4096,Or=2,at=class{flow=0;sphereRotation=0;sphereBreathe=0;pulse=0;wave=0;vortex=0;rain=0;drift=0;seconds=0;sparsity=0;flicker=0;sparkle=0;ripple=0;elapsed=0;lifeAcc=0;lifeSteps=0;advance(e,t){let i=e*t.speed;if(this.seconds=A(this.seconds+i,Br),this.elapsed+=i,this.flow=A(this.flow+i*t.flow,st),this.sphereRotation=A(this.sphereRotation+i*t.sphereRotation,S),this.sphereBreathe=A(this.sphereBreathe+i*t.sphereBreathe*S,S),this.pulse=A(this.pulse+i*t.pulse,st),this.wave=A(this.wave+i*t.wave,st),this.vortex=A(this.vortex+i*t.vortex,S),this.rain=A(this.rain+i*t.rain,st),this.drift=A(this.drift+i*t.drift,Or),this.sparsity=A(this.sparsity+i*t.sparsity,1048576),this.flicker=A(this.flicker+i*t.flicker,1048576),this.sparkle=A(this.sparkle+i*t.sparkle,1048576),this.ripple=A(this.ripple+i*t.ripple,1048576),this.lifeSteps=0,t.lifeRate>0){for(this.lifeAcc+=i*t.lifeRate;this.lifeAcc>=1&&this.lifeSteps<2;)this.lifeAcc-=1,this.lifeSteps++;this.lifeAcc>=1&&(this.lifeAcc%=1)}}};function oo(){return{canvasW:1,canvasH:1,canvasCssW:1,canvasCssH:1,effDpr:1,sx:1,sy:1,hostX:0,hostY:0,hostW:1,hostH:1,pitchPx:8,cols:1,rows:1,pad:2,originX:0,originY:0,centerX:.5,centerY:.5,halfMin:.5}}function Dr(o,e,t,i,r,n){let s=Math.max(1,i*r),a=Math.sqrt(Math.max(.01,t)*1e6/s);return Math.max(.05,Math.min(o>0?o:1,e,a)*(n>0?n:1))}function ro(o,e){let t=Math.max(0,o.overflowCss),i=Math.max(1,o.hostCssW+2*t),r=Math.max(1,o.hostCssH+2*t),n=o.dpr>0?o.dpr:1,s=Dr(n,o.maxDpr,o.maxPixels,i,r,o.scale),a=o.maxDim!==void 0&&o.maxDim>0?o.maxDim:0;a>0&&(i*s>a||r*s>a)&&(s=Math.min(s,a/i,a/r));let l,c;Math.abs(s-n)<1e-6&&o.deviceW>0&&o.deviceH>0&&Math.abs(o.deviceW-i*n)<=2&&Math.abs(o.deviceH-r*n)<=2?(l=o.deviceW,c=o.deviceH):(l=Math.max(1,Math.round(i*s)),c=Math.max(1,Math.round(r*s)),a>0&&(l=Math.min(l,a),c=Math.min(c,a)));let u=l/i,d=c/r,f=Math.round(t*u),h=Math.round(t*d),m=Math.max(1,l-2*f),b=Math.max(1,c-2*h),g=Math.max(3,o.fractionalPitch?o.cssPitch*u:Math.round(o.cssPitch*u)),x=o.maxGridCells??2048;g=Math.max(g,Math.ceil(Math.max(m,b)/(x-32-2)));let P=Math.ceil(m/g)+1;P%2===0&&P++;let _=Math.ceil(b/g)+1;_%2===0&&_++;let y=Math.min(16,2+Math.ceil(Math.max(f,h)/g)),E=f+m/2,I=h+b/2,F=o.alignWholeCellsX?f-y*g:Math.round(E-(P/2+y)*g),X=o.alignWholeCellsY?h-y*g:Math.round(I-(_/2+y)*g),B=e.canvasW!==l||e.canvasH!==c||e.pitchPx!==g||e.cols!==P||e.rows!==_||e.pad!==y||e.originX!==F||e.originY!==X||e.hostW!==m||e.hostH!==b||e.effDpr!==s;return e.canvasW=l,e.canvasH=c,e.canvasCssW=i,e.canvasCssH=r,e.effDpr=s,e.sx=u,e.sy=d,e.hostX=f,e.hostY=h,e.hostW=m,e.hostH=b,e.pitchPx=g,e.cols=P,e.rows=_,e.pad=y,e.originX=F,e.originY=X,e.centerX=E,e.centerY=I,e.halfMin=Math.min(m,b)/2,B}var ke=0,fe=1,J=2,Z=3,ut={host:ke,norm:fe,cells:J,client:Z},ni=class{constructor(e){this.id=e}id;space=ke;x=0;y=0;w=Number.NaN;h=Number.NaN;radius=Number.NaN;corner=Number.NaN;type=0;strength=Number.NaN;falloff=Number.NaN;r=1;g=1;b=1;colorMix=0;priority=0;fadeIn=150;fadeOut=250;ttl=Number.POSITIVE_INFINITY;age=0;presence=0;slot=!1;wanted=!1;hidden=!1;disposing=!1;removed=!1;score=0};function Ur(o){let e=o<=0?0:o>=1?1:o;return e*e*(3-2*e)}function Gr(o,e){return o.priority!==e.priority?o.priority>e.priority:o.score!==e.score?o.score>e.score:o.id<e.id}var ct=class{list=[];nextId=1;gpu=0;overflowWarned=!1;onOverflow=null;get size(){let e=0;for(let t=0;t<this.list.length;t++)this.list[t].disposing||e++;return e}get activeCount(){return this.gpu}get needsClientOrigin(){for(let e=0;e<this.list.length;e++)if(this.list[e].space===Z)return!0;return!1}add(e){let t=new ni(this.nextId++);return this.apply(t,e),this.list.push(t),t}update(e,t){e.removed||this.apply(e,t)}setShape(e,t,i,r,n,s){e.space=t,e.x=i,e.y=r,e.w=n,e.h=s}setHidden(e,t){e.hidden=t}dispose(e){if(e.removed||(e.disposing=!0,e.slot))return;e.removed=!0;let t=this.list.indexOf(e);t>=0&&this.list.splice(t,1)}clear(){for(let e of this.list)e.removed=!0,e.disposing=!0,e.slot=!1;this.list.length=0,this.gpu=0}step(e,t,i){let r=e*1e3,n=this.list,s=0,a=0;for(let c=0;c<n.length;c++){let u=n[c];if(u.disposing||(u.age+=r,u.age>=u.ttl&&(u.disposing=!0)),u.disposing&&!u.slot){u.removed=!0;continue}!u.disposing&&!u.hidden&&a++,n[s++]=u}if(n.length=s,a>64){this.overflowWarned||(this.overflowWarned=!0,this.onOverflow?.(a));for(let u=0;u<n.length;u++){let d=n[u];d.score=this.strengthOf(d,t)*this.areaOf(d,t.geo)}for(let u=1;u<n.length;u++){let d=n[u],f=u-1;for(;f>=0&&Gr(d,n[f]);)n[f+1]=n[f],f--;n[f+1]=d}let c=0;for(let u=0;u<n.length;u++){let d=n[u];d.wanted=!d.disposing&&!d.hidden&&c<64,d.wanted&&c++}}else for(let c=0;c<n.length;c++){let u=n[c];u.wanted=!u.disposing&&!u.hidden}for(let c=0;c<n.length;c++){let u=n[c];u.slot&&(u.wanted?u.presence=u.fadeIn>0?Math.min(1,u.presence+r/u.fadeIn):1:(u.presence=u.fadeOut>0?u.presence-r/u.fadeOut:0,u.presence<=0&&(u.presence=0,u.slot=!1,this.gpu--)))}for(let c=0;c<n.length&&this.gpu<64;c++){let u=n[c];u.slot||!u.wanted||(u.slot=!0,this.gpu++,u.presence=u.fadeIn>0?Math.min(1,r/u.fadeIn):1)}let l=0;for(let c=0;c<n.length&&l<64;c++){let u=n[c];!u.slot||u.presence<=0||(this.write(u,t,i,44+l*12),l++)}return l}apply(e,t){if(t.space!==void 0&&(e.space=ut[t.space]??ke),t.x!==void 0&&(e.x=t.x),t.y!==void 0&&(e.y=t.y),t.w!==void 0&&(e.w=t.w),t.h!==void 0&&(e.h=t.h),t.radius!==void 0&&(e.radius=t.radius),t.cornerRadius!==void 0&&(e.corner=t.cornerRadius??Number.NaN),t.type!==void 0&&(e.type=Qi[t.type]??0),t.strength!==void 0&&(e.strength=t.strength),t.falloff!==void 0&&(e.falloff=t.falloff),t.color!==void 0){let i=[1,1,1];rt(t.color,i),e.r=i[0],e.g=i[1],e.b=i[2],t.colorMix===void 0&&e.colorMix===0&&(e.colorMix=.5)}t.colorMix!==void 0&&(e.colorMix=Math.max(0,Math.min(1,t.colorMix))),t.priority!==void 0&&(e.priority=t.priority),t.fadeInMs!==void 0&&(e.fadeIn=Math.max(0,t.fadeInMs)),t.fadeOutMs!==void 0&&(e.fadeOut=Math.max(0,t.fadeOutMs)),t.ttlMs!==void 0&&(e.ttl=t.ttlMs>0?t.ttlMs:Number.POSITIVE_INFINITY,e.age=0)}strengthOf(e,t){return Number.isNaN(e.strength)?t.defaultStrength:e.strength}unit(e,t,i){switch(e.space){case fe:return i===0?t.hostW:i===1?t.hostH:Math.min(t.hostW,t.hostH);case J:return t.pitchPx;default:return i===1?t.sy:t.sx}}areaOf(e,t){if(!Number.isNaN(e.w)||!Number.isNaN(e.h)){let r=(Number.isNaN(e.w)?0:e.w)*this.unit(e,t,0),n=(Number.isNaN(e.h)?0:e.h)*this.unit(e,t,1);return Math.max(1,r*n)}let i=(Number.isNaN(e.radius)?0:e.radius)*this.unit(e,t,2);return Math.max(1,Math.PI*i*i)}write(e,t,i,r){let n=t.geo,s,a;switch(e.space){case fe:s=n.hostX+e.x*n.hostW,a=n.hostY+e.y*n.hostH;break;case J:s=n.originX+(n.pad+e.x+.5)*n.pitchPx,a=n.originY+(n.pad+e.y+.5)*n.pitchPx;break;case Z:s=n.hostX+(e.x-t.clientX)*n.sx,a=n.hostY+(e.y-t.clientY)*n.sy;break;default:s=n.hostX+e.x*n.sx,a=n.hostY+e.y*n.sy}let l=0,c=0,u;if(!Number.isNaN(e.w)||!Number.isNaN(e.h)){l=Math.max(0,(Number.isNaN(e.w)?0:e.w)*.5*this.unit(e,n,0)),c=Math.max(0,(Number.isNaN(e.h)?0:e.h)*.5*this.unit(e,n,1));let f=Number.isNaN(e.corner)?0:e.corner*this.unit(e,n,2);u=Math.max(0,Math.min(f,l,c))}else u=Math.max(0,(Number.isNaN(e.radius)?0:e.radius)*this.unit(e,n,2));let d=Number.isNaN(e.falloff)?t.defaultFalloff:e.falloff;i[r]=s,i[r+1]=a,i[r+2]=l,i[r+3]=c,i[r+4]=u,i[r+5]=Math.max(0,d)*n.pitchPx,i[r+6]=this.strengthOf(e,t)*Ur(e.presence),i[r+7]=e.type,i[r+8]=e.r,i[r+9]=e.g,i[r+10]=e.b,i[r+11]=e.colorMix}};var no=64;function Hr(o){return`P_${o.replace(/\./g,"_")}`}function $r(o,e){return`E_${o.replace(/\./g,"_")}_${e}`}function Vr(o){return o.kind==="vec2"?2:o.kind==="color"?3:1}function qr(o){return Number.isInteger(o)?`${o}.0`:String(o)}var Wr="xyzw",dt=new Map;function Xr(o){let e=dt.get(o);if(!e){let[t,i,r]=Q(o);e=[C(t),C(i),C(r)],dt.size>256&&dt.clear(),dt.set(o,e)}return e}function Kr(o,e){let t=o;for(let i of e.split(".")){if(typeof t!="object"||t===null)return;t=t[i]}return t}function so(o=O){let e=[];Je((d,f)=>{!R(d)&&d.gpu&&e.push({path:f,field:d})},o);let t=[],i=d=>{let f=d===1?[0,1,2,3]:d===2?[0,2]:[0],h=d===1?1:d===2?3:7;for(let m=0;;m++){let b=t[m]??0;for(let g of f){let x=h<<g;if((b&x)===0)return t[m]=b|x,[m,g]}}},r=new Map,n=[];for(let{path:d,field:f}of e){if(f.kind==="palette")throw new Error(`lumicells: palette field '${d}' cannot be packed (use the LUT)`);let h=Vr(f),[m,b]=i(h);r.set(d,{index:m,comp:b,size:h,kind:f.kind,offset:m*4+b,define:Hr(d),field:f}),n.push(d)}let s=Math.max(1,t.length);if(s>no)throw new Error(`lumicells: ${s} param vec4s exceed the limit of ${no}`);let a=[`#define PARAMS_VEC4_COUNT ${s}`,`layout(std140) uniform ParamsBlock { vec4 u_p[${s}]; };`];for(let d of n){let f=r.get(d),h=Wr.slice(f.comp,f.comp+f.size);a.push(`#define ${f.define} u_p[${f.index}].${h}`)}Bi.forEach((d,f)=>{a.push(`#define MODE_${d.toUpperCase()} ${f}`)}),Je((d,f)=>{d.kind==="enum"&&d.values.forEach((h,m)=>{a.push(`#define ${$r(f,h)} ${qr(m)}`)})},o);let l=`${a.join(`
`)}
`,c=(d,f,h)=>{let m=r.get(f);if(!m)return!1;let b=m.offset;switch(m.kind){case"angle":d[b]=h*Math.PI/180;break;case"boolean":d[b]=h?1:0;break;case"enum":{if(typeof h=="number")d[b]=h;else{let g=m.field.values.indexOf(h);d[b]=g<0?0:g}break}case"color":{let g=typeof h=="string"?Xr(h):h;d[b]=g[0]??0,d[b+1]=g[1]??0,d[b+2]=g[2]??0;break}case"vec2":{let g=h;d[b]=g[0]??0,d[b+1]=g[1]??0;break}default:d[b]=h}return!0},u=(d,f)=>{for(let h of n){let m=Kr(f,h);m!==void 0&&c(d,h,m)}};return{slots:r,paths:n,vec4Count:s,floatCount:s*4,glslPrelude:l,write:c,writeAll:u}}var me=class extends Error{constructor(t,i,r){super(i,r);this.code=t;this.name="EngineError"}code};function bo(){return{enabled:!0,style:0,amount:.016,max:96,scale:1.5,height:.35,parallax:.06,tilt:6,holdMin:1.5,holdMax:3.5,rise:.6,fall:.45,bokeh:.3,socket:.6,outerBias:.85,cluster:.15,landing:.25,floatSpeed:.9,floatDrift:.4,sceneX:0,sceneY:0,zoom:1}}var si=.09,Ee=.55,cn=Math.sqrt(1-Ee*Ee);function un(o,e){if(o<=0)return 0;let t=S/Math.max(.05,e)*.9,i=Ee*t,r=t*Math.sqrt(1-Ee*Ee);return 1-Math.exp(-i*o)*(Math.cos(r*o)+i/r*Math.sin(r*o))}function dn(o,e,t){return .03*Math.sin(S*.45*o+t*S)*Math.min(1,o/Math.max(.05,e))}var pe=19,ai=0,li=1,ci=2,ui=3,di=4,ao=5,lo=6,fi=7,mi=8,De=9,ft=10,co=11,fn=12,uo=13,fo=14,mo=15,pi=16,hi=17,po=18,mn=Math.PI/180,ho=[-1,-1,0,-1,1,-1,-1,0,1,0,-1,1,0,1,1,1],mt=class{constructor(e,t){this.random=e;this.pulses=t}random;pulses;instances=new Float32Array(1536);count=0;written=0;budget=-1;rec=new Float64Array(128*pe);landingPulse={space:J,x:0,y:0,strength:0,speed:6,width:1,r:1,g:1,b:1,colorMix:0,duration:.5,minor:!0};clear(){this.count=0,this.written=0}static meanLifetime(e){let t=Math.min(e.holdMin,e.holdMax),i=Math.max(e.holdMin,e.holdMax);return e.rise+(t+i)/2+e.fall+(e.style===0?si:0)}force(e,t,i,r,n,s){let a=(s.cols-1)/2,l=(s.rows-1)/2,c=0,u=Math.max(1,Math.floor(i));for(let d=0,f=0;d<u&&f<u*6&&this.count<128;f++){let h=Math.round(e),m=Math.round(t);if(d>0||f>0){let b=this.random()*S,g=Math.sqrt(this.random())*Math.max(1,r);h=Math.round(e+Math.cos(b)*g),m=Math.round(t+Math.sin(b)*g)}Math.abs(h)>a||Math.abs(m)>l||this.has(h,m)||(this.spawn(h,m,d===0?0:-this.random()*.12,n,!0),c++,d++)}return c}step(e,t,i,r){this.spawnRandom(e,t,i);let n=this.rec,s=this.instances,a=(i.cols-1)/2,l=(i.rows-1)/2,c=i.pitchPx,u=t.tilt*mn,d=0,f=0;for(let h=0;h<this.count;h++){let m=h*pe,b=n[m+ai],g=n[m+li];if(Math.abs(b)>a||Math.abs(g)>l)continue;let x=n[m+ci]+e;n[m+ci]=x;let P=!0,_=0,y=0,E=1,I=1,F=0,X=0,B=0;if(x>=0){let K=n[m+lo],Fi=n[m+di],Mi=S/K*.9,Ci=Ee*Mi,Qt=Mi*cn,Ii=1-Math.exp(-Ci*x)*(Math.cos(Qt*x)+Ci/Qt*Math.sin(Qt*x))+.03*Math.sin(S*.45*x+Fi*S)*Math.min(1,x/K);if(n[m+co]===1){let ce=K+n[m+ui]+n[m+fi];if(x>=ce)P=!1;else{_=Ii;let Ce=x/ce;y=Math.min(1,_*4)*(1-de(.7,1,Ce));let U=oi(1,.8,Ce);E=U,I=U;let Y=Math.min(1,x),Ie=t.floatDrift*c*Y;F=Ie*(Math.sin(S*n[m+mo]*x+n[m+hi])+.5*Math.sin(S*n[m+pi]*x+n[m+po])),X=-t.floatSpeed*c*x+.3*Ie*Math.sin(S*n[m+pi]*x+n[m+hi]),B=t.socket*Math.min(1,Math.max(0,_))*(1-de(.15,.5,Ce))}}else{let ce=n[m+ui],Ce=Math.max(.05,n[m+fi]),U=n[m+ft];if(U===0&&x>=K+ce&&(U=1,n[m+ft]=1,n[m+De]=K+ce,n[m+mi]=un(K+ce,K)+dn(K+ce,K,Fi)),U===1){let Y=(x-n[m+De])/Ce;Y>=1?(U=2,n[m+ft]=2,n[m+De]=x,this.land(b+a,g+l,t)):_=n[m+mi]*(1-Y*Y)}if(U===0)_=Ii;else if(U===2){let Y=(x-n[m+De])/si;if(Y>=1)P=!1;else{let Ie=Math.sin(Math.PI*Y);E=1+.06*Ie,I=1-.06*Ie,_=0,y=1-Y}}U!==2&&(y=Math.min(1,Math.max(0,_)*4)),B=t.socket*Math.min(1,Math.max(0,_))}}if(!P||(d!==h&&n.copyWithin(d*pe,m,m+pe),d++,x<0||f>=128))continue;let z=Math.max(0,_),Yt=b+a+i.pad,jt=g+l+i.pad,br=i.originX+(Yt+.5)*c,gr=i.originY+(jt+.5)*c,T=f*12,Ai=1+(t.scale-1)*z;s[T+0]=Yt,s[T+1]=jt,s[T+2]=(br-i.centerX)*t.parallax*z+F,s[T+3]=(gr-i.centerY)*t.parallax*z-t.height*c*z+X,s[T+4]=Ai*E,s[T+5]=Ai*I,s[T+6]=n[m+uo]*u*z,s[T+7]=n[m+fo]*u*z,s[T+8]=_,s[T+9]=y;let Li=n[m+ao];s[T+10]=Li<t.bokeh?(.12+.18*Li/Math.max(t.bokeh,.001))*c*z:0,s[T+11]=n[m+di];let je=1004+f*4;r[je]=Yt,r[je+1]=jt,r[je+2]=B,r[je+3]=0,f++}return this.count=d,this.written=f,f}has(e,t){let i=this.rec;for(let r=0;r<this.count;r++)if(i[r*pe+ai]===e&&i[r*pe+li]===t)return!0;return!1}spawnRandom(e,t,i){if(!t.enabled||!(t.amount>0)||!(t.max>=1)||e<=0)return;let r=i.pitchPx,n=Math.floor(i.hostW/2/r),s=Math.floor(i.hostH/2/r),a=(2*n+1)*(2*s+1),l=t.holdMin<t.holdMax?t.holdMin:t.holdMax,c=t.holdMin<t.holdMax?t.holdMax:t.holdMin,u=t.rise+(l+c)/2+t.fall+(t.style===0?si:0),d=t.amount*a/u/(1+2*Math.max(0,t.cluster));if(this.budget<0&&(this.budget=-Math.log(1-this.random())),this.budget-=d*e,this.budget>0)return;let f=Math.min(128,Math.floor(t.max)),h=1/Math.max(1,i.halfMin),m=Math.max(.05,t.zoom);for(let b=0;this.budget<=0&&b<64;b++)if(this.budget+=-Math.log(1-this.random()),!(this.count>=f))for(let g=0;g<24;g++){let x=Math.floor(this.random()*(2*n+1))-n,P=Math.floor(this.random()*(2*s+1))-s,_=(x*r*h-t.sceneX)/m,y=(P*r*h-t.sceneY)/m,E=Math.sqrt(_*_+y*y),I=oi(1,de(.6,.85,E)*(1-.6*de(1.15,1.45,E)),t.outerBias);if(!(this.random()>=I||this.has(x,P))){this.spawn(x,P,0,t,!1),this.random()<t.cluster&&this.spawnCluster(x,P,n,s,f,t);break}}this.budget<0&&(this.budget=0)}spawnCluster(e,t,i,r,n,s){let a=1+Math.floor(this.random()*3);for(let l=0;l<a&&this.count<n;l++){let c=Math.floor(this.random()*8)*2,u=e+ho[c],d=t+ho[c+1];Math.abs(u)>i||Math.abs(d)>r||this.has(u,d)||this.spawn(u,d,-(.04+this.random()*.14),s,!1)}}spawn(e,t,i,r,n){if(this.count>=128)return;let s=this.random,a=this.count*pe,l=this.rec,c=Math.min(r.holdMin,r.holdMax),u=Math.max(r.holdMin,r.holdMax);l[a+ai]=e,l[a+li]=t,l[a+ci]=i,l[a+ui]=c+s()*(u-c),l[a+di]=s(),l[a+ao]=s(),l[a+lo]=Math.max(.05,r.rise),l[a+fi]=Math.max(.05,r.fall),l[a+mi]=1,l[a+De]=0,l[a+ft]=0,l[a+co]=r.style,l[a+fn]=n?1:0,l[a+uo]=s()*2-1,l[a+fo]=s()*2-1,l[a+mo]=.2+.3*s(),l[a+pi]=.5+.6*s(),l[a+hi]=s()*S,l[a+po]=s()*S,this.count++}land(e,t,i){if(!this.pulses||!(i.landing>0))return;let r=this.landingPulse;r.x=e,r.y=t,r.strength=i.landing,this.pulses.add(r)}};var ae=256,pn=.93,go=.35;function hn(o){let e=o<=0?0:o>=1?1:o,t=e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055;return Math.round(t*255)}var ht=8192,pt=null;function bn(){if(!pt){pt=new Uint8Array(ht+1);for(let o=0;o<=ht;o++)pt[o]=hn(o/ht)}return pt}function xo(o,e,t){let i=o.length;if(i===0){t.fill(0);return}let r=new Float64Array(i*3);if(e==="linear")for(let s=0;s<i;s++){let[a,l,c]=Q(o[s]);r[s*3]=C(a),r[s*3+1]=C(l),r[s*3+2]=C(c)}else for(let s=0;s<i;s++)Oe(o[s],r,s*3);let n=new Float64Array(3);for(let s=0;s<ae;s++){let a=s/(ae-1),l=s*3;if(i===1){t[l]=r[0],t[l+1]=r[1],t[l+2]=r[2];continue}if(e==="steps"){let m=Math.min(i-1,Math.floor(a*i))*3;t[l]=r[m],t[l+1]=r[m+1],t[l+2]=r[m+2];continue}let c=a*(i-1),u=Math.min(i-2,Math.floor(c)),d=c-u,f=u*3,h=f+3;for(let m=0;m<3;m++)n[m]=r[f+m]+(r[h+m]-r[f+m])*d;e==="linear"?ri(n[0],n[1],n[2],t,l):(t[l]=n[0],t[l+1]=n[1],t[l+2]=n[2])}}var bt=class{bytes=new Uint8Array(ae*2*4);dirty=!0;cur=new Float32Array(ae*3);tgt=new Float32Array(ae*3);srgb=bn();animating=!1;dur=0;constructor(e,t){xo(e,t,this.tgt),this.cur.set(this.tgt),this.encode()}get transitioning(){return this.animating}setTarget(e,t,i){xo(e,t,this.tgt),i>0?(this.dur=i,this.animating=!0):(this.cur.set(this.tgt),this.animating=!1,this.encode())}update(e){if(!this.animating)return!1;let t=this.dur>0?1-Math.exp(-e*5e3/this.dur):1,i=!0,r=this.cur,n=this.tgt;for(let s=0;s<r.length;s++){let a=n[s],l=r[s];l+=(a-l)*t,Math.abs(a-l)<1e-4?l=a:i=!1,r[s]=l}return i&&(this.animating=!1),this.encode(),!0}sampleOklab(e,t){let i=Math.max(0,Math.min(ae-1,e|0))*3;t[0]=this.cur[i],t[1]=this.cur[i+1],t[2]=this.cur[i+2]}encode(){let e=this.bytes,t=this.cur,i=this.srgb,r=ht;for(let n=0;n<ae;n++){let s=t[n*3+1],a=t[n*3+2];for(let l=0;l<2;l++){let c=l===0?t[n*3]:pn,u=l===0?s:s*go,d=l===0?a:a*go,f=c+.3963377774*u+.2158037573*d,h=c-.1055613458*u-.0638541728*d,m=c-.0894841775*u-1.291485548*d,b=f*f*f,g=h*h*h,x=m*m*m,P=4.0767416621*b-3.3077115913*g+.2309699292*x,_=-1.2684380046*b+2.6097574011*g-.3413193965*x,y=-.0041960863*b-.7034186147*g+1.707614701*x,E=l*ae*4+n*4;e[E]=i[P<=0?0:P>=1?r:P*r+.5|0],e[E+1]=i[_<=0?0:_>=1?r:_*r+.5|0],e[E+2]=i[y<=0?0:y>=1?r:y*r+.5|0],e[E+3]=255}}this.dirty=!0}};var ze=[{quality:"high",scale:1},{quality:"medium",scale:1},{quality:"medium",scale:.85},{quality:"low",scale:.85},{quality:"low",scale:.72},{quality:"low",scale:.6},{quality:"low",scale:.5}],be=[4.17,6.06,6.94,8.33,11.11,16.67,33.33],Ue=120,gn=2e3,xn=5e3,_n=2e3,_o=2e3,vn=3e4,yn=3e5,wn=18e4,Pn=.8,Ge=0,vo=1,yo=2;function kn(o){let e=-1,t=.15;for(let i=0;i<be.length;i++){let r=Math.abs(o/be[i]-1);r<t&&(t=r,e=i)}return e}var gt=class{mode="auto";level=0;locked=!1;vsyncMs=16.67;cadenceMs=16.67;missRatio=0;frameMs=16.67;fps=60;cpuMs=0;gpuMs=null;deltas=new Float64Array(Ue);cand=new Int8Array(Ue);counts=new Int32Array(be.length);blacklist=new Float64Array(ze.length);fails=new Uint8Array(ze.length);lockedUntil=0;head=0;n=0;sum=0;slowSince=-1;goodSince=-1;lastChange=Number.NEGATIVE_INFINITY;verify=Ge;verifyAt=0;verifyFrom=0;missBefore=0;noGain=0;streakFrom=0;bestVsync=Number.POSITIVE_INFINITY;change={quality:"high",scale:1,reason:"slow"};get quality(){return this.mode!=="auto"?this.mode:ze[this.level].quality}get scale(){return this.mode!=="auto"?1:ze[this.level].scale}get samples(){return this.n}setMode(e){if(e===this.mode)return!1;let t=this.quality,i=this.scale;return this.mode=e,e==="auto"&&(this.level=0,this.locked=!1,this.verify=Ge,this.noGain=0,this.blacklist.fill(0),this.fails.fill(0),this.resetWindow()),t!==this.quality||i!==this.scale}resetVsync(){this.bestVsync=Number.POSITIVE_INFINITY,this.locked=!1,this.noGain=0,this.blacklist.fill(0),this.fails.fill(0),this.resetWindow()}resetWindow(){this.n=0,this.head=0,this.sum=0,this.counts.fill(0),this.slowSince=-1,this.goodSince=-1}sample(e,t,i,r){let n=e>.5?e<1e3?e:1e3:.5;if(this.n===Ue){this.sum-=this.deltas[this.head];let m=this.cand[this.head];m>=0&&(this.counts[m]=this.counts[m]-1)}else this.n++;let s=kn(n);this.deltas[this.head]=n,this.cand[this.head]=s,s>=0&&(this.counts[s]=this.counts[s]+1),this.sum+=n,this.head=(this.head+1)%Ue;let a=this.n;if(this.cpuMs+=(Math.max(0,t)-this.cpuMs)*.1,i!==null&&Number.isFinite(i)&&(this.gpuMs=this.gpuMs===null?i:this.gpuMs+(i-this.gpuMs)*.1),a>=20){let m=-1,b=-1,g=0;for(let x=0;x<be.length;x++){let P=this.counts[x];m<0&&P>=.2*a&&(m=x),P>g&&(g=P,b=x)}if(m<0&&(m=b),b>=0&&(this.cadenceMs=be[b]),m>=0){let x=be[m];a>=30&&x<this.bestVsync&&(this.bestVsync=x),this.vsyncMs=Math.min(x,this.bestVsync)}a===Ue&&b>=0&&g>=Pn*a&&this.maybeRise(b)}let l=1.5*this.vsyncMs,c=0;for(let m=0;m<a;m++)this.deltas[m]>l&&c++;if(this.missRatio=a>0?c/a:0,this.frameMs=a>0?this.sum/a:n,this.fps=1e3/this.frameMs,this.locked&&r>=this.lockedUntil&&(this.locked=!1),this.mode!=="auto"||this.locked)return null;let u=this.vsyncMs,d=this.gpuMs;if(this.verify===yo){if(r-this.verifyAt>=_o)this.verify=Ge,this.fails[this.level]=0;else if(a>=30&&(d!==null?d>.75*u:this.missRatio>.15)){let b=this.fails[this.level];return this.blacklist[this.level]=r+Math.min(vn*2**b,yn),this.fails[this.level]=Math.min(16,b+1),this.apply(this.verifyFrom,r,"slow")}}if(a<60)return null;if(this.verify===vo&&r-this.verifyAt>=_o){this.verify=Ge;let m=this.missRatio<.1||this.missRatio<this.missBefore-.05;if(d!==null||m)this.noGain=0;else if(this.noGain++===0&&(this.streakFrom=this.verifyFrom),this.noGain>=2)return this.locked=!0,this.lockedUntil=r+wn,this.noGain=0,this.bestVsync=Number.POSITIVE_INFINITY,this.apply(this.streakFrom,r,"locked")}let f=d!==null?d>.75*u:this.missRatio>.25&&this.cpuMs<.3*u,h=this.missRatio<.02&&(d===null||d<.5*u);if(this.slowSince=f?this.slowSince<0?r:this.slowSince:-1,this.goodSince=h?this.goodSince<0?r:this.goodSince:-1,r-this.lastChange<_n)return null;if(this.slowSince>=0&&r-this.slowSince>=gn&&this.level<ze.length-1){let m=this.level,b=this.missRatio,g=this.apply(m+1,r,"slow");return this.verify=vo,this.verifyFrom=m,this.missBefore=b,g}if(this.goodSince>=0&&r-this.goodSince>=xn&&this.level>0&&this.blacklist[this.level-1]<=r){let m=this.level,b=this.apply(m-1,r,"recovered");return this.verify=yo,this.verifyFrom=m,b}return null}maybeRise(e){let t=be[e];if(!(t>this.bestVsync*1.1))return;let i=this.gpuMs;(i!==null?i<.5*t&&this.cpuMs<.5*t:this.locked&&this.cpuMs<.3*t)&&(this.bestVsync=t,this.vsyncMs=t,this.missRatio=0,this.noGain=0,this.resetWindow())}apply(e,t,i){this.level=e,this.lastChange=t,this.verifyAt=t,this.verify=Ge,this.resetWindow();let r=this.change;return r.quality=this.quality,r.scale=this.scale,r.reason=i,r}};var wo=.06,_t=class{space=new Uint8Array(16);minor=new Uint8Array(16);data=new Float64Array(176);count=0;add(e){let t=this.count;t>=16?(t=this.oldest(!0),t<0&&(t=this.oldest(!1))):this.count++;let i=this.data,r=t*11;this.space[t]=e.space,this.minor[t]=e.minor?1:0,i[r]=e.x,i[r+1]=e.y,i[r+2]=e.strength,i[r+3]=e.speed,i[r+4]=e.width,i[r+5]=e.r,i[r+6]=e.g,i[r+7]=e.b,i[r+8]=e.colorMix,i[r+9]=0,i[r+10]=Math.max(.05,e.duration)}clear(){this.count=0}get needsClientOrigin(){for(let e=0;e<this.count;e++)if(this.space[e]===Z)return!0;return!1}strengthAt(e){let t=e*11,i=this.data;return i[t+2]*Po(i[t+9],i[t+10])}radiusCells(e){let t=e*11;return this.data[t+3]*this.data[t+9]}step(e,t,i,r,n){let s=this.data,a=0;for(let c=0;c<this.count;c++){let u=c*11,d=s[u+9]+e;d>=s[u+10]||(s[u+9]=d,a!==c&&(s.copyWithin(a*11,u,u+11),this.space[a]=this.space[c],this.minor[a]=this.minor[c]),a++)}this.count=a;let l=t.pitchPx;for(let c=0;c<a;c++){let u=c*11,d=s[u],f=s[u+1],h,m;switch(this.space[c]){case fe:h=t.hostX+d*t.hostW,m=t.hostY+f*t.hostH;break;case J:h=t.originX+(t.pad+d+.5)*l,m=t.originY+(t.pad+f+.5)*l;break;case Z:h=t.hostX+(d-i)*t.sx,m=t.hostY+(f-r)*t.sy;break;default:h=t.hostX+d*t.sx,m=t.hostY+f*t.sy}let b=s[u+9],g=812+c*12;n[g]=h,n[g+1]=m,n[g+2]=s[u+3]*b*l,n[g+3]=s[u+4]*l,n[g+4]=s[u+2]*Po(b,s[u+10]),n[g+5]=s[u+8],n[g+6]=0,n[g+7]=0,n[g+8]=s[u+5],n[g+9]=s[u+6],n[g+10]=s[u+7],n[g+11]=0}return a}oldest(e){let t=-1,i=-1;for(let r=0;r<this.count;r++){if(e&&this.minor[r]!==1)continue;let n=this.data[r*11+9]/this.data[r*11+10];n>i&&(i=n,t=r)}return t}};function Po(o,e){return(o<wo?o/wo:1)*(1-de(0,1,o/e))}var Sn={add:0,mul:1,override:2,max:3},bi=0,ko=1,An=2,vt=class{blend;halfLifeMs;value=0;primed=!1;disposed=!1;kind=bi;num=0;fn=null;obj=null;constructor(e,t="add",i=0){this.blend=Sn[t]??0,this.halfLifeMs=i>0?i:0,this.setSource(e)}setSource(e){typeof e=="number"?(this.kind=bi,this.num=e):typeof e=="function"?(this.kind=ko,this.fn=e):(this.kind=An,this.obj=e)}sample(e){let t;if(this.kind===bi)t=this.num;else try{t=this.kind===ko?this.fn():this.obj.get()}catch{t=Number.NaN}if(Number.isFinite(t))if(!this.primed||this.halfLifeMs<=0)this.value=t,this.primed=!0;else{let i=1-2**(-e*1e3/this.halfLifeMs);this.value+=(t-this.value)*i}}};var te=0,ie=1,yt=2,Se=3,He=4,wt=5,$=6,Ln=7,Eo=Math.PI/180;function Fn(o){switch(o.kind){case"number":case"int":return te;case"angle":return ie;case"boolean":return yt;case"color":return Se;case"vec2":return He;case"enum":return o.transition==="crossfade"?$:wt;default:return Ln}}function Mn(o){return o===te||o===ie||o===$?1:o===He?2:o===Se?3:0}var Pt=class{constructor(e,t){this.layout=e;this.params=new Float32Array(e.floatCount);let i=0;for(let r of Ze()){let n=et(r);if(!n)continue;let s=Fn(n),a=Mn(s),l=n,c=typeof l.min=="number"?l.min:0,u=typeof l.max=="number"?l.max:1,d=a>0&&(n.live==="uniform"||n.live==="realloc")&&l.tween!=="none",f=s===Se||s===$?1e-4:Math.max(1e-9,(u-c)*1e-4),h={id:this.entries.length,path:r,field:n,kind:s,off:i,n:a,lo:c,hi:u,eps:f,tweenable:d,fullCircle:s===ie&&n.fullCircle===!0,slot:e.slots.get(r),dur:0,active:!1,mods:null,eff:0,index:0,prev:0};i+=a,this.entries.push(h),this.byPath.set(r,h)}this.cur=new Float64Array(i),this.tgt=new Float64Array(i),this.active=new Int32Array(this.entries.length),this.modIds=new Int32Array(8),this.reset(t)}layout;params;dirty=!0;entries=[];byPath=new Map;cur;tgt;active;activeCount=0;modIds;modCount=0;rgb=new Float64Array(3);id(e){let t=this.byPath.get(e);if(!t)throw new Error(`[lumicells] unknown parameter '${e}'`);return t.id}entry(e){return this.byPath.get(e)}reset(e){this.activeCount=0;for(let t of this.entries)t.active=!1,this.snapTo(t,se(e,t.path)),t.kind===$&&(t.prev=t.index),this.refresh(t);this.dirty=!0}setTarget(e,t,i){let r=this.byPath.get(e);if(!r)return;if(!r.tweenable||!(i>0)){if(r.kind===$){let s=this.enumIndex(r,t);r.index=s,r.prev=s,this.cur[r.off]=1,this.tgt[r.off]=1}else this.snapTo(r,t);r.active&&this.deactivate(r),this.refresh(r);return}let n=r.off;switch(r.kind){case te:this.tgt[n]=t;break;case ie:{let s=t;this.tgt[n]=r.fullCircle?(this.cur[n]??0)+eo(this.cur[n]??0,s):s;break}case He:{let s=t;this.tgt[n]=s[0]??0,this.tgt[n+1]=s[1]??0;break}case Se:Oe(t,this.tgt,n);break;case $:{let s=this.enumIndex(r,t);if(s===r.index)return;let a=this.cur[n]??1;s===r.prev&&a<1?(r.prev=r.index,r.index=s,this.cur[n]=1-a):(r.prev=a>=.5?r.index:r.prev,r.index=s,this.cur[n]=0),this.tgt[n]=1,this.refresh(r);break}}r.dur=i,r.active||(r.active=!0,this.active[this.activeCount++]=r.id)}update(e){let t=this.dirty;this.dirty=!1;let i=0;for(let n=0;n<this.activeCount;n++){let s=this.active[n],a=this.entries[s],l=this.step(a,e);a.mods||this.refresh(a),l?a.active=!1:this.active[i++]=s}this.activeCount=i;for(let n=0;n<this.modCount;n++){let s=this.entries[this.modIds[n]],a=s.mods;if(!a)continue;let l=s.kind===te||s.kind===ie?this.cur[s.off]:s.index;for(let c=0;c<a.length;c++){let u=a[c];if(u.disposed||(u.sample(e),!u.primed))continue;let d=u.value;u.blend===1?l*=d:u.blend===2?l=d:u.blend===3?l=l>d?l:d:l+=d}if(l=s.fullCircle?s.lo+A(l-s.lo,s.hi-s.lo):l<s.lo?s.lo:l>s.hi?s.hi:l,l!==s.eff){s.eff=l;let c=s.slot;c&&s.kind===te?(this.params[c.offset]=l,this.dirty=!0):this.writeSlot(s)}}let r=this.dirty;return this.dirty=t||r,r}get animating(){return this.activeCount>0}num(e){return this.entries[e].eff}comp(e,t){let i=this.entries[e];return this.cur[i.off+t]??0}crossfadePrev(e){return this.entries[e].prev}crossfadeMix(e){let t=this.entries[e];return t.kind===$?this.cur[t.off]??1:1}isLive(e){let t=this.entries[e];return t.active||t.mods!==null}getEffective(e){return this.byPath.get(e)?.eff??Number.NaN}isModulated(e){return!!this.byPath.get(e)?.mods}addModulator(e,t,i,r){let n=this.byPath.get(e);if(!n||n.kind!==te&&n.kind!==ie)return null;let s=new vt(t,i,r);if(!n.mods){if(n.mods=[],this.modCount>=this.modIds.length){let a=new Int32Array(this.modIds.length*2);a.set(this.modIds),this.modIds=a}this.modIds[this.modCount++]=n.id}return n.mods.push(s),s}removeModulator(e,t){t.disposed=!0;let i=this.byPath.get(e);if(!i?.mods)return;let r=i.mods.indexOf(t);if(r>=0&&i.mods.splice(r,1),i.mods.length>0)return;i.mods=null;let n=0;for(let s=0;s<this.modCount;s++){let a=this.modIds[s];a!==i.id&&(this.modIds[n++]=a)}this.modCount=n,this.refresh(i)}enumIndex(e,t){if(typeof t=="number")return t;let r=(e.field.values??[]).indexOf(t);return r<0?0:r}deactivate(e){e.active=!1;let t=0;for(let i=0;i<this.activeCount;i++){let r=this.active[i];r!==e.id&&(this.active[t++]=r)}this.activeCount=t}snapTo(e,t){let i=e.off;switch(e.kind){case te:case ie:{let r=typeof t=="number"?t:0;this.cur[i]=r,this.tgt[i]=r;break}case He:{let r=t??[0,0];this.cur[i]=r[0]??0,this.cur[i+1]=r[1]??0,this.tgt[i]=this.cur[i],this.tgt[i+1]=this.cur[i+1];break}case Se:Oe(typeof t=="string"?t:"#000000",this.cur,i),this.tgt[i]=this.cur[i],this.tgt[i+1]=this.cur[i+1],this.tgt[i+2]=this.cur[i+2];break;case $:e.index=this.enumIndex(e,t),this.cur[i]=1,this.tgt[i]=1;break;case wt:e.index=this.enumIndex(e,t);break;case yt:e.index=t?1:0;break}}step(e,t){let i=e.dur>0?1-Math.exp(-t*5e3/e.dur):1,r=!0,n=e.off+e.n;for(let s=e.off;s<n;s++){let a=this.tgt[s],l=this.cur[s];l+=(a-l)*i,Math.abs(a-l)<=e.eps?l=a:r=!1,this.cur[s]=l}if(r&&e.fullCircle){let s=e.lo+A(this.cur[e.off]-e.lo,e.hi-e.lo);this.cur[e.off]=s,this.tgt[e.off]=s}return r}refresh(e){switch(e.kind){case te:{let t=this.cur[e.off];e.eff=t;let i=e.slot;i&&!e.mods&&(this.params[i.offset]=t,this.dirty=!0);return}case ie:{let t=this.cur[e.off];e.eff=e.fullCircle?e.lo+A(t-e.lo,e.hi-e.lo):t;break}case wt:case $:case yt:e.eff=e.index;break;default:e.eff=0}e.mods||this.writeSlot(e)}writeSlot(e){let t=e.slot;if(!t)return;let i=this.params,r=t.offset;switch(e.kind){case te:case wt:case $:case yt:i[r]=e.eff;break;case ie:i[r]=e.fullCircle?A(e.eff*Eo,S):e.eff*Eo;break;case He:i[r]=this.cur[e.off],i[r+1]=this.cur[e.off+1];break;case Se:{let n=this.rgb;io(this.cur[e.off],this.cur[e.off+1],this.cur[e.off+2],n),i[r]=Math.max(0,n[0]),i[r+1]=Math.max(0,n[1]),i[r+2]=Math.max(0,n[2]);break}default:return}this.dirty=!0}};var kt=class{constructor(e,t=1e-4){this.eps=t;this.cur=e,this.tgt=e}eps;cur;tgt;dur=0;set(e,t){this.tgt=e,this.dur=t,t>0||(this.cur=e)}step(e){if(this.cur===this.tgt)return!1;let t=this.dur>0?1-Math.exp(-e*5e3/this.dur):1;return this.cur+=(this.tgt-this.cur)*t,Math.abs(this.tgt-this.cur)<=this.eps&&(this.cur=this.tgt),!0}};var Lo=32,gi=null;function In(){return gi||(gi=so()),gi}var It=class{nativeResolution=!1;nativeGridPitch=0;nativeGridAlignY=!1;nativeGridAlignX=!1;nativeGridFractionalPitch=!1;nativeGridMaxCells=2048;layout;store;lut;clock=new at;influences=new ct;pulses=new _t;lifts;perf=new gt;geo=oo();frame;geometryChanged=!0;destroyed=!1;config;random;onWarn;sizingMix;rates={speed:1,flow:0,sphereRotation:0,sphereBreathe:0,pulse:0,wave:0,vortex:0,rain:0,drift:0,lifeRate:0,sparsity:0,flicker:0,sparkle:0,ripple:0};liftParams=bo();geoIn={hostCssW:300,hostCssH:150,overflowCss:0,dpr:1,deviceW:0,deviceH:0,maxDpr:2,maxPixels:4.2,scale:1,cssPitch:10,maxDim:0};infCtx;forced=new Float64Array(Lo*5);forcedCount=0;pulseInit={space:0,x:0,y:0,strength:0,speed:0,width:0,r:1,g:1,b:1,colorMix:0,duration:1,minor:!1};tmp=new Float64Array(3);pixelCap=Number.POSITIVE_INFINITY;reducedMotion=!1;software=!1;clientX=0;clientY=0;hasViewport=!1;ids;constructor(e={}){this.random=e.random??to(Math.random()*4294967296>>>0),this.onWarn=e.onWarn,this.layout=e.layout??In(),this.config=ot(e.config??{}).config,this.store=new Pt(this.layout,this.config),this.lut=new bt(this.config.color.palette,this.config.color.interpolation),this.lifts=new mt(this.random,this.pulses),this.sizingMix=new kt(this.config.grid.sizing==="pitch"?1:0),this.perf.setMode(this.config.render.quality),this.influences.onOverflow=t=>this.warn("influence-overflow",`[lumicells] ${t} influences are alive but only 64 fit on the GPU; lower-priority ones fade out.`),this.infCtx={geo:this.geo,clientX:0,clientY:0,defaultStrength:.8,defaultFalloff:2},this.ids=Tn(this.store),this.frame={canvasWidth:1,canvasHeight:1,cols:1,rows:1,pad:2,pitchPx:8,params:this.store.params,paramsDirty:!0,frame:new Float32Array(1516),lut:this.lut.bytes,lutDirty:!0,lifeSteps:0,lifeReset:!0,lifeSeed:this.random()*4294967296>>>0,lifeRule:0,lifeBirth:0,lifeSeedDensity:.3,lifts:this.lifts.instances,liftCount:0,bloomSigma:1.2,hazeSigma:6,bloomStrength:.8,hazeStrength:.12,quality:"high",opaque:!0,debugView:0},this.updateGeometry()}getConfig(){return this.config}setConfig(e,t={}){if(this.destroyed)return[];let{patch:i}=Yi(e);return this.commit(ot(Ne(this.config,i)).config,t)}replaceConfig(e,t={}){return this.destroyed?[]:this.commit(ot(e).config,t)}getEffective(e){let t=this.store.getEffective(e);return Number.isNaN(t)?se(this.config,e):t}modulate(e,t,i={}){let r=this.store,n=this.destroyed?null:r.addModulator(e,t,i.blend,i.smoothingMs),s=!n,a=()=>{s||!n||(s=!0,i.signal?.removeEventListener("abort",a),this.destroyed||r.removeModulator(e,n))};return n&&i.signal&&(i.signal.aborted?a():i.signal.addEventListener("abort",a,{once:!0})),{set:l=>{!s&&n&&n.setSource(l)},dispose:a,[Symbol.dispose]:a}}createInfluence(e){return this.influences.add(e)}influenceHandle(e,t,i){let r=this.influences,n=!1,s=()=>{n||(n=!0,t?.removeEventListener("abort",s),r.dispose(e),i?.())};return t&&(t.aborted?s():t.addEventListener("abort",s,{once:!0})),{id:e.id,get active(){return e.slot&&!e.removed},update:a=>{n||r.update(e,a)},dispose:s,[Symbol.dispose]:s}}addInfluence(e,t){return this.destroyed?Rn():this.influenceHandle(this.createInfluence(e),t)}pulse(e){if(this.destroyed)return;let t=this.store,i=this.ids,r=this.pulseInit;r.space=ut[e.space??"host"]??ke,r.x=e.x,r.y=e.y,r.strength=e.strength??t.num(i.rippleStrength),r.speed=Math.max(.01,e.speed??t.num(i.rippleSpeed)),r.width=Math.max(.05,e.width??t.num(i.rippleWidth)),e.color?(rt(e.color,this.tmp),r.r=this.tmp[0],r.g=this.tmp[1],r.b=this.tmp[2],r.colorMix=e.colorMix??.5):(r.r=1,r.g=1,r.b=1,r.colorMix=e.colorMix??0);let n=this.geo,s=Math.hypot(n.hostW,n.hostH)/2/n.pitchPx;r.duration=e.duration??Zi(1.2*s/r.speed,.8,4),r.minor=!1,this.pulses.add(r)}lift(e){if(this.destroyed||this.reducedMotion||this.forcedCount>=Lo)return;let t=this.forcedCount++*5;this.forced[t]=ut[e.space??"host"]??ke,this.forced[t+1]=e.x,this.forced[t+2]=e.y,this.forced[t+3]=Math.max(1,Math.min(32,Math.floor(e.count??1))),this.forced[t+4]=e.radius??Number.NaN}cellAt(e,t,i,r){let n=this.geo,s,a;switch(e){case fe:s=n.hostX+t*n.hostW,a=n.hostY+i*n.hostH;break;case J:r[0]=Math.round(t)-(n.cols-1)/2,r[1]=Math.round(i)-(n.rows-1)/2;return;case Z:s=n.hostX+(t-this.clientX)*n.sx,a=n.hostY+(i-this.clientY)*n.sy;break;default:s=n.hostX+t*n.sx,a=n.hostY+i*n.sy}r[0]=Math.floor((s-n.originX)/n.pitchPx)-n.pad-(n.cols-1)/2,r[1]=Math.floor((a-n.originY)/n.pitchPx)-n.pad-(n.rows-1)/2}get needsClientOrigin(){if(this.influences.needsClientOrigin||this.pulses.needsClientOrigin)return!0;for(let e=0;e<this.forcedCount;e++)if(this.forced[e*5]===Z)return!0;return!1}get cellCss(){return this.geo.pitchPx/this.geo.sx}setViewport(e){let t=this.geoIn;t.hostCssW=Math.max(1,e.hostCssW),t.hostCssH=Math.max(1,e.hostCssH),t.dpr=e.dpr>0?e.dpr:1,t.deviceW=e.deviceW,t.deviceH=e.deviceH,this.hasViewport=!0,this.updateGeometry()}setClientOrigin(e,t){this.clientX=e,this.clientY=t}setPixelCap(e){this.pixelCap=e>0?e:Number.POSITIVE_INFINITY,this.updateGeometry()}setMaxDrawableSize(e){let t=e>0&&Number.isFinite(e)?Math.floor(e):0;t!==this.geoIn.maxDim&&(this.geoIn.maxDim=t,this.updateGeometry())}setReducedMotion(e){this.reducedMotion=e,e&&(this.forcedCount=0)}get isReducedMotion(){return this.reducedMotion}setSoftwareFallback(e){this.software=e,this.perf.setMode(e?"low":this.config.render.quality),this.updateGeometry()}setDebugView(e){this.frame.debugView=e|0}samplePerf(e,t,i,r){let n=this.perf.sample(e,t,i,r);return n&&this.updateGeometry(),n}invalidateGpu(){this.frame.paramsDirty=!0,this.frame.lutDirty=!0,this.frame.lifeReset=!0}commitFrame(){let e=this.frame;e.paramsDirty=!1,e.lutDirty=!1,e.lifeReset=!1}destroy(){this.destroyed||(this.destroyed=!0,this.influences.clear(),this.pulses.clear(),this.lifts.clear(),this.forcedCount=0)}update(e,t=0){let i=this.frame,r=i.frame;if(this.destroyed)return i;let n=e>0?e<.1?e:.1:0,s=this.store,a=this.ids;s.update(n),s.dirty&&(i.paramsDirty=!0,s.dirty=!1),this.lut.update(n),this.lut.dirty&&(i.lutDirty=!0,this.lut.dirty=!1),(this.sizingMix.step(n)||s.isLive(a.count)||s.isLive(a.pitch)||s.isLive(a.maxDpr)||s.isLive(a.maxPixels))&&this.updateGeometry();let c=this.geo,u=this.rates,d=this.reducedMotion;u.speed=Math.max(0,s.num(a.speed))*(d?.15:1),u.flow=s.num(a.flowSpeed),u.sphereRotation=s.num(a.rotation),u.sphereBreathe=s.num(a.breathe),u.pulse=s.num(a.pulseSpeed),u.wave=s.num(a.waveSpeed),u.vortex=s.num(a.vortexSpeed),u.rain=s.num(a.rainSpeed),u.drift=s.num(a.drift),u.lifeRate=s.num(a.lifeWeight)>.001?s.num(a.lifeRate):0,u.sparsity=1/Math.max(s.num(a.sparsityPeriod),.1),u.flicker=Math.max(0,s.num(a.flickerRate)),u.sparkle=1/Math.max(s.num(a.sparkleDuration),.05),u.ripple=1/Math.max(s.num(a.rippleLife),.1);let f=this.clock;f.advance(n,u),i.lifeSteps=f.lifeSteps,i.lifeSeed=i.lifeSeed+f.lifeSteps>>>0,i.lifeRule=s.num(a.lifeRule),i.lifeBirth=s.num(a.lifeBirth),i.lifeSeedDensity=s.num(a.lifeDensity);let h=this.infCtx;h.clientX=this.clientX,h.clientY=this.clientY,h.defaultStrength=s.num(a.infStrength),h.defaultFalloff=s.num(a.infFalloff);let m=this.influences.step(n,h,r),b=this.fillLiftParams();d?this.forcedCount=0:this.drainForced(b);let g=this.lifts.step(n,b,c,r),x=this.pulses.step(n,c,this.clientX,this.clientY,r);return r[0]=f.flow,r[1]=f.sphereRotation,r[2]=f.sphereBreathe,r[3]=f.pulse,r[4]=f.wave,r[5]=f.vortex,r[6]=f.rain,r[7]=f.drift,r[8]=f.seconds,r[9]=f.lifeAcc,r[10]=s.num(a.energy),r[11]=d?1:0,r[12]=c.cols,r[13]=c.rows,r[14]=c.pitchPx,r[15]=c.pad,r[16]=c.originX,r[17]=c.originY,r[18]=c.canvasW,r[19]=c.canvasH,r[20]=c.hostX,r[21]=c.hostY,r[22]=c.hostW,r[23]=c.hostH,r[24]=c.centerX,r[25]=c.centerY,r[26]=1/c.halfMin,r[27]=c.pitchPx/c.halfMin,r[28]=m,r[29]=x,r[30]=g,r[31]=i.debugView,r[32]=s.crossfadePrev(a.mapping),r[33]=s.crossfadeMix(a.mapping),r[34]=this.software?1:0,r[35]=u.drift!==0||f.drift!==0?1:0,Be(r,36,f.sparsity),Be(r,38,f.sparkle),Be(r,40,f.flicker),Be(r,42,f.ripple),i.canvasWidth=c.canvasW,i.canvasHeight=c.canvasH,i.cols=c.cols,i.rows=c.rows,i.pad=c.pad,i.pitchPx=c.pitchPx,i.liftCount=g,i.bloomSigma=s.num(a.bloomSigma),i.hazeSigma=s.num(a.hazeSigma),i.bloomStrength=s.num(a.bloomStrength),i.hazeStrength=s.num(a.hazeStrength),i.quality=this.perf.quality,i.opaque=this.config.render.overflow<=0,i}get settling(){return this.store.animating||this.lut.transitioning||this.pulses.count>0||this.lifts.count>0}warn(e,t){this.onWarn?.(e,t)}commit(e,t){let i=ti(this.config,e);if(i.length===0)return i;this.config=e;let r=Math.max(0,t.transition??e.transition),n=!1;for(let s of i){let a=et(s);if(!a)continue;let l=se(e,s);switch(a.live){case"lut":n=!0;break;case"restart":this.store.setTarget(s,l,0),this.frame.lifeReset=!0;break;case"static":this.store.setTarget(s,l,0),s==="render.quality"&&!this.software&&this.perf.setMode(l);break;default:this.store.setTarget(s,l,r),s==="grid.sizing"&&this.sizingMix.set(l==="pitch"?1:0,r)}}return n&&this.lut.setTarget(e.color.palette,e.color.interpolation,r),this.updateGeometry(),i}fillLiftParams(){let e=this.store,t=this.ids,i=this.liftParams,r=this.config.lift;return i.enabled=r.enabled&&!this.reducedMotion,i.style=r.style==="float"?1:0,i.amount=e.num(t.liftAmount),i.max=e.num(t.liftMax),i.scale=e.num(t.liftScale),i.height=e.num(t.liftHeight),i.parallax=e.num(t.liftParallax),i.tilt=e.num(t.liftTilt),i.holdMin=e.num(t.liftHoldMin),i.holdMax=e.num(t.liftHoldMax),i.rise=e.num(t.liftRise),i.fall=e.num(t.liftFall),i.bokeh=e.num(t.liftBokeh),i.socket=e.num(t.liftSocket),i.outerBias=e.num(t.liftOuterBias),i.cluster=e.num(t.liftCluster),i.landing=e.num(t.liftLanding),i.floatSpeed=e.num(t.liftFloatSpeed),i.floatDrift=e.num(t.liftFloatDrift),i.sceneX=e.comp(t.center,0),i.sceneY=e.comp(t.center,1),i.zoom=e.num(t.zoom),i}drainForced(e){let t=this.forcedCount;if(t===0)return;this.forcedCount=0;let i=this.forced,r=this.tmp;for(let n=0;n<t;n++){let s=n*5;this.cellAt(i[s],i[s+1],i[s+2],r);let a=i[s+3],l=i[s+4];this.lifts.force(r[0],r[1],a,Number.isNaN(l)?Math.max(1,Math.sqrt(a)):l,e,this.geo)}}updateGeometry(){let e=this.store,t=this.ids,i=this.geoIn,r=this.config;i.overflowCss=r.render.overflow,i.maxDpr=e.num(t.maxDpr),i.maxPixels=this.nativeResolution?Number.POSITIVE_INFINITY:Math.min(e.num(t.maxPixels),this.pixelCap),i.scale=this.perf.scale;let n=Math.min(i.hostCssW,i.hostCssH)/Math.max(1,e.num(t.count)),s=Math.max(1,e.num(t.pitch)),a=this.sizingMix.cur;i.cssPitch=a<=0?n:a>=1?s:Math.exp(Math.log(n)*(1-a)+Math.log(s)*a),this.nativeResolution&&this.nativeGridPitch>0&&(i.cssPitch=this.nativeGridPitch),i.alignWholeCellsY=this.nativeResolution&&this.nativeGridAlignY,i.alignWholeCellsX=this.nativeResolution&&this.nativeGridAlignX,i.fractionalPitch=this.nativeResolution&&this.nativeGridFractionalPitch,i.maxGridCells=this.nativeResolution?Math.max(64,this.nativeGridMaxCells):void 0,ro(i,this.geo)&&(this.geometryChanged=!0)}get measured(){return this.hasViewport}};function Tn(o){return{speed:o.id("animation.speed"),energy:o.id("animation.energy"),flowSpeed:o.id("modes.flow.speed"),rotation:o.id("modes.sphere.rotationSpeed"),breathe:o.id("modes.sphere.breatheSpeed"),pulseSpeed:o.id("modes.pulse.speed"),waveSpeed:o.id("modes.wave.speed"),vortexSpeed:o.id("modes.vortex.speed"),rainSpeed:o.id("modes.rain.speed"),drift:o.id("color.drift"),sparsityPeriod:o.id("animation.sparsity.period"),flickerRate:o.id("animation.flicker.rate"),sparkleDuration:o.id("animation.sparkle.duration"),rippleLife:o.id("modes.ripple.life"),lifeWeight:o.id("modes.life.weight"),lifeRate:o.id("modes.life.stepRate"),lifeBirth:o.id("modes.life.birthRate"),lifeDensity:o.id("modes.life.seedDensity"),lifeRule:o.id("modes.life.rule"),mapping:o.id("color.mapping"),bloomSigma:o.id("glow.bloom.radius"),hazeSigma:o.id("glow.haze.radius"),bloomStrength:o.id("glow.bloom.strength"),hazeStrength:o.id("glow.haze.strength"),pitch:o.id("grid.pitch"),count:o.id("grid.count"),maxDpr:o.id("render.maxDpr"),maxPixels:o.id("render.maxPixels"),center:o.id("scene.center"),zoom:o.id("scene.zoom"),infStrength:o.id("interaction.influenceStrength"),infFalloff:o.id("interaction.influenceFalloff"),rippleStrength:o.id("interaction.rippleStrength"),rippleSpeed:o.id("interaction.rippleSpeed"),rippleWidth:o.id("interaction.rippleWidth"),liftAmount:o.id("lift.amount"),liftMax:o.id("lift.max"),liftScale:o.id("lift.scale"),liftHeight:o.id("lift.height"),liftParallax:o.id("lift.parallax"),liftTilt:o.id("lift.tilt"),liftHoldMin:o.id("lift.holdMin"),liftHoldMax:o.id("lift.holdMax"),liftRise:o.id("lift.rise"),liftFall:o.id("lift.fall"),liftBokeh:o.id("lift.bokeh"),liftSocket:o.id("lift.socket"),liftOuterBias:o.id("lift.outerBias"),liftCluster:o.id("lift.cluster"),liftLanding:o.id("lift.landing"),liftFloatSpeed:o.id("lift.floatSpeed"),liftFloatDrift:o.id("lift.floatDrift")}}function Rn(){let o=()=>{};return{id:-1,active:!1,update:o,dispose:o,[Symbol.dispose]:o}}var Mo=/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen/i,Nn=/nvidia|geforce|quadro|radeon|\bamd\b|\bati\b|intel/i;function Bn(o){return!Nn.test(o)&&!Mo.test(o)}function On(o){let e=o.getExtension("WEBGL_debug_renderer_info"),t=e?o.getParameter(e.UNMASKED_RENDERER_WEBGL):null,i=o.getParameter(o.RENDERER);return String(t??i??"")}function Fo(o,e){let t=o.createTexture(),i=o.createFramebuffer();if(!t||!i)return!1;o.bindTexture(o.TEXTURE_2D,t),o.texImage2D(o.TEXTURE_2D,0,e.internalFormat,4,4,0,e.format,e.type,null),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.bindFramebuffer(o.FRAMEBUFFER,i),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,t,0);let r=o.checkFramebufferStatus(o.FRAMEBUFFER)===o.FRAMEBUFFER_COMPLETE;return o.bindFramebuffer(o.FRAMEBUFFER,null),o.bindTexture(o.TEXTURE_2D,null),o.deleteFramebuffer(i),o.deleteTexture(t),r}function Co(o,e=!1){let t={internalFormat:o.RGBA8,format:o.RGBA,type:o.UNSIGNED_BYTE},i={internalFormat:o.RGBA16F,format:o.RGBA,type:o.HALF_FLOAT},r=o.getExtension("EXT_color_buffer_float")??o.getExtension("EXT_color_buffer_half_float"),n=!e&&!!r&&Fo(o,i),s={internalFormat:o.R11F_G11F_B10F,format:o.RGB,type:o.HALF_FLOAT},a=n&&Fo(o,s),l=On(o),c=o.getParameter(o.MAX_TEXTURE_SIZE),u=o.getParameter(o.MAX_RENDERBUFFER_SIZE),d=o.getParameter(o.MAX_VIEWPORT_DIMS),f=[Number(d?.[0]??0),Number(d?.[1]??0)],h=Number.POSITIVE_INFINITY;for(let m of[c,u,f[0],f[1]])m>0&&Number.isFinite(m)&&(h=Math.min(h,m));return{hdr:n,hdrFormat:n?i:t,glowFormat:a?s:n?i:t,rgba8:t,parallelCompile:o.getExtension("KHR_parallel_shader_compile"),timerQuery:o.getExtension("EXT_disjoint_timer_query_webgl2"),loseContext:o.getExtension("WEBGL_lose_context"),maxTextureSize:c,maxRenderbufferSize:u,maxViewportDims:f,maxDrawableSize:Number.isFinite(h)?h:0,maxDrawBuffers:o.getParameter(o.MAX_DRAW_BUFFERS),maxUniformBlockSize:o.getParameter(o.MAX_UNIFORM_BLOCK_SIZE),renderer:l,software:Mo.test(l),tiled:Bn(l)}}var xe=class extends Error{constructor(t,i,r){super(t);this.log=i;this.source=r;this.name="ShaderError"}log;source};function Dn(o){return o.split(`
`).map((e,t)=>`${String(t+1).padStart(4," ")}| ${e}`).join(`
`)}function zn(o,e){let t=o.split(`
`),i=[],r=/\d+:(\d+):/g,n=new Set;for(let s=r.exec(e);s&&i.length<6;s=r.exec(e)){let a=Number(s[1]);n.has(a)||(n.add(a),i.push(`${String(a).padStart(4," ")}| ${t[a-1]??""}`))}return i.join(`
`)}function Un(o,e,t){let i=new Map;return{handle:e,label:t,uniform(r){let n=i.get(r);return n===void 0&&(n=o.getUniformLocation(e,r),i.set(r,n)),n},bindBlock(r,n){let s=o.getUniformBlockIndex(e,r);s!==o.INVALID_INDEX&&o.uniformBlockBinding(e,s,n)},dispose(){o.deleteProgram(e),i.clear()}}}function Io(o,e,t,i,r){let n=o.createShader(o.VERTEX_SHADER),s=o.createShader(o.FRAGMENT_SHADER),a=o.createProgram();if(!n||!s||!a)throw new xe(`[lumicells] cannot create program "${i}"`,"");o.shaderSource(n,e),o.shaderSource(s,t),o.compileShader(n),o.compileShader(s),o.attachShader(a,n),o.attachShader(a,s),o.linkProgram(a);let l=null,c=!1,u=f=>{c||(c=!0,o.deleteShader(n),o.deleteShader(s),f&&o.deleteProgram(a))},d=()=>{let f=`[lumicells] program "${i}" failed to link`,h=o.getProgramInfoLog(a)??"",m;for(let[b,g,x]of[[n,e,"vert"],[s,t,"frag"]])if(!o.getShaderParameter(b,o.COMPILE_STATUS)){h=o.getShaderInfoLog(b)??"",f=`[lumicells] shader "${i}.${x}" failed to compile:
${h}
${zn(g,h)}`,m=Dn(g);break}throw u(!0),new xe(f,h,m)};return{label:i,poll(){return l||(c||o.isContextLost()||r&&!o.getProgramParameter(a,r.COMPLETION_STATUS_KHR)?null:(o.getProgramParameter(a,o.LINK_STATUS)||d(),u(!1),l=Un(o,a,i),l))},dispose(){if(l){l.dispose(),l=null,c=!0;return}u(!0)}}}function oe(o,e,t,{filter:i=o.NEAREST,wrap:r=o.CLAMP_TO_EDGE,format:n}={},s=null){let a=o.createTexture();if(!a)throw new Error("[lumicells] cannot create texture");return o.bindTexture(o.TEXTURE_2D,a),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,i),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,i),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,r),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,r),o.pixelStorei(o.UNPACK_ALIGNMENT,1),o.texImage2D(o.TEXTURE_2D,0,n?.internalFormat??o.RGBA8,e,t,0,n?.format??o.RGBA,n?.type??o.UNSIGNED_BYTE,s),a}function Gn(o){let e=o.checkFramebufferStatus(o.FRAMEBUFFER);if(e!==o.FRAMEBUFFER_COMPLETE&&!o.isContextLost())throw o.bindFramebuffer(o.FRAMEBUFFER,null),new Error(`[lumicells] framebuffer incomplete: 0x${e.toString(16)}`)}function $e(o,e){let t=o.createFramebuffer();if(!t)throw new Error("[lumicells] cannot create framebuffer");o.bindFramebuffer(o.FRAMEBUFFER,t);let i=[];for(let r=0;r<e.length;r++){let n=o.COLOR_ATTACHMENT0+r;o.framebufferTexture2D(o.FRAMEBUFFER,n,o.TEXTURE_2D,e[r]??null,0),i.push(n)}return o.drawBuffers(i),Gn(o),o.bindFramebuffer(o.FRAMEBUFFER,null),t}function le(o,e=32){return Math.max(e,Math.ceil(Math.max(1,o)/e)*e)}function _e(o,e,t=32){return e>o||le(e,t)*2<o}var To=[["P_grid_gap","0.27"],["P_grid_roundness","0.3"],["P_grid_softness","0.6"],["P_grid_emitter","0.18"],["P_grid_bevel","0.0"],["P_scene_center","vec2(-0.02, -0.02)"],["P_scene_zoom","1.0"],["P_animation_blend","0.0"],["P_animation_brightness","1.0"],["P_animation_gamma","1.15"],["P_animation_floor","0.16"],["P_animation_energy","1.0"],["P_animation_flicker_amount","0.4"],["P_animation_flicker_rate","0.3"],["P_animation_sparkle_amount","0.35"],["P_animation_sparkle_rate","0.008"],["P_animation_sparkle_duration","0.5"],["P_animation_sparsity_amount","0.55"],["P_animation_sparsity_period","3.0"],["P_modes_flow_weight","0.1"],["P_modes_flow_scale","1.6"],["P_modes_flow_direction","0.5235988"],["P_modes_flow_threshold","0.45"],["P_modes_flow_softness","0.3"],["P_modes_sphere_weight","1.0"],["P_modes_sphere_radius","0.68"],["P_modes_sphere_shift","vec2(0.02, 0.16)"],["P_modes_sphere_hole","0.25"],["P_modes_sphere_holeSoftness","0.12"],["P_modes_sphere_rimPower","1.3"],["P_modes_sphere_outerFalloff","0.38"],["P_modes_sphere_lightAngle","3.4906585"],["P_modes_sphere_lightStrength","0.45"],["P_modes_sphere_tilt","0.3490659"],["P_modes_sphere_surface","0.55"],["P_modes_sphere_surfaceScale","2.5"],["P_modes_sphere_wobble","0.08"],["P_modes_sphere_breathe","0.025"],["P_modes_sphere_fadeAngle","6.0213859"],["P_modes_sphere_fadeAmount","1.0"],["P_modes_pulse_weight","0.0"],["P_modes_pulse_frequency","3.0"],["P_modes_pulse_width","0.14"],["P_modes_pulse_breathe","0.35"],["P_modes_pulse_falloff","1.0"],["P_modes_pulse_origin","vec2(0.0, 0.0)"],["P_modes_wave_weight","0.0"],["P_modes_wave_angle","0.3490659"],["P_modes_wave_frequency","2.5"],["P_modes_wave_sharpness","0.35"],["P_modes_wave_interference","0.5"],["P_modes_ripple_weight","0.0"],["P_modes_ripple_rate","1.2"],["P_modes_ripple_speed","0.4"],["P_modes_ripple_width","0.09"],["P_modes_ripple_life","2.5"],["P_modes_vortex_weight","0.0"],["P_modes_vortex_arms","3.0"],["P_modes_vortex_twist","3.0"],["P_modes_vortex_falloff","0.9"],["P_modes_vortex_sharpness","0.4"],["P_modes_life_weight","0.0"],["P_modes_life_fadeSteps","4.0"],["P_modes_rain_weight","0.0"],["P_modes_rain_density","0.25"],["P_modes_rain_tail","0.5"],["P_modes_rain_angle","0.0"],["P_color_mapping","0.0"],["P_color_angle","0.3839724"],["P_color_bend","0.35"],["P_color_scale","1.0"],["P_color_offset","0.0"],["P_color_warp","0.12"],["P_color_warpScale","1.3"],["P_color_jitter","0.12"],["P_color_intensityShift","0.12"],["P_color_saturation","1.05"],["P_color_hot_amount","0.15"],["P_color_hot_threshold","0.92"],["P_color_hot_core","0.8"],["P_color_accent_color","vec3(0.0060, 0.5271, 0.6867)"],["P_color_accent_amount","0.9"],["P_background_color","vec3(0.0, 0.0, 0.0319)"],["P_background_vignette","0.35"],["P_background_spotA_color","vec3(0.1441, 0.0137, 0.1559)"],["P_background_spotA_position","vec2(-1.3, -0.2)"],["P_background_spotA_radius","1.25"],["P_background_spotA_strength","0.65"],["P_background_spotB_color","vec3(0.0080, 0.0144, 0.2086)"],["P_background_spotB_position","vec2(-0.8, 1.1)"],["P_background_spotB_radius","0.9"],["P_background_spotB_strength","0.5"],["P_glow_halo_strength","0.5"],["P_glow_halo_radius","0.18"],["P_glow_bloom_strength","0.8"],["P_glow_bloom_threshold","0.35"],["P_glow_bloom_knee","0.5"],["P_glow_haze_strength","0.12"],["P_glow_saturation","1.15"],["P_glow_exposure","1.0"],["P_glow_whitePoint","4.0"],["P_lift_brightness","0.9"],["P_lift_whiten","0.12"],["P_lift_shadow","0.4"],["P_lift_halo","0.8"],["E_animation_blend_screen","0.0"],["E_animation_blend_add","1.0"],["E_animation_blend_max","2.0"],["E_color_mapping_spatial","0.0"],["E_color_mapping_radial","1.0"],["E_color_mapping_angular","2.0"],["E_color_mapping_intensity","3.0"],["E_color_mapping_noise","4.0"]],Ro=To.map(([o,e])=>`#ifndef ${o}
#define ${o} ${e}
#endif`).join(`
`);function No(o){let e=new Set,t=/#define\s+([A-Za-z_]\w*)/g;for(let i=t.exec(o);i;i=t.exec(o))i[1]&&e.add(i[1]);return To.map(([i])=>i).filter(i=>!e.has(i))}var Tt=class{constructor(e,t,i=4){this.gl=e;this.ext=t;for(let r=0;r<i;r++){let n=e.createQuery();if(!n)break;this.queries.push(n),this.pending.push(!1),this.tainted.push(!1)}}gl;ext;queries=[];pending=[];tainted=[];head=0;active=!1;ms=null;begin(){let e=this.gl,t=this.queries.length;if(t===0)return;if(e.getParameter(this.ext.GPU_DISJOINT_EXT))for(let r=0;r<t;r++)this.pending[r]&&(this.tainted[r]=!0);for(let r=0;r<t;r++){let n=(this.head+r)%t,s=this.queries[n];if(!s||!this.pending[n]||!e.getQueryParameter(s,e.QUERY_RESULT_AVAILABLE))continue;let a=Number(e.getQueryParameter(s,e.QUERY_RESULT));this.pending[n]=!1;let l=this.tainted[n];this.tainted[n]=!1;let c=a/1e6;!l&&Number.isFinite(c)&&c>=0&&c<1e3&&(this.ms=c)}let i=this.queries[this.head];!i||this.pending[this.head]||(e.beginQuery(this.ext.TIME_ELAPSED_EXT,i),this.active=!0)}end(){this.active&&(this.gl.endQuery(this.ext.TIME_ELAPSED_EXT),this.active=!1,this.pending[this.head]=!0,this.head=(this.head+1)%this.queries.length)}dispose(){this.active&&this.gl.endQuery(this.ext.TIME_ELAPSED_EXT),this.active=!1;for(let e of this.queries)this.gl.deleteQuery(e);this.queries.length=0}};var Bo=`
#define PI 3.14159265
#define TAU 6.28318531

float sat(float x) { return clamp(x, 0.0, 1.0); }
vec2 sat2(vec2 x) { return clamp(x, 0.0, 1.0); }
vec3 sat3(vec3 x) { return clamp(x, 0.0, 1.0); }
float sq(float x) { return x * x; }
vec3 sq3(vec3 x) { return x * x; }
float max3(vec3 c) { return max(c.r, max(c.g, c.b)); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 saturateColor(vec3 c, float s) { return max(vec3(0.0), mix(vec3(luma(c)), c, s)); }
// Mirrored repeat: identity on [0,1], folds back outside (seamless palette cycling).
float tri(float x) { return 1.0 - abs(fract(x * 0.5) * 2.0 - 1.0); }
// Fades a periodic feature out as it approaches the cell Nyquist limit (x = cycles per cell).
float bandLimit(float x) { return sat(1.0 - (x - 0.25) * 5.0); }

// ---- Integer hashes (PCG). Never sin-hashes: those break at large inputs on mobile GPUs.
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
uint hash2(uvec2 v) { return pcg(v.x + pcg(v.y)); }
uint hash3(uvec3 v) { return pcg(v.x + pcg(v.y + pcg(v.z))); }
// 24 random bits -> [0,1) without rounding up to 1.0.
float u01(uint h) { return float(h >> 8u) * (1.0 / 16777216.0); }

// ---- Render-target encoding: HDR targets store linear values, RGBA8 stores sqrt(x/4)
// (perceptual precision in the darks, headroom up to 4). Functions, not macros, so a texture
// fetch passed in is evaluated once.
#if HDR_RT
vec4 enc4(vec4 v) { return v; }
vec4 dec4(vec4 v) { return v; }
#define GLOW_SCALE 1.0
#else
vec4 enc4(vec4 v) { return sqrt(clamp(v * 0.25, 0.0, 1.0)); }
vec4 dec4(vec4 v) { return v * v * 4.0; }
// The combined glow already carries strength and saturation (up to ~4x the raw bloom), which
// would clip at enc4's ceiling of 4 and shift hue; RGBA8 stores it pre-divided by this.
#define GLOW_SCALE 4.0
#endif

// ---- Color
vec3 lin2srgb(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

float cbrt(float x) { return sign(x) * pow(abs(x), 1.0 / 3.0); }

vec3 lin2oklab(vec3 c) {
  float l = cbrt(dot(c, vec3(0.4122214708, 0.5363325363, 0.0514459929)));
  float m = cbrt(dot(c, vec3(0.2119034982, 0.6806995451, 0.1073969566)));
  float s = cbrt(dot(c, vec3(0.0883024619, 0.2817188376, 0.6299787005)));
  return vec3(
    dot(vec3(l, m, s), vec3(0.2104542553, 0.7936177850, -0.0040720468)),
    dot(vec3(l, m, s), vec3(1.9779984951, -2.4285922050, 0.4505937099)),
    dot(vec3(l, m, s), vec3(0.0259040371, 0.7827717662, -0.8086757660)));
}

vec3 oklab2lin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  vec3 lms = vec3(l * l * l, m * m * m, s * s * s);
  return vec3(
    dot(lms, vec3(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(lms, vec3(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(lms, vec3(-0.0041960863, -0.7034186147, 1.7076147010)));
}

// Hue-preserving tonemap on the max channel: linear up to the knee, then an extended Reinhard
// shoulder that reaches 1.0 at the white point. Per-channel curves would shift hues and bleach
// saturated neon toward white by accident; whitening is an explicit, spatially limited control.
#define TM_KNEE 0.6
vec3 tonemapMax(vec3 c, float wp) {
  float m = max3(c);
  if (m <= TM_KNEE) return c;
  float x = (m - TM_KNEE) * (1.0 / (1.0 - TM_KNEE));
  float w = max((wp - TM_KNEE) * (1.0 / (1.0 - TM_KNEE)), 0.05);
  float y = x * (1.0 + x / (w * w)) / (1.0 + x);
  return c * ((TM_KNEE + (1.0 - TM_KNEE) * min(y, 1.0)) / m);
}

// ---- mediump variants for the per-pixel color math (GLSL ES cannot overload on precision, and a
// helper without qualifiers takes and returns highp, which promotes the whole expression back to
// FP32). Everything here is a color or a fraction: the ranges fit FP16 with room to spare.
mediump float satM(mediump float x) { return clamp(x, 0.0, 1.0); }
mediump vec3 sat3M(mediump vec3 x) { return clamp(x, 0.0, 1.0); }
mediump vec3 sq3M(mediump vec3 x) { return x * x; }
mediump float max3M(mediump vec3 c) { return max(c.r, max(c.g, c.b)); }
mediump float lumaM(mediump vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
mediump vec3 saturateColorM(mediump vec3 c, mediump float s) {
  return max(vec3(0.0), mix(vec3(lumaM(c)), c, s));
}
mediump vec3 lin2srgbM(mediump vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
mediump vec3 tonemapMaxM(mediump vec3 c, mediump float wp) {
  mediump float m = max3M(c);
  if (m <= TM_KNEE) return c;
  mediump float x = (m - TM_KNEE) * (1.0 / (1.0 - TM_KNEE));
  mediump float w = max((wp - TM_KNEE) * (1.0 / (1.0 - TM_KNEE)), 0.05);
  mediump float y = x * (1.0 + x / (w * w)) / (1.0 + x);
  return c * ((TM_KNEE + (1.0 - TM_KNEE) * min(y, 1.0)) / m);
}

// Triangular-PDF dither of +-1 LSB (8-bit) from one hash: kills banding in the deep navy.
float ditherTPDF(vec2 fragCoord) {
  uint h = hash2(uvec2(ivec2(fragCoord)));
  float a = float(h & 0xffffu) * (1.0 / 65535.0);
  float b = float(h >> 16u) * (1.0 / 65535.0);
  return (a + b - 1.0) * (1.0 / 255.0);
}

// Rounded box SDF: half extents b, corner radius r (inside the box). Negative inside.
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// ---- Cell-space texture sampling. pos is in texel units (centers at i + 0.5), lim is the valid
// (logical) size inside a larger bucketed allocation, inv = 1 / allocation size. Every tap is
// clamped to the valid rect so stale headroom texels never bleed in.
vec4 texBilinear(sampler2D t, vec2 pos, vec2 lim, vec2 inv) {
  return texture(t, clamp(pos, vec2(0.5), lim - 0.5) * inv);
}

// Cubic B-spline in 4 bilinear taps: C2-smooth, so cell-resolution glow shows no diamonds or
// Mach bands when stretched over tens of pixels. Positions stay highp; the weights and the result
// are mediump (they are colors and fractions).
mediump vec4 texBicubic(sampler2D t, vec2 pos, vec2 lim, vec2 inv) {
  vec2 st = pos - 0.5;
  vec2 i = floor(st);
  mediump vec2 f = st - i;
  mediump vec2 f2 = f * f;
  mediump vec2 f3 = f2 * f;
  mediump vec2 w0 = (1.0 / 6.0) * (-f3 + 3.0 * f2 - 3.0 * f + 1.0);
  mediump vec2 w1 = (1.0 / 6.0) * (3.0 * f3 - 6.0 * f2 + 4.0);
  mediump vec2 w2 = (1.0 / 6.0) * (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0);
  mediump vec2 w3 = (1.0 / 6.0) * f3;
  mediump vec2 g0 = w0 + w1;
  mediump vec2 g1 = w2 + w3;
  vec2 lo = vec2(0.5);
  vec2 hi = lim - 0.5;
  vec2 h0 = clamp(i - 0.5 + w1 / g0, lo, hi) * inv;
  vec2 h1 = clamp(i + 1.5 + w3 / g1, lo, hi) * inv;
  return g0.y * (g0.x * texture(t, h0) + g1.x * texture(t, vec2(h1.x, h0.y)))
       + g1.y * (g0.x * texture(t, vec2(h0.x, h1.y)) + g1.x * texture(t, h1));
}

// Decoded (linear) cell-space sampling: texture filtering is only valid on linear data, so on the
// RGBA8 path (sqrt-encoded texels) every texel is fetched and decoded first and the filter runs
// in the shader. Same results as the hardware versions on float targets.
#if HDR_RT
vec4 texBilinearDec(sampler2D t, vec2 pos, vec2 lim, vec2 inv) {
  return texBilinear(t, pos, lim, inv);
}
vec4 texBicubicDec(sampler2D t, vec2 pos, vec2 lim, vec2 inv) {
  return texBicubic(t, pos, lim, inv);
}
#else
vec4 texBilinearDec(sampler2D t, vec2 pos, vec2 lim, vec2 inv) {
  vec2 st = clamp(pos, vec2(0.5), lim - 0.5) - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  ivec2 a = ivec2(i);
  ivec2 b = min(a + 1, ivec2(lim) - 1);
  vec4 t00 = dec4(texelFetch(t, a, 0));
  vec4 t10 = dec4(texelFetch(t, ivec2(b.x, a.y), 0));
  vec4 t01 = dec4(texelFetch(t, ivec2(a.x, b.y), 0));
  vec4 t11 = dec4(texelFetch(t, b, 0));
  return mix(mix(t00, t10, f.x), mix(t01, t11, f.x), f.y);
}
// Cubic B-spline over the 4x4 neighbourhood (16 fetches; the fallback path only).
vec4 texBicubicDec(sampler2D t, vec2 pos, vec2 lim, vec2 inv) {
  vec2 st = pos - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w[4];
  w[0] = (1.0 / 6.0) * (-f3 + 3.0 * f2 - 3.0 * f + 1.0);
  w[1] = (1.0 / 6.0) * (3.0 * f3 - 6.0 * f2 + 4.0);
  w[2] = (1.0 / 6.0) * (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0);
  w[3] = (1.0 / 6.0) * f3;
  ivec2 base = ivec2(i) - 1;
  ivec2 hi = ivec2(lim) - 1;
  vec4 acc = vec4(0.0);
  for (int y = 0; y < 4; y++) {
    vec4 row = vec4(0.0);
    for (int x = 0; x < 4; x++) {
      row += w[x].x * dec4(texelFetch(t, clamp(base + ivec2(x, y), ivec2(0), hi), 0));
    }
    acc += w[y].y * row;
  }
  return acc;
}
#endif
`,D=`#version 300 es
precision highp float;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;var xi=0,V=1,q=2,W=3,ve=4,Rt=5,L=6,Ve=7,qe=8,_i=9,vi=10,We=0,Xe=1;function Do(o,e){return`#version 300 es
precision highp float;
precision highp int;
precision mediump sampler2D;
#define HDR_RT ${o?1:0}
${e}
${Ro}
${Ji}
${Bo}
`}var M=class{constructor(e,t,i,r,n){this.ctx=e;this.setup=n;this.pending=Io(e.gl,t,i,r,e.caps.parallelCompile)}ctx;setup;pending;program=null;poll(){if(this.program)return!0;if(!this.pending)return!1;let e=this.pending.poll();return e?(this.pending=null,this.program=e,Oo(this.ctx.gl,e.handle),e.bindBlock("ParamsBlock",We),e.bindBlock("FrameBlock",Xe),this.setup(e),!0):!1}get(){if(!this.program)throw new Error("[lumicells] program used before link");return this.program}use(){let e=this.get();return Oo(this.ctx.gl,e.handle),e}dispose(){this.pending?.dispose(),this.pending=null,this.program?.dispose(),this.program=null}};function Oo(o,e){o.useProgram(e)}function w(o,e,t,i){let r=e.uniform(t);r&&o.uniform1i(r,i)}function v(o,e,t){o.activeTexture(o.TEXTURE0+e),o.bindTexture(o.TEXTURE_2D,t)}var Hn=[[],[36064],[36064,36065],[36064,36065,36066]];function N(o,e=1){o.caps.tiled&&o.gl.invalidateFramebuffer(o.gl.FRAMEBUFFER,Hn[e])}var Ke=9,Ye=2*(Ke-1),zo=`
// Calibrates bloom.strength = 1 to "the glow of a lit cluster matches its cells" on the default look.
#define BLOOM_GAIN 3.0
float fillFactor() {
  float r = sat(P_grid_roundness);
  return sq(1.0 - P_grid_gap) * (1.0 - 0.43 * r * r);
}
vec3 bloomSource(vec3 e) {
  float m = max3(e);
  float th = P_glow_bloom_threshold;
  float knee = th * P_glow_bloom_knee + 1e-4;
  float s = clamp(m - th + knee, 0.0, 2.0 * knee);
  s = s * s / (4.0 * knee);
  float w = max(s, m - th) / max(m, 1e-4);
  return e * (w * fillFactor() * BLOOM_GAIN);
}
`;function $n(o){return`${o}
uniform sampler2D u_src;   // bloom source (thresholded, fill-scaled emission)
uniform vec4 u_cellTex;
out vec4 o_color;
// Quarter texel j is centered on cell coordinate 4j + 2; an 8-wide tent (1,2,3,4,4,3,2,1)
// around it is alias-free and exact (texelFetch, no filtering of encoded values).
void main() {
  ivec2 base = ivec2(gl_FragCoord.xy) * 4 - 2;
  ivec2 lim = ivec2(u_cellTex.xy) - 1;
  vec3 acc = vec3(0.0);
  for (int y = 0; y < 8; y++) {
    float wy = 4.5 - abs(float(y) - 3.5);
    for (int x = 0; x < 8; x++) {
      float wx = 4.5 - abs(float(x) - 3.5);
      acc += dec4(texelFetch(u_src, clamp(base + ivec2(x, y), ivec2(0), lim), 0)).rgb * (wx * wy);
    }
  }
  o_color = enc4(vec4(acc * (1.0 / 400.0), 1.0));
}
`}function Vn(o,e,t=!1){return`${o}
#define BLUR_DIR ${e==="x"?"vec2(1.0, 0.0)":"vec2(0.0, 1.0)"}
#define BLUR_STEP ${e==="x"?"ivec2(1, 0)":"ivec2(0, 1)"}
#define COMBINE ${t?1:0}
uniform sampler2D u_src;
uniform vec4 u_tex;              // xy logical size, zw 1 / allocation
#if HDR_RT
uniform vec2 u_taps[${Ke}]; // (offset texels, weight); [0] is the center
uniform int u_count;
#else
uniform float u_w[${Ye+1}]; // per-texel weights, [0] is the center
uniform int u_radius;
#endif
#if COMBINE
uniform sampler2D u_haze;
uniform vec4 u_hazeTex;          // same for the quarter-res haze
uniform vec3 u_mix;              // x bloom on, y haze on, z vignette on (debug views isolate one)
#endif
out vec4 o_color;
void main() {
#if HDR_RT
  vec2 pos = gl_FragCoord.xy;
  vec3 acc = texBilinear(u_src, pos, u_tex.xy, u_tex.zw).rgb * u_taps[0].y;
  for (int i = 1; i < ${Ke}; i++) {
    if (i >= u_count) break;
    vec2 o = BLUR_DIR * u_taps[i].x;
    acc += (texBilinear(u_src, pos + o, u_tex.xy, u_tex.zw).rgb
          + texBilinear(u_src, pos - o, u_tex.xy, u_tex.zw).rgb) * u_taps[i].y;
  }
#else
  // Decode before filtering: every texel is fetched exactly (clamped to the logical rect).
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 lim = ivec2(u_tex.xy) - 1;
  vec3 acc = dec4(texelFetch(u_src, c, 0)).rgb * u_w[0];
  for (int i = 1; i <= ${Ye}; i++) {
    if (i > u_radius) break;
    ivec2 o = BLUR_STEP * i;
    acc += (dec4(texelFetch(u_src, clamp(c + o, ivec2(0), lim), 0)).rgb
          + dec4(texelFetch(u_src, clamp(c - o, ivec2(0), lim), 0)).rgb) * u_w[i];
  }
#endif
#if COMBINE
  // The composite used to B-spline sample bloom (at the pixel) and haze (at pixel / 4) and add
  // them. Haze is wide enough that sampling it at the cell center and letting the composite's
  // single B-spline lookup carry it the rest of the way is indistinguishable; so is the vignette
  // taken per cell (it varies over the whole host).
  vec3 haze = texBicubicDec(u_haze, gl_FragCoord.xy * 0.25, u_hazeTex.xy, u_hazeTex.zw).rgb;
  vec2 cpx = f_origin.xy + gl_FragCoord.xy * f_grid.z;
  vec2 nuv = (cpx - f_space.xy) / max(0.5 * f_host.zw, vec2(1.0));
  float vig = 1.0 - P_background_vignette * smoothstep(0.5, 1.45, length(nuv));
  // Each layer is saturated on its own, as before (the saturation clamps at 0, so clamping the
  // sum instead would let a layer's negative channel eat into the other).
  float gs = P_glow_saturation;
  acc = saturateColor(acc, gs) * (P_glow_bloom_strength * u_mix.x)
      + saturateColor(haze, gs) * (P_glow_haze_strength * u_mix.y * mix(1.0, vig, u_mix.z));
  acc *= 1.0 / GLOW_SCALE;
#endif
  o_color = enc4(vec4(acc, 1.0));
}
`}function Uo(o){return Math.min(Ye,Math.max(1,Math.ceil(Math.max(.05,o)*3)))}function qn(o,e){let t=Math.max(.05,o),i=Uo(o),r=1/(2*t*t),n=1;for(let s=1;s<=i;s++)n+=2*Math.exp(-s*s*r);for(let s=0;s<=Ye;s++)e[s]=s<=i?Math.exp(-s*s*r)/n:0;return i}function Wn(o,e){let t=Math.max(.05,o),i=Uo(o),r=1/(2*t*t),n=1;for(let a=1;a<=i;a++)n+=2*Math.exp(-a*a*r);e[0]=0,e[1]=1/n;let s=1;for(let a=1;a<=i;a+=2){let l=Math.exp(-a*a*r)/n,c=a+1<=i?Math.exp(-(a+1)*(a+1)*r)/n:0,u=l+c;e[s*2]=u>0?(a*l+(a+1)*c)/u:a,e[s*2+1]=u,s++}for(let a=s;a<Ke;a++)e[a*2]=0,e[a*2+1]=0;return s}function Xn(o){return o===3?[1,0,0]:o===4?[0,1,0]:[1,1,1]}var Nt=class{constructor(e){this.ctx=e;let t=e.gl;this.downsample=new M(e,D,$n(e.header),"haze-downsample",r=>w(t,r,"u_src",L));let i=(r,n,s=!1)=>new M(e,D,Vn(e.header,r,s),n,a=>{w(t,a,"u_src",L),s&&w(t,a,"u_haze",Rt)});this.blurs=[i("x","bloom-x"),i("y","bloom-y-combine",!0),i("x","haze-x"),i("y","haze-y")]}ctx;downsample;blurs;taps=new Float32Array(Ke*2);weights=new Float32Array(Ye+1);bloomSigma=-1;hazeSigma=-1;mixView=-1;poll(){let e=this.downsample.poll();for(let t of this.blurs)e=t.poll()&&e;return e}invalidate(){this.bloomSigma=-1,this.hazeSigma=-1,this.mixView=-1}uploadKernel(e,t){let i=this.ctx.gl,r=this.ctx.caps.hdr,n=r?Wn(t,this.taps):qn(t,this.weights);for(let s=e;s<e+2;s++){let a=this.blurs[s]?.use();a&&(r?(i.uniform2fv(a.uniform("u_taps"),this.taps),i.uniform1i(a.uniform("u_count"),n)):(i.uniform1fv(a.uniform("u_w"),this.weights),i.uniform1i(a.uniform("u_radius"),n)))}}setSigmas(e,t){e!==this.bloomSigma&&(this.bloomSigma=e,this.uploadKernel(0,e)),t!==this.hazeSigma&&(this.hazeSigma=t,this.uploadKernel(2,t/4))}setSizes(e,t,i,r,n,s,a,l){let c=this.ctx.gl,u=this.downsample.use();c.uniform4f(u.uniform("u_cellTex"),e,t,1/i,1/r);for(let d=0;d<4;d++){let f=this.blurs[d]?.use();f&&(d<2?c.uniform4f(f.uniform("u_tex"),e,t,1/i,1/r):c.uniform4f(f.uniform("u_tex"),n,s,1/a,1/l),d===1&&c.uniform4f(f.uniform("u_hazeTex"),n,s,1/a,1/l))}}run(e,t,i,r,n,s,a,l,c,u){let d=this.ctx.gl;v(d,L,n.tex),this.downsample.use(),d.bindFramebuffer(d.FRAMEBUFFER,a.fb),N(this.ctx),d.viewport(0,0,i,r),d.drawArrays(d.TRIANGLES,0,3),this.blurs[2]?.use(),v(d,L,a.tex),d.bindFramebuffer(d.FRAMEBUFFER,l.fb),N(this.ctx),d.drawArrays(d.TRIANGLES,0,3),this.blurs[3]?.use(),v(d,L,l.tex),d.bindFramebuffer(d.FRAMEBUFFER,a.fb),N(this.ctx),d.drawArrays(d.TRIANGLES,0,3),d.viewport(0,0,e,t),this.blurs[0]?.use(),v(d,L,n.tex),d.bindFramebuffer(d.FRAMEBUFFER,s.fb),N(this.ctx),d.drawArrays(d.TRIANGLES,0,3);let f=this.blurs[1]?.use();if(f&&this.mixView!==u){this.mixView=u;let h=Xn(u);d.uniform3f(f.uniform("u_mix"),h[0],h[1],h[2])}v(d,L,s.tex),d.bindFramebuffer(d.FRAMEBUFFER,c.fb),N(this.ctx),d.drawArrays(d.TRIANGLES,0,3),v(d,L,null)}dispose(){this.downsample.dispose();for(let e of this.blurs)e.dispose()}};function Bt(o,e=""){return`
mediump vec3 spot(mediump vec2 bp, mediump vec2 pos, mediump vec3 color, mediump float radius,
                  mediump float strength) {
  mediump vec2 d = bp - pos;
  mediump float r = max(radius, 1e-3);
  return color * (strength * exp2(-2.885 * dot(d, d) / (r * r)));
}


${e}
mediump vec3 compositeBackground(vec2 px, float inHost, bool useProfile) {
  // Background in host-centered mode units; the vignette touches background and haze only (the
  // glow's haze share carries it already).
  mediump vec2 bp = (px - f_space.xy) * f_space.z;
  mediump vec2 nuv = (px - f_space.xy) / max(0.5 * f_host.zw, vec2(1.0));
  mediump float vigAmount = P_background_vignette;
  mediump float vig = 1.0 - vigAmount * smoothstep(0.5, 1.45, length(nuv));
  mediump vec3 bg = P_background_color;
${o?`  if (u_brand.x > 0.5) {
    float brand=smoothstep(u_brand.y,u_brand.z,px.x/f_host.z)*u_brand.w;
    // The stage underlay stays dark; colored light comes from cells and their glow.
    mediump vec3 vkBg=vec3(0.0003,0.0015,0.0137);
    mediump vec3 maxBg=vec3(0.004,0.0,0.0103);
    bg=mix(vkBg,maxBg,brand);
  }`:`  bg += spot(bp, P_background_spotA_position, P_background_spotA_color, P_background_spotA_radius, P_background_spotA_strength)
      + spot(bp, P_background_spotB_position, P_background_spotB_color, P_background_spotB_radius, P_background_spotB_strength);`}

  return ${e?"useProfile ? profileUnderlay(px-f_host.xy,f_host.zw,bg*(inHost*vig)) : bg*(inHost*vig)":"bg*(inHost*vig)"};
}
`}var Ot=`
mediump vec3 sampleCompositeGlow(sampler2D source,vec2 gp,vec4 cellTex,bool cubic,bool enabled) {
  mediump vec3 glow=vec3(0.0);
  if(enabled) {
    if(cubic) glow=texBicubicDec(source,gp,cellTex.xy,cellTex.zw).rgb;
    else glow=texBilinearDec(source,gp,cellTex.xy,cellTex.zw).rgb;
    glow*=GLOW_SCALE;
    vec2 ge=min(gp,cellTex.xy-gp);
    glow*=smoothstep(0.0,2.0,min(ge.x,ge.y));
  }
  return glow;
}
`;var Le=`
uniform sampler2D u_morphAtlas;
uniform vec4 u_morphInfo,u_morphRect;
uniform vec2 u_morphOffset;
float tdMorphAt(vec2 center){
 if(u_morphInfo.z<.5)return 0.;
 ivec2 globalCell=ivec2(floor(vec2(center.x-f_host.x,f_host.w-center.y+f_host.y)/max(u_morphInfo.w,.001)));
 globalCell=clamp(globalCell,ivec2(0),ivec2(u_morphInfo.xy)-1);
 ivec2 local=clamp(globalCell-ivec2(u_morphOffset),ivec2(0),ivec2(u_morphRect.zw)-1);
 return clamp(texelFetch(u_morphAtlas,ivec2(u_morphRect.xy)+local,0).g,0.,1.);
}
`;function Fe(o,e){w(o.gl,e,"u_morphAtlas",12)}function Me(o,e,t){let i=o.gl,r=t?.externalMask;i.uniform4fv(e.uniform("u_morphInfo"),r?.morph?[...r.size,1,r.pitch]:[1,1,0,1]),i.uniform4fv(e.uniform("u_morphRect"),r?.physicalRect??[0,0,1,1]),i.uniform2fv(e.uniform("u_morphOffset"),r?.offset??[0,0]),v(i,12,r?.texture??null)}function Kn(o,e,t,i,r="",n=""){return`${o}
uniform sampler2D u_fieldA;
uniform sampler2D u_fieldB;
uniform sampler2D u_glow;
uniform sampler2D u_lut;
uniform sampler2D u_stampA;
uniform sampler2D u_stampB;
${Le}
${e?"uniform sampler2D u_maskSource;":""}
uniform vec4 u_cellTex;  // xy logical cell texture size, zw 1 / allocation
uniform vec4 u_view;     // xy drawing buffer px, z quality (0 high, 1 medium, 2 low), w debug view
uniform vec4 u_output; // top-left origin and tile size in full-domain pixels
uniform float u_outputLinear; // host atlas receives linear RGB; canvas receives original sRGB
${e?"uniform vec4 u_brand; // same global rear-wall transition as field pass":""}
${e?`uniform vec4 u_fill; // mode, opacity, gap contribution, inverse contribution
uniform vec2 u_fillEdge;
uniform vec3 u_fillVk,u_fillMax;
uniform sampler2D u_lookupVk,u_lookupMax;`:""}
uniform vec2 u_flags;    // x opaque output, y glow on (the glow passes ran this frame)
out vec4 o_color;
${Ot}

${Bt(e,n)}
${e?`float fillVisibleAt(vec2 p) {
  vec2 s=clamp(p-0.5,vec2(0.0),u_cellTex.xy-1.0);
  ivec2 a=ivec2(floor(s)),b=min(a+ivec2(1),ivec2(u_cellTex.xy)-1);
  vec2 f=fract(s);
  float x0=mix(texelFetch(u_fieldB,a,0).a,texelFetch(u_fieldB,ivec2(b.x,a.y),0).a,f.x);
  float x1=mix(texelFetch(u_fieldB,ivec2(a.x,b.y),0).a,texelFetch(u_fieldB,b,0).a,f.x);
  return sat(2.0*mix(x0,x1,f.y));
}`:""}

${r}
void main() {
  vec2 px = u_output.xy + vec2(gl_FragCoord.x, u_output.w - gl_FragCoord.y);
  float pitch = f_grid.z;
  vec2 gp = (px - f_origin.xy) / pitch;
  ivec2 lim = ivec2(u_cellTex.xy) - 1;
  ivec2 c = clamp(ivec2(floor(gp)), ivec2(0), lim);
  vec2 hp = px - f_host.xy;
  mediump float inHost = sat(min(hp.x, f_host.z - hp.x) + 0.5) * sat(min(hp.y, f_host.w - hp.y) + 0.5);
  int dbg = int(u_view.w + 0.5);
${e?`  if (dbg == 5) {
    // Raw grayscale mask from the same FieldPass as the final image.
    float raw=dec4(texelFetch(u_maskSource,c,0)).a;
    o_color=vec4(vec3(raw*inHost),1.0);
    return;
  }`:""}
  bool cubic = u_view.z < 0.5;
  bool lowQ = u_view.z > 1.5;

  mediump vec3 background = compositeBackground(px,inHost,dbg==0);

  // Combined bloom + haze (saturated and weighted per cell by the bloom pass). Decoded sampling:
  // hardware filtering on float targets, decode-then-filter on RGBA8.
  mediump vec3 glow = sampleCompositeGlow(u_glow,gp,u_cellTex,cubic,u_flags.y>0.5);

  mediump vec3 cellC = vec3(0.0);
  mediump vec3 halo = vec3(0.0);
  mediump vec4 f0 = vec4(0.0);
  mediump float cellCoverage = 0.0;
  if (inHost > 0.0 || dbg == 1) {
    f0 = dec4(texelFetch(u_fieldA, c, 0));
${e&&t?`    if (dbg == 1 || pitch < ${i.toFixed(1)} || (texelFetch(u_fieldB,c,0).b < 0.001 && texelFetch(u_fieldB,c,0).a > 0.999)) {`:""}
    mediump vec4 b0 = texelFetch(u_fieldB, c, 0);
    float morph=tdMorphAt(f_origin.xy+(vec2(c)+.5)*pitch);
    // The pixel's offset inside its cell: pitch and origin are whole pixels, so this indexes the
    // baked cell stamp exactly. Its quadrant picks the neighbours the halo stamp was baked for.
    int ip = int(pitch + 0.5);
    ivec2 m = clamp(ivec2(floor(px - f_origin.xy)) - c * ip, ivec2(0), ivec2(ip - 1));
    ivec2 q = ivec2(2 * m.x + 1 < ip ? -1 : 1, 2 * m.y + 1 < ip ? -1 : 1);
    mediump vec4 fx = vec4(0.0);
    mediump vec4 fy = vec4(0.0);
    mediump vec4 fd = vec4(0.0);
    mediump float lit = f0.a;
    if (!lowQ) {
      fx = dec4(texelFetch(u_fieldA, clamp(c + ivec2(q.x, 0), ivec2(0), lim), 0));
      fy = dec4(texelFetch(u_fieldA, clamp(c + ivec2(0, q.y), ivec2(0), lim), 0));
      fd = dec4(texelFetch(u_fieldA, clamp(c + q, ivec2(0), lim), 0));
      lit = max(max(f0.a, fx.a), max(fy.a, fd.a));
    }
    if (lit > 0.002 || b0.b > 0.002) {
      mediump vec4 sa = texelFetch(u_stampA, m, 0);
#ifdef KDW_RADIAL_CELLS
      // The KDW profile encodes the circular ramp in field alpha. Scale each
      // square about its fixed cell centre; a dark cell has no residual stamp.
      float ramp=clamp(f0.a/1.3,0.0,1.0);
      float sizeFactor=pow(ramp,.65);
      vec2 local=px-f_origin.xy-(vec2(c)+.5)*pitch;
      float hb=(1.-P_grid_gap)*.5*pitch*sizeFactor;
      float distance=sdRoundBox(local,vec2(hb),P_grid_roundness*hb);
      float aw=.65;
      float body=(1.-smoothstep(-aw,aw,distance))*smoothstep(0.0,.025,ramp);
      sa=vec4(body,0.0,.5,1.0);
#else
      if(morph>0.){
        vec2 local=px-f_origin.xy-(vec2(c)+.5)*pitch;
        float hb=(1.-P_grid_gap)*.5*pitch;
        float radius=mix(sat(P_grid_roundness),1.,morph)*hb;
        float distance=sdRoundBox(local,vec2(hb),radius);
        float aw=P_grid_softness+.5;
        float body=1.-smoothstep(-aw,aw,distance);
        float dc=length(local)/max(hb,.0001);
        sa.r=body*(1.-P_grid_emitter*min(dc*dc,1.));
        sa.g*=1.-morph;sa.b=mix(sa.b,.5,morph);
      }
#endif
      cellCoverage = sa.r;
      mediump float hk = b0.g * sa.g;
      mediump vec3 cc = f0.rgb;
      if (hk > 0.002) {
        float lutX = b0.r;
        mediump vec3 hotC = ${e?"u_brand.x > 0.5 ? f0.rgb : texture(u_lut, vec2(lutX * (255.0 / 256.0) + 0.5 / 256.0, 0.75)).rgb":"texture(u_lut, vec2(lutX * (255.0 / 256.0) + 0.5 / 256.0, 0.75)).rgb"};
        // Keep the tint near the base's brightness: whitening a dark navy cell must not paint a
        // grey dot. The mix runs in a gamma-2 space: linear mixing of a little near-white into
        // saturated neon already reads pastel after the sRGB encode.
        hotC *= min(1.0, 1.6 * max3M(f0.rgb) / max(max3M(hotC), 1e-4));
        cc = sq3M(mix(sqrt(f0.rgb), sqrt(hotC), hk));
      }
      cc = cc * (f0.a * (1.0 + 0.5 * hk)) + f0.rgb * b0.b;
      mediump float bevel = P_grid_bevel;
      if (bevel > 0.0 && !lowQ) cc *= max(0.0, 1.0 + 4.0 * bevel * (2.0 * sa.b - 1.0));
      cellC = cc * sa.r;
#ifndef KDW_RADIAL_CELLS
      if (!lowQ && lit > 0.002) {
        mediump vec4 sb = texelFetch(u_stampB, m, 0);
        mediump float haloStrength = P_glow_halo_strength;
        halo = (f0.rgb * (f0.a * sb.x) + fx.rgb * (fx.a * sb.y) + fy.rgb * (fy.a * sb.z)
             + fd.rgb * (fd.a * sb.w)) * haloStrength;
      }
#endif
    }
${e?`    if (u_fill.x > 0.5 && cellCoverage <= 0.0)
      cellCoverage = texelFetch(u_stampA, m, 0).r;`:""}
${e&&t?"    }":""}
  }

  mediump float gs = P_glow_saturation;
  halo = saturateColorM(halo, gs);

  mediump vec3 col;
  if (dbg == 0) col = background + glow + (cellC + halo) * inHost;
  else if (dbg == 1) col = f0.rgb * f0.a;
  else if (dbg == 2) col = halo * inHost;
  else if (dbg == 3 || dbg == 4) col = glow;  // the bloom pass isolated that layer
  else col = background + cellC * inHost;

${e?`  if (dbg == 0 && u_fill.x > 0.5 && inHost > 0.0) {
    float visible=sat(2.0*texelFetch(u_fieldB,c,0).a);
    // The fourth preset uses one continuous signal for both alpha and LUT position.
    if (u_fill.x > 2.5) visible=fillVisibleAt(gp);
    float opacity=0.0;
    if (u_fill.x < 1.5 || u_fill.x > 2.5) {
      opacity=u_fill.y*(1.0-visible);
    } else {
      float spread=3.0;
      float broad=0.25*(fillVisibleAt(gp+vec2(-spread,-spread))+
        fillVisibleAt(gp+vec2(spread,-spread))+
        fillVisibleAt(gp+vec2(-spread,spread))+
        fillVisibleAt(gp+vec2(spread,spread)));
      float envelope=smoothstep(u_fillEdge.x,u_fillEdge.y,max(broad,0.35*visible));
      opacity=u_fill.y*envelope*(u_fill.z*(1.0-cellCoverage)+u_fill.w*(1.0-smoothstep(0.15,0.9,visible)));
    }
    float brand=u_brand.x>0.5 ? smoothstep(u_brand.y,u_brand.z,px.x/f_host.z)*u_brand.w : 0.0;
    vec3 fillColor=mix(u_fillVk,u_fillMax,brand);
    if (u_fill.x > 2.5) {
      vec3 vkColor=texture(u_lookupVk,vec2(visible,0.5)).rgb;
      vec3 maxColor=texture(u_lookupMax,vec2(visible,0.5)).rgb;
      vec3 rgb=mix(vkColor,maxColor,brand);
      fillColor=mix(rgb/12.92,pow((rgb+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),rgb));
    }
    col=mix(col,fillColor,sat(opacity)*inHost);
  }`:""}

  mediump float exposure = P_glow_exposure;
  mediump float whitePoint = P_glow_whitePoint;
  mediump vec3 tm = tonemapMaxM(col * exposure, whitePoint);
  mediump vec3 srgb = sat3M(lin2srgbM(tm) + ditherTPDF(vec2(px.x, u_view.y-px.y)));
${r?"  srgb=profileComposite(px-f_host.xy,f_host.zw,lin2srgbM(tonemapMaxM((cellC+halo+glow)*exposure,whitePoint)));":""}
  mediump float a = 1.0;
#ifdef PROFILE_ALPHA
  a = profileAlpha(px-f_host.xy,f_host.zw);
#endif
  if (u_flags.x < 0.5 && inHost < 1.0) {
    // Glow-only margin: keep valid premultiplied alpha (rgb <= a) for every compositor.
    a = max(inHost, max3M(srgb));
    srgb = min(srgb, vec3(a));
  }
  mediump vec3 host = mix(srgb/12.92, pow((srgb+0.055)/1.055,vec3(2.4)), step(vec3(0.04045),srgb));
  o_color = vec4(u_outputLinear>0.5 ? host : srgb, a);
}
`}var Dt=class{constructor(e,t=!1,i=!1,r=16,n="",s=""){this.ctx=e;this.cubeMask=t;this.cubeGeometry=i;let a=e.gl;this.prog=new M(e,D,Kn(e.header,t,i,r,n,s),"composite",l=>{w(a,l,"u_fieldA",q),w(a,l,"u_fieldB",W),w(a,l,"u_glow",ve),w(a,l,"u_lut",V),w(a,l,"u_stampA",Ve),w(a,l,"u_stampB",qe),Fe(e,l),t&&w(a,l,"u_maskSource",L),t&&(w(a,l,"u_lookupVk",_i),w(a,l,"u_lookupMax",vi))})}ctx;cubeMask;cubeGeometry;prog;last=new Float32Array(12).fill(Number.NaN);poll(){return this.prog.poll()}run(e,t,i,r,n,s,a,l,c,u,d=null){let f=this.ctx.gl,h=this.prog.use();Me(this.ctx,h,d?.interaction);let m=this.last;(m[0]!==i||m[1]!==r||m[2]!==n||m[3]!==s)&&(m[0]=i,m[1]=r,m[2]=n,m[3]=s,f.uniform4f(h.uniform("u_cellTex"),i,r,1/n,1/s)),(m[4]!==e||m[5]!==t||m[6]!==a||m[7]!==l)&&(m[4]=e,m[5]=t,m[6]=a,m[7]=l,f.uniform4f(h.uniform("u_view"),e,t,a,l));let b=c?1:0,g=u?1:0;if((m[8]!==b||m[9]!==g)&&(m[8]=b,m[9]=g,f.uniform2f(h.uniform("u_flags"),b,g)),f.uniform4f(h.uniform("u_output"),d?.x??0,d?.y??0,d?.width??e,d?.height??t),f.uniform1f(h.uniform("u_outputLinear"),d?.linear?1:0),this.cubeMask&&f.uniform4fv(h.uniform("u_brand"),d?.interaction?.brand??[0,0,1,0]),this.cubeMask){let x=d?.interaction?.fill;f.uniform4fv(h.uniform("u_fill"),x?.controls??[0,0,0,0]),f.uniform2fv(h.uniform("u_fillEdge"),x?.edge??[0,1]),f.uniform3fv(h.uniform("u_fillVk"),x?.vk??[0,0,0]),f.uniform3fv(h.uniform("u_fillMax"),x?.max??[0,0,0]),v(f,_i,x?.lookupVk??null),v(f,vi,x?.lookupMax??null)}f.bindFramebuffer(f.FRAMEBUFFER,d?.framebuffer??null),f.viewport(0,0,d?.width??e,d?.height??t),d?.blendProfile&&(f.enable(f.BLEND),f.blendEquation(f.FUNC_ADD),f.blendFuncSeparate(f.SRC_ALPHA,f.ONE_MINUS_SRC_ALPHA,f.ONE,f.ONE_MINUS_SRC_ALPHA)),f.drawArrays(f.TRIANGLES,0,3),d?.blendProfile&&f.disable(f.BLEND)}dispose(){this.prog.dispose()}};function Yn(){let o=[0,0,-1,0,0],e=[];for(let[i,r]of[[1,1],[-1,1],[-1,-1],[1,-1]]){let n=Math.atan2(r,i)-Math.PI/4;for(let s=0;s<4;s++){let a=n+s*Math.PI/6;e.push([i,r,Math.cos(a),Math.sin(a)])}}for(let i=0;i<3;i++)for(let r of e)o.push(...r,i);let t=[];for(let i of[1,0])for(let r=0;r<16;r++){let n=(r+1)%16,s=1+16*i+r,a=1+16*i+n;t.push(s,s+16,a,a,s+16,a+16)}for(let i=0;i<16;i++)t.push(0,1+i,1+(i+1)%16);return{vertices:new Float32Array(o),indices:new Uint16Array(t)}}function jn(o,e,t){return`${o}
layout(location=0) in vec2 a_sign;
layout(location=1) in vec2 a_arc;
layout(location=2) in float a_ring;
uniform sampler2D u_fieldA, u_fieldB;
${Le}
uniform ivec4 u_cells; // base xy, count x, logical texture width
uniform ivec2 u_limit;
uniform vec4 u_output; // output xywh in the shared canvas
${e?"uniform vec4 u_cubeArt[21];":""}
out vec3 v_color;
out vec3 v_normal;
out float v_alpha;
out vec2 v_local;
out float v_morph;
void main() {
  int col = gl_InstanceID % u_cells.z;
  int row = gl_InstanceID / u_cells.z;
  ivec2 cell = u_cells.xy + ivec2(col, row);
  if (any(lessThan(cell, ivec2(0))) || any(greaterThanEqual(cell, u_limit))) {
    gl_Position = vec4(2.0,2.0,2.0,1.0); v_alpha=0.0; v_color=vec3(0.0); v_normal=vec3(0.0,0.0,1.0); return;
  }
  vec4 A = dec4(texelFetch(u_fieldA,cell,0));
  vec4 B = texelFetch(u_fieldB,cell,0);
  float energy = ${e?"(B.b<0.001 && B.a>0.999)?0.0:clamp(B.r,0.0,1.0)":"smoothstep(0.06,1.25,A.a)"};
  // Damped spring impulse around each passing Pulse band; its phase comes from the shared
  // clock and global cell position, so left/right crops never accumulate different state.
  vec2 center = f_origin.xy + (vec2(cell)+0.5)*f_grid.z;
  float morph=tdMorphAt(center);v_morph=morph;
  vec2 modePos = (center-f_space.xy)*f_space.z;
  float radial = length(modePos-P_modes_pulse_origin);
  float phase = ${e?"length((center-f_host.xy)/max(f_host.zw,vec2(1.0))-vec2(0.5))/u_cubeArt[4].w-f_clock.x*u_cubeArt[4].z":"radial*max(P_modes_pulse_frequency,0.01)-f_phaseA.w"};
  float age = 1.0-fract(phase+0.5);
  float spring = ${t?"0.0":`exp(-${e?"u_cubeArt[16].y":"5.2"}*age)*sin(${e?"u_cubeArt[16].z":"14.0"}*age)`};
  float lift = max(0.0,energy*(${e?"u_cubeArt[15].w+u_cubeArt[16].x":"0.38+0.10"}*spring));
  float pitch = f_grid.z;
  float base = 1.0-P_grid_gap;
  // Preserve the full grayscale range in visible tile sizes. The previous
  // 1.34 gain hit the 1.14 cap well before white and fused bright regions.
  // Exact black stays zero; only the brightest tiles overlap a grid step.
  float size = pitch*${e?"clamp(u_cubeArt[15].x*energy*B.b+u_cubeArt[15].y*max(spring,0.0)*energy,0.0,u_cubeArt[15].z)":"max(0.02,base+energy*(1.045-base)+0.035*spring*energy)"};
  float radius = mix(clamp(P_grid_roundness,0.02,0.48)*0.5,.5,morph);
  vec2 p = a_ring<0.0 ? vec2(0.0) : a_sign*(0.5-radius)+a_arc*radius;
  // Circumscribe the analytic circle so its AA edge is inside the existing mesh.
  p*=mix(1.,1.05,morph);
  v_local=p;
  if (a_ring<0.5) p*=mix(.86,1.,morph); // flatten shoulder into the white disc
  float z = a_ring<0.5 ? 0.0 : a_ring<1.5 ? -0.055 : -0.38;
  z*=1.-morph;
  vec3 pos = vec3(p*size,z*size+lift*pitch);
  // Shallow oblique camera: actual Z changes projected position and exposes the rounded sides.
  pos = vec3(pos.x+0.16*pos.z,pos.y-0.24*pos.z,pos.z);
  float perspective = 1.0+0.12*pos.z/max(pitch,1.0);
  vec2 screen = center+pos.xy*perspective;
  vec2 ndc = vec2((screen.x-u_output.x)/u_output.z*2.0-1.0,
                  1.0-(screen.y-u_output.y)/u_output.w*2.0);
  gl_Position = vec4(ndc,0.0,1.0);
  vec3 n = a_ring<0.5 ? vec3(0.0,0.0,1.0) :
           a_ring<1.5 ? normalize(vec3(a_arc*0.55,0.83)) : normalize(vec3(a_arc,0.08));
  v_normal = normalize(vec3(n.x+0.16*n.z,n.y-0.24*n.z,n.z));
  v_color = ${e?"A.rgb*(1.0+0.35*B.g)":"A.rgb * (A.a*(1.0+0.5*B.g)+B.b)"};
  v_alpha = ${e?"smoothstep(0.0,0.025,energy)":"smoothstep(0.015,0.08,A.a+B.b)"};
}`}function Qn(o,e,t){return`${o}
in vec3 v_color;
in vec3 v_normal;
in float v_alpha;
in vec2 v_local;
in float v_morph;
uniform float u_linear;
uniform sampler2D u_glow;
uniform vec4 u_output,u_cellTex;
${e?"uniform vec4 u_brand;":""}
uniform vec2 u_glowFlags; // enabled, high-quality filter
out vec4 o_color;
${Ot}
${Bt(e,t)}
void main() {
  if(v_alpha<0.002) discard;
  vec3 N=normalize(v_normal);
  vec3 L=normalize(vec3(-0.38,-0.56,0.73));
  float diffuse=max(dot(N,L),0.0);
  float edge=1.0-smoothstep(0.62,0.95,N.z);
  // /CUBES/pbr1 uses roughness 1, specular level 0 and metallic .942.
  // A broad, color-tinted response keeps the form matte; no white pin glint.
  float broad=pow(max(dot(reflect(-L,N),vec3(0.0,0.0,1.0)),0.0),3.0);
  float grain=fract(sin(dot(floor(v_local*180.0),vec2(127.1,311.7)))*43758.5453)-0.5;
  float body=1.0+0.018*grain+0.025*sin(v_local.x*19.0+v_local.y*9.0);
  vec3 lit=v_color*(0.64+0.34*diffuse)*(1.0-0.13*edge+0.025*broad)*body;
  vec2 px=u_output.xy+vec2(gl_FragCoord.x,u_output.w-gl_FragCoord.y);
  vec2 gp=(px-f_origin.xy)/f_grid.z;
  vec3 glow=sampleCompositeGlow(u_glow,gp,u_cellTex,u_glowFlags.y>0.5,u_glowFlags.x>0.5);
  vec2 hp=px-f_host.xy;
  float inHost=sat(min(hp.x,f_host.z-hp.x)+.5)*sat(min(hp.y,f_host.w-hp.y)+.5);
  vec3 background=compositeBackground(px,inHost,true);
  vec3 display=clamp(lin2srgb(tonemapMax((background+lit+glow)*P_glow_exposure,P_glow_whitePoint)),0.0,1.0);
  display=mix(display,vec3(1.),v_morph);
  float distance=length(v_local),aa=max(fwidth(distance),.0001);
  float coverage=mix(1.,1.-smoothstep(.5-aa,.5+aa,distance),v_morph);
  if(coverage<.001)discard;
  vec3 linear=mix(display/12.92,pow((display+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),display));
  o_color=vec4(u_linear>0.5?linear:display,coverage);
}`}var zt=class{constructor(e,t=!1,i=!1,r=16,n=""){this.ctx=e;this.minPitch=r;this.cubeMask=t;let s=e.gl;this.prog=new M(e,jn(e.header,t,i),Qn(e.header,t,n),"cubes",d=>{w(s,d,"u_fieldA",q),w(s,d,"u_fieldB",W),w(s,d,"u_glow",ve),Fe(e,d)});let a=s.createVertexArray(),l=s.createBuffer(),c=s.createBuffer();if(!a||!l||!c)throw Error("[lumicells] cannot create cubes buffers");this.vao=a,this.vertex=l,this.index=c;let u=Yn();this.count=u.indices.length,s.bindVertexArray(a),s.bindBuffer(s.ARRAY_BUFFER,l),s.bufferData(s.ARRAY_BUFFER,u.vertices,s.STATIC_DRAW),s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,c),s.bufferData(s.ELEMENT_ARRAY_BUFFER,u.indices,s.STATIC_DRAW),s.enableVertexAttribArray(0),s.vertexAttribPointer(0,2,s.FLOAT,!1,20,0),s.enableVertexAttribArray(1),s.vertexAttribPointer(1,2,s.FLOAT,!1,20,8),s.enableVertexAttribArray(2),s.vertexAttribPointer(2,1,s.FLOAT,!1,20,16),s.bindVertexArray(null)}ctx;minPitch;prog;cubeMask;vao;vertex;index;count;poll(){return this.prog.poll()}run(e,t,i,r,n,s,a){let l=this.ctx.gl,c=e.pitchPx;if(c<this.minPitch)return 0;let u=r?.x??0,d=r?.y??0,f=r?.width??e.canvasWidth,h=r?.height??e.canvasHeight,m=e.frame[16]??0,b=e.frame[17]??0,g=Math.max(0,Math.floor((u-m)/c)-1),x=Math.max(0,Math.floor((d-b)/c)-1),P=Math.min(t-g,Math.ceil((u+f-m)/c)-g+1),_=Math.min(i-x,Math.ceil((d+h-b)/c)-x+1);if(P<=0||_<=0)return 0;let y=this.prog.use();if(Me(this.ctx,y,r?.interaction),l.uniform4i(y.uniform("u_cells"),g,x,P,t),l.uniform2i(y.uniform("u_limit"),t,i),l.uniform4f(y.uniform("u_output"),u,d,f,h),l.uniform1f(y.uniform("u_linear"),r?.linear?1:0),l.uniform4f(y.uniform("u_cellTex"),t,i,1/n,1/s),l.uniform2f(y.uniform("u_glowFlags"),a?1:0,e.quality==="high"?1:0),this.cubeMask){l.uniform4fv(y.uniform("u_brand"),r?.interaction?.brand??[0,0,1,0]);let E=r?.interaction?.cubeArt;if(!(E instanceof Float32Array)||E.length!==84)throw Error("[lumicells] missing CUBES art parameters");l.uniform4fv(y.uniform("u_cubeArt[0]"),E.subarray(0,68))}return l.bindFramebuffer(l.FRAMEBUFFER,r?.framebuffer??null),l.viewport(0,0,f,h),l.bindVertexArray(this.vao),l.disable(l.CULL_FACE),l.disable(l.DEPTH_TEST),l.disable(l.BLEND),r?.interaction?.externalMask?.morph&&(l.enable(l.BLEND),l.blendEquation(l.FUNC_ADD),l.blendFuncSeparate(l.SRC_ALPHA,l.ONE_MINUS_SRC_ALPHA,l.ONE,l.ONE_MINUS_SRC_ALPHA)),l.drawElementsInstanced(l.TRIANGLES,this.count,l.UNSIGNED_SHORT,0,P*_),l.disable(l.BLEND),l.bindVertexArray(null),P*_}dispose(){let e=this.ctx.gl;this.prog.dispose(),e.deleteVertexArray(this.vao),e.deleteBuffer(this.vertex),e.deleteBuffer(this.index)}};var Go=`
uniform int u_discoveryCount;
uniform vec4 u_discoveryRects[32];
uniform float u_discoveryAlpha[32];
uniform float u_discoveryFeather;
float discoveryCutout(vec2 px,vec2 size,float pitch){
 float result=0.;
 for(int i=0;i<32;i++){
  if(i>=u_discoveryCount)break;
  if(u_discoveryAlpha[i]<=0.)continue;
  vec4 rect=u_discoveryRects[i]*vec4(size,size);
  float radius=${.28}*rect.w;
  vec2 q=abs(px-rect.xy-.5*rect.zw)-.5*rect.zw+radius;
  float distance=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  float coverage=1.-smoothstep(0.,max(u_discoveryFeather*pitch,.0001),distance);
  result=max(result,coverage*u_discoveryAlpha[i]);
 }
 return clamp(result,0.,1.);
}
`;var Ut=`
// Coverage 0..1 of influence i for a cell centered at px: 1 inside, smooth falloff outside,
// widened by half a cell so small shapes still register on at least one cell.
float influenceK(int i, vec2 px, float pitch) {
  vec4 a = f_inf[i * 3];
  vec4 b = f_inf[i * 3 + 1];
  vec2 hs = max(a.zw, vec2(b.x));
  float r = min(b.x, min(hs.x, hs.y));
  float d = sdRoundBox(px - a.xy, hs, r);
  float fo = max(b.y, 0.5 * pitch);
  return 1.0 - smoothstep(-0.5 * pitch, fo, d);
}
`;var Ho=`
vec3 mode_flow(ModeIn m) {
  float a = P_modes_flow_direction;
  vec2 d = vec2(cos(a), sin(a));
  float sc = max(P_modes_flow_scale, 0.01);
  vec2 q = vec2(dot(m.p, d), dot(m.p, vec2(-d.y, d.x))) * sc;
  float ph = f_phaseA.x;
  float fw = sc * m.cs;
  // Octave 0 carries the structure: it fades only once the noise itself gets finer than a cell
  // (e.g. a large scale at low zoom), instead of turning into shimmering salt-and-pepper.
  float n = 0.5 * noiseBand(fw) * gnoise3(vec3(q.x - ph, q.y, ph * 0.25));
  vec2 q1 = NOISE_ROT * q * 2.0 + vec2(19.0, 7.0);
  n += 0.25 * bandLimit(2.0 * fw) * gnoise3(vec3(q1.x - ph * 1.5, q1.y, ph * 0.5));
  vec2 q2 = NOISE_ROT * q1 * 2.0 + vec2(-11.0, 23.0);
  n += 0.125 * bandLimit(4.0 * fw) * gnoise3(vec3(q2.x - ph * 2.25, q2.y, ph * 0.75));
  float v = 0.42 + 1.3 * n;
  // Widen the threshold edge to the cell footprint so contours do not crawl cell to cell.
  float soft = sqrt(sq(P_modes_flow_softness) + sq(0.35 * fw));
  float thr = P_modes_flow_threshold;
  float I = smoothstep(thr - 0.5 * soft, thr + 0.5 * soft, v);
  // The envelope is the lit mask itself: a faint flow layer must not keep the outskirts dense.
  return vec3(I * (0.65 + 0.5 * sat(v)), I, 0.0);
}
`;var yi=`
float lifeLevel(vec4 L, float frac) {
  float F = max(P_modes_life_fadeSteps, 1.0);
  bool alive = L.r > 0.5;
  float Fx = alive ? clamp(0.4 * F, 1.0, 2.0) : F;
  float t = sat((L.g * 255.0 + frac) / Fx);
  t = t * t * (3.0 - 2.0 * t);
  // Old cells cool down a little so long-lived still lifes do not dominate.
  float target = alive ? 1.0 - 0.25 * smoothstep(8.0, 60.0, L.b * 255.0) : 0.0;
  return mix(L.a, target, t);
}
`,$o=`
${yi}
vec3 mode_life(ModeIn m) {
  vec4 L = texelFetch(u_life, m.cell, 0);
  return vec3(lifeLevel(L, f_clock.y), 0.8, 0.0);
}
`;var Vo=`
vec3 mode_pulse(ModeIn m) {
  float r = length(m.p - P_modes_pulse_origin);
  float f = max(P_modes_pulse_frequency, 0.01);
  float x = r * f - f_phaseA.w;
  float dd = (fract(x + 0.5) - 0.5) / f;
  float w = sqrt(sq(0.5 * P_modes_pulse_width) + sq(0.5 * m.cs));
  float band = exp(-dd * dd / (2.0 * w * w));
  float mean = min(1.0, w * 2.5066 * f);
  band = mix(mean, band, bandLimit(f * m.cs));
  float fall = 0.25 + 0.95 * exp(-r * P_modes_pulse_falloff);
  // Breathes once every 4 rings; 0.25 * 1024 keeps the phase wrap seamless.
  float br = 1.0 - P_modes_pulse_breathe * (0.5 - 0.5 * cos(f_phaseA.w * TAU * 0.25));
  return vec3(band * fall * br, fall * br, 0.0);
}
`;var qo=`
vec3 mode_rain(ModeIn m) {
  float a = P_modes_rain_angle;
  vec2 across = vec2(cos(a), sin(a));
  vec2 down = vec2(-sin(a), cos(a));
  float cs = max(m.cs, 1e-4);
  float col = floor(dot(m.p, across) / cs + 0.5);
  float along = dot(m.p, down) / cs;
  uint hc = pcg(uint(int(col) + 65536) * 3u + 17u);
  float spd = 0.5 + 0.25 * floor(u01(hc) * 5.0);
  float tailCells = max(P_modes_rain_tail / cs, 1.0);
  // Segment length in mode units, snapped to travel / n (travel = distance per phase period).
  // n is in the hundreds at usual cell sizes; the snap changes a length by at most 1 / (2n).
  float travel = 1024.0 * spd;
  float n = max(1.0, floor(travel / (tailCells * cs * (1.4 + 1.6 * u01(pcg(hc + 1u)))) + 0.5));
  float segLen = travel / (n * cs);
  // phase * spd / (cs * segLen) == phase * n / 1024: a 1024 wrap shifts u by exactly n.
  float u = along / segLen - f_phaseB.z * (n * (1.0 / 1024.0)) + u01(pcg(hc + 2u));
  float k = floor(u);
  // Segment key periodic in k with period n; equal to k itself for |k| < n / 2.
  float k0 = floor(0.5 * n);
  float kw = k + k0;
  kw -= n * floor((kw + 0.5) / n);
  uint key = uint(int(kw - k0) + 65536);
  float x = (u - k) * segLen - (segLen - tailCells);
  float isOn = step(u01(hash3(uvec3(uint(int(col) + 65536), key, 0x7a1u))), P_modes_rain_density);
  float tail = sat(x / tailCells);
  // The head's leading edge spans 1.5 cells: a fast column then brightens a cell over a few
  // frames instead of switching it on in one.
  float head = 1.0 - smoothstep(segLen - 1.5, segLen, (u - k) * segLen);
  // The tail end ramps in over one cell (a hard step there would pop cells off as it passes).
  float I = isOn * head * sat(x) * (0.2 + 0.8 * pow(tail, 1.4) + 0.3 * smoothstep(0.85, 1.0, tail));
  return vec3(I, 0.3 + 0.7 * sat(P_modes_rain_density * 2.0), 0.0);
}
`;var Wo=`
vec3 mode_ripple(ModeIn m) {
  float life = max(P_modes_ripple_life, 0.1);
  float slots = min(P_modes_ripple_rate * life, 16.0);
  if (slots <= 0.0) return vec3(0.0);
  vec2 ext = 0.5 * f_host.zw * f_space.z;
  float zoom = max(P_scene_zoom, 0.05);
  float w = sqrt(sq(0.5 * P_modes_ripple_width) + sq(0.5 * m.cs));
  float acc = 0.0;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    if (fi >= slots) break;
    uint e;
    float age = epochAt(f_epochB.zw, fi / slots, e);
    uint hh = hash3(uvec3(uint(i), e, 0x51f1u));
    // The last slot is only partially occupied so the drop rate is continuous in rate * life.
    if (fi + 1.0 > slots && u01(hh) > slots - fi) continue;
    vec2 c = (vec2(u01(pcg(hh)), u01(pcg(hh + 1u))) * 2.0 - 1.0) * ext * 0.9;
    c = (c - P_scene_center) / zoom;
    float radius = P_modes_ripple_speed * age * life;
    float dist = length(m.p - c);
    float band = exp(-sq(dist - radius) / (2.0 * w * w));
    // The impact is a brief small splash; the drop reads through its ring, not a filled disc.
    float amp = pow(1.0 - age, 1.5) * smoothstep(0.0, 0.06, age) * (0.45 + 0.55 * smoothstep(0.0, 2.0 * w, radius));
    acc += band * amp;
  }
  float I = 1.0 - exp(-2.5 * acc);
  return vec3(I, 0.5 + 0.5 * I, 0.0);
}
`;var Xo=`
vec3 mode_sphere(ModeIn m) {
  float R0 = max(P_modes_sphere_radius, 0.02);
  // The shell may sit off-center around the hole (thicker on the side it is shifted to); the
  // hole itself always stays on the composition center.
  vec2 sp = m.p - P_modes_sphere_shift;
  float rr = length(sp);
  vec2 dir = rr > 1e-5 ? sp / rr : vec2(1.0, 0.0);
  // Irregular outline: noise on the unit circle (no atan seam), evolving with the clock.
  float wob = gnoise3(vec3(dir * 1.3 + vec2(3.1, 7.7), f_clock.x * 0.125));
  float br = 1.0 + P_modes_sphere_breathe * sin(f_phaseA.z);
  float scale = br * (1.0 + P_modes_sphere_wobble * wob * 1.6);
  float R = R0 * scale;
  float r = rr / R;
  float bl = 0.7 * m.cs;

  // The hole wobbles far less than the outline: it frames the title and must stay round.
  float holeR = P_modes_sphere_hole * br * (1.0 + P_modes_sphere_wobble * wob * 0.5);
  float hs = sqrt(sq(P_modes_sphere_holeSoftness) + sq(bl));
  // hole = 0 is a solid ball (no dark dot or rim left in the middle).
  bool solid = P_modes_sphere_hole < 1e-3;
  float holeMask = solid ? 1.0 : smoothstep(holeR - 0.25 * bl, holeR + hs, m.r);

  float rc = min(r, 1.0);
  vec3 n = vec3(dir * rc, sqrt(max(1.0 - rc * rc, 0.0)));
  float la = P_modes_sphere_lightAngle;
  vec3 L = normalize(vec3(cos(la), sin(la), 0.9));
  float ndl = dot(n, L);
  // Soft wrap light on the body; most of the light shows as a narrow highlight that pushes a few
  // cells over the hot threshold on the lit inner edge.
  float ls = P_modes_sphere_lightStrength;
  // Up to ls = 0.5 a gentle wrap (the hollow reference ring); above it the shadow side deepens
  // toward a real terminator, so a solid orb reads as a lit planet.
  float shadeK = 0.3 * ls + 2.4 * sq(max(ls - 0.5, 0.0));
  float key = 1.0 - shadeK * (0.5 - 0.5 * ndl);
  float spec = ls * 0.35 * pow(max(ndl, 0.0), 24.0);

  float shellIn = 0.74 + 0.18 * pow(rc, max(P_modes_sphere_rimPower, 0.05));
  float ro = max(r - 1.0, 0.0);
  float of = max(P_modes_sphere_outerFalloff, 0.02);
  float dens = exp(-sq(ro / of));
  float bri = r < 1.0 ? shellIn : 0.92 * exp(-ro / (2.0 * of));

  float fa = P_modes_sphere_fadeAngle;
  float fd = dot(sp, vec2(cos(fa), sin(fa))) / R;
  float fade = 1.0 - P_modes_sphere_fadeAmount * smoothstep(0.9, 1.35, fd);

  float surf = P_modes_sphere_surface;
  float ns = 0.5;
  float patchN = 0.0;
  if (surf > 0.001 || holeMask > 0.0) {
    float tl = P_modes_sphere_tilt;
    float th = f_phaseA.y;
    vec3 sn = n;
    sn = vec3(sn.x, sn.y * cos(tl) - sn.z * sin(tl), sn.y * sin(tl) + sn.z * cos(tl));
    sn = vec3(sn.x * cos(th) + sn.z * sin(th), sn.y, -sn.x * sin(th) + sn.z * cos(th));
    float ss = P_modes_sphere_surfaceScale;
    float fw = ss * m.cs / R;
    // Every noise fades to its mean once it gets finer than a cell (noiseBand), so large
    // surface scales or a small orb do not alias into crawling per-cell speckle.
    float nIn = 0.7 * noiseBand(fw) * gnoise3(sn * ss + 11.0)
              + 0.3 * bandLimit(2.1 * fw) * gnoise3(sn * ss * 2.1 + vec3(5.0, 1.0, 9.0));
    float nOut = noiseBand(ss * m.cs) * gnoise3(vec3(sp * ss + 3.0, f_clock.x * 0.125));
    ns = sat(0.5 + 1.1 * mix(nIn, nOut, smoothstep(0.9, 1.15, r)));
    patchN = noiseBand(3.4 * m.cs / R) * gnoise3(sn * 3.4 + vec3(29.0, 3.0, 17.0));
  }
  float tex = mix(1.0, 0.35 + 1.3 * ns, surf);
  // Density follows the texture outside the rim too: the outskirts thin out in patches.
  float env = holeMask * fade * dens * mix(1.0, tex, smoothstep(0.95, 1.3, r));
  // A lit inner rim just outside the hole: the brightest cells frame the hole with a crisp edge.
  float rimIn = solid ? 0.0 : exp(-sq((m.r - holeR - hs) / (0.6 * hs + bl)));
  // The fade thins the density out much more than it dims the survivors (sparse, still crisp).
  float I = holeMask * bri * key * mix(1.0, fade, 0.25) * (tex + spec * (0.5 + ns)) * (1.0 + 0.2 * rimIn);

  float band = 1.0 - smoothstep(holeR + hs, holeR + hs + 0.6 * R, m.r);
  float accent = holeMask * band * smoothstep(-0.2, 0.2, patchN);
  return vec3(I, env, accent);
}
`;var Ko=`
vec3 mode_vortex(ModeIn m) {
  float r = m.r;
  float a = atan(m.p.y, m.p.x);
  float arms = max(1.0, floor(P_modes_vortex_arms + 0.5));
  float twist = P_modes_vortex_twist;
  float s = arms * (a - f_phaseB.y + twist * r);
  float v = 0.5 + 0.5 * cos(s);
  // Local spatial frequency (cycles per mode unit) of the arms at this radius.
  float freq = arms * sqrt(1.0 / max(r * r, 1e-4) + twist * twist) / TAU;
  v = mix(0.5, v, bandLimit(freq * m.cs));
  v = pow(v, 1.0 + 5.0 * P_modes_vortex_sharpness);
  float fall = exp(-r * P_modes_vortex_falloff) * smoothstep(0.0, 0.12, r);
  return vec3(v * fall * 1.2, fall, 0.0);
}
`;var Yo=`
vec3 mode_wave(ModeIn m) {
  float a = P_modes_wave_angle;
  float f = max(P_modes_wave_frequency, 0.01);
  float ph = f_phaseB.x;
  float k = P_modes_wave_interference;
  vec2 d1 = vec2(cos(a), sin(a));
  float w1 = 0.5 + 0.5 * sin(TAU * (dot(m.p, d1) * f - ph));
  w1 = mix(0.5, w1, bandLimit(f * m.cs));
  float v = w1;
  if (k > 0.001) {
    // Low-frequency domain warp (a quarter of the wave frequency): bends the crests.
    vec2 q = m.p;
    float wf = 0.35 * f;
    q += (0.12 / f) * vec2(sin(TAU * (m.p.y * wf + ph * 0.125)), sin(TAU * (m.p.x * wf - ph * 0.125)));
    vec2 d2 = vec2(cos(a + 1.1), sin(a + 1.1));
    float s1 = sin(TAU * (dot(q, d1) * f - ph)) * bandLimit(f * m.cs);
    float s2 = sin(TAU * (dot(q, d2) * f * 0.8 - ph * 0.75)) * bandLimit(0.8 * f * m.cs);
    vec2 c = 0.55 * vec2(sin(TAU * ph * 0.125), cos(TAU * ph * 0.1875));
    float s3 = sin(TAU * (length(q - c) * f * 0.7 - ph * 0.5)) * bandLimit(0.7 * f * m.cs);
    // Classic plasma: a sine of the summed waves draws wandering iso-lines (ridges that bend,
    // split and merge). The fold raises the local frequency ~1.5x, so it is band-limited too.
    float sum = s1 + s2 + s3;
    float fold = bandLimit(1.5 * f * m.cs);
    float plasma = 0.5 + 0.5 * mix(sum / 3.0, sin(1.6 * sum - TAU * ph * 0.25), fold);
    v = mix(w1, plasma, k);
  }
  v = pow(sat(v), 1.0 + 3.0 * P_modes_wave_sharpness);
  return vec3(v, 0.35 + 0.65 * v, 0.0);
}
`;var jo=["flow","sphere","pulse","wave","ripple","vortex","life","rain"],Jn={flow:Ho,sphere:Xo,pulse:Vo,wave:Yo,ripple:Wo,vortex:Ko,life:$o,rain:qo},Qo=`
struct ModeIn {
  vec2 p;
  float r;
  float cs;
  ivec2 cell;
  float h;
};
`,Jo=jo.map(o=>Jn[o]).join(`
`),Zo=jo.map(o=>`  if (P_modes_${o}_weight > 0.001) addMode(x, P_modes_${o}_weight, mode_${o}(m));`).join(`
`);var er=`
#define NOISE_WRAP 255
// Per-octave domain rotation (36.87 deg) hides lattice alignment between octaves.
const mat2 NOISE_ROT = mat2(0.8, 0.6, -0.6, 0.8);

float grad3(uint h, vec3 p) {
  uint k = h & 15u;
  float u = k < 8u ? p.x : p.y;
  float v = k < 4u ? p.y : ((k == 12u || k == 14u) ? p.x : p.z);
  return ((k & 1u) == 0u ? u : -u) + ((k & 2u) == 0u ? v : -v);
}

// Roughly [-1, 1], zero at lattice points.
float gnoise3(vec3 p) {
  vec3 fl = floor(p);
  vec3 f = p - fl;
  ivec3 a = ivec3(fl) & NOISE_WRAP;
  ivec3 b = (a + 1) & NOISE_WRAP;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = grad3(hash3(uvec3(a.x, a.y, a.z)), f);
  float n100 = grad3(hash3(uvec3(b.x, a.y, a.z)), f - vec3(1.0, 0.0, 0.0));
  float n010 = grad3(hash3(uvec3(a.x, b.y, a.z)), f - vec3(0.0, 1.0, 0.0));
  float n110 = grad3(hash3(uvec3(b.x, b.y, a.z)), f - vec3(1.0, 1.0, 0.0));
  float n001 = grad3(hash3(uvec3(a.x, a.y, b.z)), f - vec3(0.0, 0.0, 1.0));
  float n101 = grad3(hash3(uvec3(b.x, a.y, b.z)), f - vec3(1.0, 0.0, 1.0));
  float n011 = grad3(hash3(uvec3(a.x, b.y, b.z)), f - vec3(0.0, 1.0, 1.0));
  float n111 = grad3(hash3(uvec3(b.x, b.y, b.z)), f - vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z);
}

vec2 grad2v(uint h) {
  return vec2(float(h & 0xffffu), float(h >> 16u)) * (2.0 / 65535.0) - 1.0;
}

float gnoise2(vec2 p) {
  vec2 fl = floor(p);
  vec2 f = p - fl;
  ivec2 a = ivec2(fl) & NOISE_WRAP;
  ivec2 b = (a + 1) & NOISE_WRAP;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n00 = dot(grad2v(hash2(uvec2(a.x, a.y))), f);
  float n10 = dot(grad2v(hash2(uvec2(b.x, a.y))), f - vec2(1.0, 0.0));
  float n01 = dot(grad2v(hash2(uvec2(a.x, b.y))), f - vec2(0.0, 1.0));
  float n11 = dot(grad2v(hash2(uvec2(b.x, b.y))), f - vec2(1.0, 1.0));
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

// Band limit for gradient noise sampled once per cell; fw = its footprint in lattice units per
// cell. The noise spectrum peaks near 0.5 cycles per lattice unit, so the octave fades to its
// mean (0) as that peak approaches the cell Nyquist limit (fw 0.5..0.9) instead of aliasing
// into per-cell speckle.
float noiseBand(float fw) { return bandLimit(0.5 * fw); }

// fbm with domain rotation per octave. z (time) doubles per octave, which keeps periodicity.
// fw = footprint of octave 0 (lattice units per cell): finer octaves fade out by noiseBand().
float fbm3(vec3 p, int octaves, float fw) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    sum += amp * noiseBand(fw) * gnoise3(p);
    norm += amp;
    p.xy = NOISE_ROT * p.xy * 2.0 + vec2(17.0, 31.0);
    p.z *= 2.0;
    amp *= 0.5;
    fw *= 2.0;
  }
  return sum / norm;
}
`;var tr=`
// 21 vec4 rows from cubes-art.json, packed by cubes-art.js. The same values
// feed the field and geometry passes across all output crops.
uniform vec4 u_cubeArt[21];
float cubesEase(float x) { x=clamp(x,0.0,1.0); return x*x*(3.0-2.0*x); }
float cubesRamp(float x) {
  x=fract(x);
  vec3 k=u_cubeArt[12].xyz;
  if(x<k.x) return 1.0-cubesEase(x/k.x);
  if(x<k.y) return 0.0;
  if(x<k.z) return cubesEase((x-k.y)/(k.z-k.y));
  return 1.0;
}
vec3 cubesPalette(float x) {
  x=fract(x);
  const vec3 red=vec3(0.961,0.0,0.0);
  const vec3 dark=vec3(0.048800007,0.122,0.11346001);
  const vec3 blue=vec3(0.2997,0.5098049,0.9);
  if(x<0.055837564) return mix(blue,red,cubesEase((x+1.0-0.92903405)/(1.0+0.055837564-0.92903405)));
  if(x<0.3680203) return mix(red,dark,cubesEase((x-0.055837564)/(0.3680203-0.055837564)));
  if(x<0.92903405) return mix(dark,blue,cubesEase((x-0.3680203)/(0.92903405-0.3680203)));
  return mix(blue,red,cubesEase((x-0.92903405)/(1.0+0.055837564-0.92903405)));
}
// Linear-light values of the local brand tokens. VK Video: vkv-color-blue,
// vkv-color-neon-blue. MAX: max.project.palette.20260927.
// Color is sampled from its own field; the grayscale geometry mask never
// addresses this lookup. Red VK Video accents stay in the foreground content.
vec3 cubesVkColor(float t) {
  return mix(vec3(0.0,0.0513,1.0),vec3(0.0,0.1845,1.0),cubesEase(t));
}
vec3 cubesMaxColor(float t) {
  vec3 blue=vec3(0.063,0.0103,1.0);   // #471AFF
  vec3 violet=vec3(0.156,0.0103,1.0); // #6E1AFF
  vec3 purple=vec3(0.301,0.0,1.0);    // #9500FF
  vec3 cyan=vec3(0.0,0.521,1.0);      // #00BFFF
  if(t<0.38) return mix(blue,violet,cubesEase(t/0.38));
  if(t<0.76) return mix(violet,purple,cubesEase((t-0.38)/0.38));
  return mix(purple,cyan,0.36*cubesEase((t-0.76)/0.24));
}
float cubesNoise(vec3 p) { return 0.5+0.5*gnoise3(p); }
vec2 cubesMaskPartsAt(vec2 uv,float seconds) {
  // Noise TOP uses aspect-corrected UVs. The first noise is monochrome, so its
  // RGB channels all address the same XYZ point of the second Noise TOP.
  float aspect=f_host.z/max(f_host.w,1.0);
  vec2 coord=(uv-0.5)*vec2(aspect,1.0);
  // XY advection keeps broad islands travelling even near a 3D-noise extremum,
  // where pure Z evolution can appear stationary for several seconds.
  vec2 moving=coord+seconds*u_cubeArt[4].xy;
  float phase=seconds*u_cubeArt[4].z;
  float n3=cubesNoise(vec3(moving/u_cubeArt[0].x+u_cubeArt[0].zw,seconds*u_cubeArt[0].y+u_cubeArt[14].x));
  float n5=cubesNoise(vec3(moving/u_cubeArt[1].x+u_cubeArt[1].zw,seconds*u_cubeArt[1].y+u_cubeArt[14].y));
  // Keep the broad circular ramp, but bend its sampling coordinates with a
  // slowly moving field. The ring has a white core and a continuous gray halo.
  vec2 warp=vec2(
    gnoise3(vec3(moving/u_cubeArt[5].x+u_cubeArt[6].xy,seconds*u_cubeArt[5].y)),
    gnoise3(vec3(moving/u_cubeArt[5].x+u_cubeArt[6].zw,seconds*u_cubeArt[5].y))
  )*u_cubeArt[5].z;
  // Distance is measured in screen-height units, like the other noise fields.
  // Using normalized-width UV here made one ring cover almost the entire rear
  // wall at once and turned its white phase into a single flat slab.
  vec2 ringCoord=coord+warp;
  float ring=cubesRamp(length(ringCoord)/u_cubeArt[4].w-phase);
  float n4=cubesNoise(vec3(moving/u_cubeArt[2].x+u_cubeArt[2].zw,seconds*u_cubeArt[2].y+u_cubeArt[14].z));
  float fine=cubesNoise(vec3(moving/u_cubeArt[3].x+u_cubeArt[3].zw,seconds*u_cubeArt[3].y+u_cubeArt[14].w));
  // Keep the moving ramp out of the noise-only signal. The field pass caps
  // this signal before adding a crest, so a static noise island cannot be white.
  float noiseSignal=u_cubeArt[7].x+u_cubeArt[7].y*(n3-0.5)+u_cubeArt[7].z*(n5-0.5)
                   +u_cubeArt[7].w*(fine-0.5)+u_cubeArt[8].x*(n4-0.5);
  return vec2(noiseSignal,ring);
}
`;function Zn(o,e,t,i,r=""){return`${o}
${er}
${e?tr:""}
uniform sampler2D u_life;
uniform sampler2D u_lut;
uniform sampler2D u_inputA,u_inputB,u_body;
uniform sampler2D u_tdMask;
uniform sampler2D u_rowStream;
uniform float u_rowStreamEnabled;
${Go}
${Le}
uniform vec4 u_tdMaskInfo; // full global lattice width/height, fresh snapshot, reserved
uniform float u_tdProceduralEnvelope;
uniform vec4 u_tdPhysicalRect,u_tdColorRect;
uniform vec2 u_tdOffset;
uniform vec4 u_inputCrop,u_bodyCrop;
uniform vec2 u_inputMap;
uniform float u_inputMix,u_bodyAlive,u_inputEnabled,u_inputLocal;
uniform vec4 u_maskPair; // parent pitch, fine flag, large zero, fine zero (raw M)
uniform vec4 u_brand; // enabled, start/end normalised, purple amount
uniform vec4 u_jointRing0; // enabled, rear-wall UV center, radius in wall-height units
uniform vec4 u_jointRing1; // band width, dark-core radius, pulse Hz, radius excursion
layout(location = 0) out vec4 o_fieldA;
layout(location = 1) out vec4 o_fieldB;
layout(location = 2) out vec4 o_bloom;
${Ut}
${zo}
${Qo}
${Jo}

struct Mix { float scr; float over; float sum; float mx; float w; float env; float accent; };

// Gate residual floor/sparkles and their emission before independent row streams enter.
void applyDiscovery(float keep) {
  if(keep>=1.)return;
  vec4 field=dec4(o_fieldA);field.a*=keep;o_fieldA=enc4(field);
  ${i?"":"o_fieldB.b*=keep;"}
  o_fieldB.a*=keep;
  vec4 bloom=dec4(o_bloom);bloom.rgb*=keep;o_bloom=enc4(bloom);
}

void applyRowStream(ivec2 cell) {
  if(u_rowStreamEnabled<0.5)return;
  vec4 line=texelFetch(u_rowStream,cell,0);
  if(line.a<=0.001)return;
  vec4 field=dec4(o_fieldA);
  field.rgb=mix(field.rgb,line.rgb/max(line.a,0.001),line.a);
  field.a=max(field.a,line.a*1.4);
  o_fieldA=enc4(field);
${t?"  o_fieldB.r=max(o_fieldB.r,line.a);":""}
${t&&i?"  o_fieldB.b=0.0; o_fieldB.a=1.0;":""}
  vec4 bloom=dec4(o_bloom);
  o_bloom=enc4(vec4(max(bloom.rgb,bloomSource(field.rgb*field.a)),bloom.a));
}

void addMode(inout Mix x, float w, vec3 v) {
  float wi = w * max(v.x, 0.0);
  x.scr *= 1.0 - min(wi, 1.0);
  x.over += max(wi - 1.0, 0.0);
  x.sum += wi;
  x.mx = max(x.mx, wi);
  x.w += w;
  x.env = 1.0 - (1.0 - x.env) * (1.0 - sat(w * v.y));
  x.accent = max(x.accent, w * v.z);
}

// Per-cell value noise in time: aperiodic, smooth, identical at any frame rate. It doubles as the
// per-cell brightness variety: calm on the dense structure, twice as wide where the envelope
// thins out (the reference's outer band mixes bright and dim cells side by side).
float flickerF(uvec2 key, float h, float env) {
  float amt = P_animation_flicker_amount * (1.0 - 0.8 * f_clock.w)
            * (1.0 + 1.2 * (1.0 - smoothstep(0.3, 0.9, env)));
  amt = min(amt, 0.9);
  if (amt <= 0.001) return 1.0;
  // Each cell runs at k / FLICKER_RATE_STEPS (0.6..1.4) of the base phase. The whole part is
  // multiplied in integers: an EPOCH_WRAP jump of the base phase moves every cell by k whole
  // multiples of the cell's index period (EPOCH_WRAP / FLICKER_RATE_STEPS), so the wrap is
  // seamless, and the fraction keeps full precision.
  float q = float(FLICKER_RATE_STEPS);
  float k = floor((0.6 + 0.8 * h) * q + 0.5);
  uint pk = uint(f_epochB.x) * uint(k);
  float tt = (float(pk % FLICKER_RATE_STEPS) + f_epochB.y * k) / q + h * 7.0;
  float e = floor(tt);
  float f = tt - e;
  uint mask = EPOCH_MASK / FLICKER_RATE_STEPS;
  uint ue = (pk / FLICKER_RATE_STEPS + uint(e)) & mask;
  uint ue1 = (ue + 1u) & mask;
  float a = u01(hash3(uvec3(key.x ^ 0x68bc21ebu, key.y, ue)));
  float b = u01(hash3(uvec3(key.x ^ 0x68bc21ebu, key.y, ue1)));
  return 1.0 - amt * (1.0 - mix(a, b, f * f * (3.0 - 2.0 * f)));
}

// Sparsity: where the envelope is low, cells drop out (re-rolled every period, crossfaded over
// 0.4 s) instead of all dimming, and survivors get brighter and more varied: sparse, crisp
// outskirts. "vary" is the survivor's brightness factor (1 where nothing is killed).
float presenceF(uvec2 key, float h, float env, out float killP, out float vary) {
  // Calibrated on the reference: ~5% / 30% / 75% of cells out where the envelope is ~0.7 /
  // 0.45 / 0.1 at the default amount.
  killP = min(1.0, 1.45 * P_animation_sparsity_amount) * pow(1.0 - smoothstep(0.08, 0.9, env), 1.5);
  // Where the envelope is ~0 (far outskirts of a wide host) the survivors thin out to nothing, so
  // the edges read as clean navy instead of a uniform sprinkle of boosted cells.
  killP = mix(killP, sat(2.0 * P_animation_sparsity_amount), 1.0 - smoothstep(0.01, 0.1, env));
  vary = 1.0;
  if (killP <= 0.001) return 1.0;
  float period = max(P_animation_sparsity_period, 0.1);
  uint ue;
  float fr = epochAt(f_epochA.xy, h, ue);
  float x = smoothstep(period - 0.4, period, fr * period);
  uint ka = hash3(uvec3(key.x ^ 0x02e5be93u, key.y, ue));
  uint kb = hash3(uvec3(key.x ^ 0x02e5be93u, key.y, (ue + 1u) & EPOCH_MASK));
  float a = smoothstep(killP - 0.04, killP + 0.04, u01(ka));
  float b = smoothstep(killP - 0.04, killP + 0.04, u01(kb));
  vary = mix(1.0, mix(0.45 + 1.1 * u01(pcg(ka)), 0.45 + 1.1 * u01(pcg(kb)), x), sat(1.6 * killP));
  return mix(a, b, x);
}

// Event sparkles only inside the lit structure: fast attack, smooth release, never pure white.
float sparkleF(uvec2 key, float h, float I) {
  float rate = P_animation_sparkle_rate;
  if (rate <= 0.0 || P_animation_sparkle_amount <= 0.0) return 0.0;
  float D = max(P_animation_sparkle_duration, 0.05);
  uint ue;
  float x = epochAt(f_epochA.zw, h, ue);
  float fire = step(u01(hash3(uvec3(key.x ^ 0x2c1b3c6du, key.y, ue))), rate * D);
  float env = x < 0.3 ? smoothstep(0.0, 0.3, x) : sq((1.0 - x) / 0.7);
  return fire * env * smoothstep(0.2, 0.45, I) * (1.0 - f_clock.w);
}

// Spatial ramp calibration: at scale 1 / offset 0 the default ring runs from red (left) through
// violet to azure (right), with the far right fading into the palette's navy end.
#define SPATIAL_T0 0.45
#define SPATIAL_K 1.2
float mapT(float mode, vec2 p, float I, float cs) {
  float sc = P_color_scale;
  if (mode < 0.5) {
    // bend > 0 curves the color boundaries into arcs around the center: the ends of a boundary
    // drift toward the palette end, so the start color stays a crescent on one side.
    vec2 d = vec2(cos(P_color_angle), sin(P_color_angle));
    float across = dot(p, vec2(-d.y, d.x));
    return SPATIAL_T0 + 0.5 * SPATIAL_K * sc * (dot(p, d) + P_color_bend * across * across);
  }
  if (mode < 1.5) return length(p) * sc * 0.75;
  if (mode < 2.5) {
    // Mirrored so a non-cyclic palette has no seam; t = 0 toward color.angle.
    float u = fract((atan(p.y, p.x) - P_color_angle) / TAU + 1.0);
    return 0.5 + (0.5 - abs(2.0 * u - 1.0)) * sc;
  }
  if (mode < 3.5) return 0.5 + (I - 0.5) * sc;
  float fq = P_color_warpScale * 0.8;
  return 0.5 + 0.9 * sc * fbm3(vec3(p * fq + 13.0, f_clock.x * 0.0625), 3, fq * cs);
}

${r}
void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  float pitch = f_grid.z;
  vec2 cpx = f_origin.xy + (vec2(cell) + 0.5) * pitch;
${r?`
  vec4 sceneCell=profileField(cpx-f_host.xy,f_host.zw);
  o_fieldA=enc4(sceneCell);
  o_fieldB=vec4(0.0,0.0,0.0,sceneCell.a*0.5);
  o_bloom=enc4(vec4(bloomSource(sceneCell.rgb*sceneCell.a),1.0));
  return;
`:""}
  float discoveryKeep=1.-discoveryCutout(cpx-f_host.xy,f_host.zw,pitch);
${e?`
  {
  // One sampled cell equals one instanced tile, as in TD fit1/fit2 -> TOP to CHOP.
  // Global host coordinates keep the 3072/4096 rear crops phase-aligned.
  vec2 maskCell=vec2(cell);
  vec2 maskPx=cpx;
  if(u_maskPair.x>0.5){
    maskCell=floor((cpx-f_host.xy)/u_maskPair.x);
    maskPx=f_host.xy+(maskCell+0.5)*u_maskPair.x;
  }
  vec2 uv=(maskPx-f_host.xy)/max(f_host.zw,vec2(1.0));
  // The broad TD mask supplies the moving shape. A stable, independent value
  // per global cell breaks equal-sized/equal-colored runs without flicker.
  float detail=gnoise3(vec3((maskCell+0.5)*u_cubeArt[11].x+u_cubeArt[11].zw,f_clock.x*u_cubeArt[11].y));
  uint tileKey=hash2(uvec2(ivec2(maskCell)+ivec2(int(u_cubeArt[20].z))));
  float tileA=u01(tileKey),tileB=u01(pcg(tileKey^0x9e3779b9u));
  // Noise alone spans black through gray, never white. Only the intersection
  // of a strong noise region and the passing ramp can produce exact-one peaks.
  vec2 maskParts=cubesMaskPartsAt(uv,f_clock.x);
  float noiseSignal=maskParts.x+u_cubeArt[8].y*detail+u_cubeArt[8].z*(tileA-0.5);
  float noiseMask=u_cubeArt[8].w*cubesEase((noiseSignal-u_cubeArt[9].x)/(u_cubeArt[9].y-u_cubeArt[9].x));
  float rampCrest=cubesEase((maskParts.y-u_cubeArt[9].z)/(u_cubeArt[9].w-u_cubeArt[9].z));
  float noiseCrest=cubesEase((noiseMask-u_cubeArt[10].x)/(u_cubeArt[10].y-u_cubeArt[10].x));
  float mask=noiseMask+(1.0-noiseMask)*rampCrest*noiseCrest;
  // The junction is a radial grayscale ramp sampled once per cell. It begins
  // dark, rises continuously to white, then blends back into the existing mask.
  // No full-resolution circular cut or material-specific overlay is involved.
  if(u_jointRing0.x>0.5){
    vec2 delta=(uv-u_jointRing0.yz)*vec2(f_host.z/max(f_host.w,1.0),1.0);
    float distanceToJoint=length(delta);
    float radius=u_jointRing0.w+u_jointRing1.w*sin(6.28318530718*u_jointRing1.z*f_clock.x);
    float rising=cubesEase((distanceToJoint-u_jointRing1.y)/max(radius-u_jointRing1.y,0.001));
    float falling=1.0-cubesEase((distanceToJoint-radius)/max(2.0*u_jointRing1.x,0.001));
    mask=mix(mask,rising*falling,falling);
  }
  float rawMask=mask;
  ivec2 tdLocal=ivec2(0);
  if(u_tdMaskInfo.z>0.5){
    vec2 cellUV=clamp((cpx-f_host.xy)/max(f_host.zw,vec2(1.0)),vec2(0.0),vec2(0.999999));
    ivec2 globalTexel=ivec2(floor(vec2(cpx.x-f_host.x,f_host.w-cpx.y+f_host.y)/max(u_tdMaskInfo.w,0.001)));
    globalTexel=clamp(globalTexel,ivec2(0),ivec2(u_tdMaskInfo.xy)-ivec2(1));
    tdLocal=clamp(globalTexel-ivec2(u_tdOffset),ivec2(0),ivec2(u_tdPhysicalRect.zw)-ivec2(1));
    rawMask=texelFetch(u_tdMask,ivec2(u_tdPhysicalRect.xy)+tdLocal,0).r;
  }
  // Optional external envelope composes with the native field instead of replacing it.
  // Default off preserves every existing physical-mask consumer.
  if(u_tdMaskInfo.z>0.5 && u_tdProceduralEnvelope>0.5) mask*=rawMask;
  float sourceMask=rawMask;
  rawMask*=discoveryKeep;
  mask*=discoveryKeep;
  if(u_maskPair.x>0.5){
    // External grayscale is direct for EACH independently authored layer.
    // The procedural fallback retains the complementary fine branch.
    mask=u_tdMaskInfo.z>0.5
      ? cubesEase((rawMask-(u_maskPair.y>0.5?u_maskPair.w:u_maskPair.z))/max(1.0-(u_maskPair.y>0.5?u_maskPair.w:u_maskPair.z),0.0001))
      : u_maskPair.y>0.5
      ? 1.0-cubesEase(rawMask/max(u_maskPair.w,0.0001))
      : cubesEase((rawMask-u_maskPair.z)/max(1.0-u_maskPair.z,0.0001));
  }
  vec3 base=cubesPalette(sourceMask); // cutout changes presence, never the source palette
  // Size follows the continuous mask, not palette R. The old red-channel
  // coupling made red islands huge and blue neighbours almost disappear.
  float activity=mask;
  // Even the brightest noise-only tile stays below a grid step after the
  // per-cell size variation; overlap is reserved for ramp/noise peaks.
  float sizeVariation=clamp(u_cubeArt[13].x+u_cubeArt[10].z*detail+u_cubeArt[10].w*(tileB-0.5),u_cubeArt[13].y,u_cubeArt[13].z);
  // Color gets independent broad and medium fields. Neighbour variation only
  // changes luminance, so it cannot invent off-brand hues or couple size to RGB.
  if(u_brand.x>0.5) {
    vec2 colorCoord=(uv-0.5)*vec2(f_host.z/max(f_host.w,1.0),1.0);
    float colorSignal=clamp(u_cubeArt[19].x
      +u_cubeArt[19].y*gnoise3(vec3(colorCoord*u_cubeArt[17].x+u_cubeArt[17].zw,f_clock.x*u_cubeArt[17].y))
      +u_cubeArt[19].z*gnoise3(vec3(colorCoord*u_cubeArt[18].x+u_cubeArt[18].zw,f_clock.x*u_cubeArt[18].y))
      +u_cubeArt[19].w*(tileB-0.5),0.0,1.0);
    // One 7168-pixel domain: the 3072-pixel service boundary is only a crop.
    float brand=smoothstep(u_brand.y,u_brand.z,cpx.x/f_host.z)*u_brand.w;
    base=mix(cubesVkColor(colorSignal),cubesMaxColor(colorSignal),brand);
    base*=u_cubeArt[20].x+u_cubeArt[20].y*tileA;
  } else {
    base*=vec3(0.91+0.18*tileB,0.94+0.12*tileA,0.92+0.16*tileB);
  }
  if(u_tdMaskInfo.z>0.5){
    vec3 rgb=texelFetch(u_tdMask,ivec2(u_tdColorRect.xy)+tdLocal,0).rgb;
    // Authored RGB is sRGB data; decode once into the lighting field.
    base=mix(rgb/12.92,pow((rgb+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),rgb));
  }
  base=mix(base,vec3(1.),tdMorphAt(cpx));
  vec2 map=u_inputCrop.xy+vec2(cpx.x/f_host.z,1.0-cpx.y/f_host.w)*u_inputCrop.zw;
  vec2 inputUV=mix(map/max(u_inputMap,vec2(1.0)),(map-u_inputCrop.xy)/max(u_inputCrop.zw,vec2(1.0)),u_inputLocal);
  float local=mix(texture(u_inputA,inputUV).g,texture(u_inputB,inputUV).g,u_inputMix)*4.0*u_inputEnabled;
  vec2 bodyUV=(map-u_bodyCrop.xy)/max(u_bodyCrop.zw,vec2(1.0));
  float inside=step(0.0,bodyUV.x)*step(bodyUV.x,1.0)*step(0.0,bodyUV.y)*step(bodyUV.y,1.0);
  vec3 body=texture(u_body,bodyUV).rgb*u_bodyAlive*inside;
  float reactive=max(0.0,local+body.g*1.5+body.b*0.25);
${t?`  // Stage 1: the existing noise/ramp mask above remains the geometry signal.
  // Stage 2: original LumiCells controls resolve per-cell radiance separately.
  // The same flicker/sparsity response now drives the CUBES geometry mask.
  uvec2 scenarioKey=uvec2(cell+ivec2(4096));
  float baseIntensity=pow(max(mask,0.0),max(P_animation_gamma,0.05));
  float I=baseIntensity*P_animation_brightness*P_animation_energy;
  float flicker=flickerF(scenarioKey,tileA,mask);
  I*=flicker;
  float killP,vary;
  float presence=presenceF(scenarioKey,tileB,mask,killP,vary);
  I*=presence*vary;
  float visibleMask=baseIntensity*flicker*presence*vary;
  float sparkle=sparkleF(scenarioKey,tileA,I);
  I+=P_animation_sparkle_amount*sparkle;
  I+=reactive*(1.0-0.5*sat(I));
  float hot=smoothstep(P_color_hot_threshold,1.0,I)*P_color_hot_amount;
  float dead=P_animation_floor*mask*presence;
  ${i?`// Stage 3 / CUBES: geometry follows the same animated visibility as the vanilla stamp.
  // Keep the production CUBES albedo independent of light controls.
  o_fieldA=enc4(vec4(base*(1.0+0.55*reactive),I));
  o_fieldB=vec4(sat(visibleMask),sat(reactive),sizeVariation,sat(visibleMask*0.5));`:`// Stage 3 / vanilla: preserve the current stamp/composite channel semantics.
  o_fieldA=enc4(vec4(base,I));
  // Local comparison shares pre-Energy visibility with CUBES in alpha.
  o_fieldB=vec4(mask,sat(hot),sat(dead),sat(visibleMask*0.5));`}
  o_bloom=enc4(vec4(bloomSource(base*I),rawMask));`:`  // Physical silhouette/pointer energy illuminates the tile and its bloom
  // without replacing the continuous size mask.
  o_fieldA=enc4(vec4(base*(1.0+0.55*reactive),activity));
  o_fieldB=vec4(mask,sat(reactive),sizeVariation,sat(mask*0.5));
  o_bloom=enc4(vec4(bloomSource(base*(0.48*activity*activity+reactive)),rawMask));`}
  applyDiscovery(discoveryKeep);
  applyRowStream(cell);
  return;
  }
`:""}
  // Hash key relative to the center cell (cols and rows are odd): neither a pad change nor
  // symmetric grid growth (cols/rows change in steps of 2 around a fixed center) re-rolls the
  // cells that stay in place.
  ivec2 ctr = ivec2(int(f_grid.w + 0.5)) + (ivec2(f_grid.xy + 0.5) - 1) / 2;
  uvec2 key = uvec2(cell - ctr + 4096);
  uint hk = hash2(key);
  float h = u01(hk);
  float h2 = u01(pcg(hk ^ 0x9e3779b9u));
  float zoom = max(P_scene_zoom, 0.05);
  vec2 p = ((cpx - f_space.xy) * f_space.z - P_scene_center) / zoom;
  float cs = f_space.w / zoom;
  int nInf = int(f_counts.x + 0.5);

  // Repel influences push the sampling position outward before any mode sees it.
  for (int i = 0; i < MAX_INFLUENCES; i++) {
    if (i >= nInf) break;
    vec4 b = f_inf[i * 3 + 1];
    if (b.w > 3.5) {
      vec2 dv = cpx - f_inf[i * 3].xy;
      float len = length(dv);
      if (len > 1e-3) p += (dv / len) * (influenceK(i, cpx, pitch) * b.z * 0.25 / zoom);
    }
  }

  ModeIn m = ModeIn(p, length(p), cs, cell, h);
  Mix x = Mix(1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
${Zo}
  float blend = P_animation_blend;
  float I = blend < 0.5 ? 1.0 - x.scr + x.over : (blend < 1.5 ? x.sum / max(1.0, x.w) : x.mx);
  float env = sat(x.env);

  I = pow(max(I, 0.0), max(P_animation_gamma, 0.05)) * P_animation_brightness * P_animation_energy;
  I *= flickerF(key, h, env);
  // Heat is judged before the sparsity boost: a lone bright survivor in the outskirts must stay
  // saturated, only the genuinely hottest cells of the structure get pastel cores.
  float Iheat = I;
  float killP;
  float vary;
  float pres = presenceF(key, h2, env, killP, vary);
  // Dropped cells linger as dim squares next to the structure (the reference's outer band mixes
  // dim and bright cells) and vanish completely far out.
  I *= vary * mix(0.25 * smoothstep(0.2, 0.7, env), 1.0 + 2.5 * killP, pres);
  // Soft gate on near-black cells: against navy even I = 0.05 reads as a dim grid, while the
  // look wants the outskirts either empty or holding a few crisp survivors.
  I *= smoothstep(0.015, 0.09, I);
  float spk = sparkleF(key, h, I);
  I += P_animation_sparkle_amount * spk;
  // Sparkles are brightness peaks with only a hint of the hot tint, never white flashes.
  float hotAdd = 0.3 * spk * min(P_animation_sparkle_amount * 2.5, 1.0);

  // Influences (device px): light adds and tints, shadow multiplies down, lift heats up.
  vec3 tint = vec3(0.0);
  float tintW = 0.0;
  float shade = 1.0;
  for (int i = 0; i < MAX_INFLUENCES; i++) {
    if (i >= nInf) break;
    vec4 b = f_inf[i * 3 + 1];
    if (b.w > 2.5) continue;
    float k = influenceK(i, cpx, pitch) * b.z;
    if (k <= 0.0) continue;
    if (b.w < 0.5) {
      // Light lifts dim cells more than bright ones and never bleaches them: a lit neighbourhood
      // stays saturated neon instead of turning pastel.
      I += k * (1.0 - 0.5 * sat(I));
      vec4 c = f_inf[i * 3 + 2];
      tint += c.rgb * (k * c.a);
      tintW += k * c.a;
    } else if (b.w < 1.5) {
      shade *= 1.0 - sat(k);
    } else {
      I += 0.3 * k;
      hotAdd += 0.6 * k;
    }
  }
  // Pulses: gaussian rings in device px, widened to the cell footprint.
  int nPulse = int(f_counts.y + 0.5);
  for (int i = 0; i < MAX_PULSES; i++) {
    if (i >= nPulse) break;
    vec4 a = f_pulse[i * 3];
    vec4 b = f_pulse[i * 3 + 1];
    float w = sqrt(sq(0.5 * a.w) + sq(0.7 * pitch));
    float band = b.x * exp(-sq(length(cpx - a.xy) - a.z) / (2.0 * w * w));
    I += band;
    hotAdd += 0.1 * band;
    tint += f_pulse[i * 3 + 2].rgb * (band * b.y);
    tintW += band * b.y;
  }
  vec2 map = u_inputCrop.xy + vec2(cpx.x/f_host.z,1.0-cpx.y/f_host.w)*u_inputCrop.zw;
  vec2 inputUV=mix(map/max(u_inputMap,vec2(1.0)),(map-u_inputCrop.xy)/max(u_inputCrop.zw,vec2(1.0)),u_inputLocal);
  float local=mix(texture(u_inputA,inputUV).g,texture(u_inputB,inputUV).g,u_inputMix)*4.0*u_inputEnabled;
  vec2 bodyUV=(map-u_bodyCrop.xy)/max(u_bodyCrop.zw,vec2(1.0));
  float inside=step(0.0,bodyUV.x)*step(bodyUV.x,1.0)*step(0.0,bodyUV.y)*step(bodyUV.y,1.0);
  vec3 body=texture(u_body,bodyUV).rgb*u_bodyAlive*inside;
  I+=local*(1.0-0.5*sat(I))+body.g*1.5+body.b*0.25;
  I=max(I,body.r*0.28);
  float Ipre = I * shade;

  // Lift sockets: the source cell dims while its copy floats above.
  float sock = 0.0;
  int nSock = int(f_counts.z + 0.5);
  for (int i = 0; i < MAX_LIFTS; i++) {
    if (i >= nSock) break;
    vec4 s = f_socket[i];
    if (ivec2(floor(s.xy + 0.5)) == cell) sock = max(sock, s.z);
  }
  // Same gate as the lift pass: a copy faded out over a dark cell leaves no dimmed socket behind.
#ifdef P_lift_threshold
  float gateHi = P_lift_threshold;
#else
  float gateHi = 0.2;
#endif
  I = Ipre * (1.0 - sat(sock) * smoothstep(0.5 * gateHi, gateHi, Ipre));

  float hot = (smoothstep(P_color_hot_threshold, 1.0, Iheat) * P_color_hot_amount + hotAdd) * shade;

  // Palette position: mapping (+ crossfade from the previous mapping), warp, jitter, drift.
  float t = mapT(P_color_mapping, p, Ipre, cs);
  if (f_misc.y < 0.999) t = mix(mapT(f_misc.x, p, Ipre, cs), t, sat(f_misc.y));
  float warpN = P_color_warp > 0.0
    ? fbm3(vec3(p * P_color_warpScale, f_clock.x * 0.0625), 2, P_color_warpScale * cs)
    : 0.0;
  t += P_color_offset + P_color_warp * warpN + P_color_jitter * (h2 - 0.5)
     + P_color_intensityShift * (Ipre - 0.5);
  // Drift: tri() folds the palette (period 2, the drift phase wraps at 2 as well). The switch is a
  // per-frame flag (rate or phase nonzero), never the phase value itself.
  t = f_misc.w > 0.5 ? tri(t + f_phaseB.w) : sat(t);

  if(u_brand.x>0.5) t=smoothstep(u_brand.y,u_brand.z,cpx.x/f_host.z)*u_brand.w;
  vec3 base = texture(u_lut, vec2(t * (255.0 / 256.0) + 0.5 / 256.0, 0.25)).rgb;
  // Hue cues from the reference: organic inner-edge patches take the accent color on the cool
  // half of the palette (cyan in the blue), hot cells lean red on the warm side. Both in OKLab.
  // Sharpened so patch cores take the accent fully (distinct teal cells, not a tinted azure).
  float acc = sat(1.6 * x.accent * P_color_accent_amount - 0.3) * smoothstep(0.42, 0.58, t);
  float rot = 0.35 * sat(hot) * (1.0 - smoothstep(0.2, 0.35, t));
  if (acc > 1e-3 || rot > 1e-3) {
    vec3 lab = lin2oklab(base);
    float cr = cos(rot);
    float sr = sin(rot);
    lab.yz = vec2(lab.y * cr - lab.z * sr, lab.y * sr + lab.z * cr);
    lab = mix(lab, lin2oklab(P_color_accent_color), acc);
    base = max(oklab2lin(lab), vec3(0.0));
  }
  base = saturateColor(base, P_color_saturation);
  if (tintW > 0.0) base = mix(base, tint / tintW, sat(tintW));

  float dead = P_animation_floor * (0.25 + 0.75 * env) * pres * mix(1.0, shade, 0.7);
  // Quadratic visibility: unlit cells read faintly next to the structure and vanish in the hole
  // and the far outskirts (clean navy there, as in the reference).
  dead *= min(dead * 4.0, 1.0);
  o_fieldA = enc4(vec4(base, I));
  o_fieldB = vec4(t, sat(hot), sat(dead), sat(Ipre * 0.5));
  o_bloom = enc4(vec4(bloomSource(base * I), 1.0));
  applyDiscovery(discoveryKeep);
  applyRowStream(cell);
}
`}var Gt=class{constructor(e,t=!1,i=!1,r=!1,n=""){this.ctx=e;this.cubeMask=t,this.prog=new M(e,D,Zn(e.header,t,i,r,n),"field",s=>{w(e.gl,s,"u_life",xi),Fe(e,s),w(e.gl,s,"u_lut",V),w(e.gl,s,"u_inputA",9),w(e.gl,s,"u_inputB",10),w(e.gl,s,"u_body",11),w(e.gl,s,"u_tdMask",12),w(e.gl,s,"u_rowStream",13)})}ctx;prog;cubeMask;poll(){return this.prog.poll()}run(e,t,i,r,n=null){let s=this.ctx.gl,a=this.prog.use();Me(this.ctx,a,n);let l=n?.crop??[0,0,1,1],c=n?.bodyCrop??[0,0,1,1],u=n?.brand??[0,0,1,0];if(s.uniform4fv(a.uniform("u_inputCrop"),l),s.uniform4fv(a.uniform("u_bodyCrop"),c),s.uniform2fv(a.uniform("u_inputMap"),n?.map??[1,1]),s.uniform1f(a.uniform("u_inputMix"),n?.mix??0),s.uniform1f(a.uniform("u_bodyAlive"),n?.enabled===!1?0:n?.bodyAlive??0),s.uniform1f(a.uniform("u_inputEnabled"),n&&n.enabled!==!1?1:0),s.uniform4fv(a.uniform("u_maskPair"),n?.maskPair??[0,0,0,0]),s.uniform4fv(a.uniform("u_tdMaskInfo"),n?.externalMask?[...n.externalMask.size,1,n.externalMask.pitch]:[1,1,0,1]),s.uniform1f(a.uniform("u_tdProceduralEnvelope"),n?.externalMask?.proceduralEnvelope?1:0),s.uniform1f(a.uniform("u_rowStreamEnabled"),n?.rowStream?.texture?1:0),s.uniform1i(a.uniform("u_discoveryCount"),n?.discovery?.count??0),s.uniform1f(a.uniform("u_discoveryFeather"),n?.discovery?.featherCells??3),n?.discovery?.count&&(s.uniform4fv(a.uniform("u_discoveryRects[0]"),n.discovery.rects),s.uniform1fv(a.uniform("u_discoveryAlpha[0]"),n.discovery.alpha)),s.uniform4fv(a.uniform("u_tdPhysicalRect"),n?.externalMask?.physicalRect??[0,0,1,1]),s.uniform4fv(a.uniform("u_tdColorRect"),n?.externalMask?.colorRect??[0,0,1,1]),s.uniform2fv(a.uniform("u_tdOffset"),n?.externalMask?.offset??[0,0]),s.uniform4fv(a.uniform("u_brand"),u),s.uniform4fv(a.uniform("u_jointRing0"),n?.jointRing?.[0]??[0,0,0,0]),s.uniform4fv(a.uniform("u_jointRing1"),n?.jointRing?.[1]??[0,0,0,0]),this.cubeMask){if(!(n?.cubeArt instanceof Float32Array)||n.cubeArt.length!==84)throw Error("[lumicells] missing CUBES art parameters");s.uniform4fv(a.uniform("u_cubeArt[0]"),n.cubeArt)}s.uniform1f(a.uniform("u_inputLocal"),n?.local?1:0),v(s,9,n?.a??r),v(s,10,n?.b??r),v(s,11,n?.body??r),v(s,12,n?.externalMask?.texture??r),v(s,13,n?.rowStream?.texture??r),s.bindFramebuffer(s.FRAMEBUFFER,e),N(this.ctx,3),s.viewport(0,0,t,i),v(s,xi,r),s.drawArrays(s.TRIANGLES,0,3)}dispose(){this.prog.dispose()}};var ir=0,wi=1,Pi=2;function es(o){return`${o}
${Ut}
${yi}
uniform sampler2D u_prev;
uniform ivec4 u_size;   // xy current logical size, zw previous logical size (remap)
uniform int u_mode;
uniform uint u_seed;
uniform int u_rule;
uniform float u_birth;
uniform float u_density;
out vec4 o_state;

float aliveAt(ivec2 c) {
  return texelFetch(u_prev, (c + u_size.xy) % u_size.xy, 0).r;
}

vec4 seeded(uvec2 key) {
  float a = step(u01(hash3(uvec3(key, u_seed ^ 0x5bd1e995u))), u_density);
  return vec4(a, 0.0, 0.0, 0.0);
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uvec2 key = uvec2(c + 4096);
  if (u_mode == 1) { o_state = seeded(key); return; }
  if (u_mode == 2) {
    ivec2 src = c + (u_size.zw - u_size.xy) / 2;
    bool inside = all(greaterThanEqual(src, ivec2(0))) && all(lessThan(src, u_size.zw));
    o_state = inside ? texelFetch(u_prev, src, 0) : seeded(key);
    return;
  }
  vec4 self = texelFetch(u_prev, c, 0);
  int n = 0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      n += aliveAt(c + ivec2(dx, dy)) > 0.5 ? 1 : 0;
    }
  }
  // Birth / survival masks: bit k set = rule applies with k live neighbours.
  int bm = 8;    int sm = 12;            // conway    B3/S23
  if (u_rule == 1) { bm = 72; sm = 12; } // highlife  B36/S23
  if (u_rule == 2) { bm = 456; sm = 472; } // daynight B3678/S34678
  if (u_rule == 3) { bm = 4; sm = 0; }   // seeds     B2/S
  bool alive = self.r > 0.5;
  bool next = alive ? ((sm >> n) & 1) == 1 : ((bm >> n) & 1) == 1;
  if (!next && u01(hash3(uvec3(key, u_seed))) < u_birth) next = true;
  if (!next) {
    float pitch = f_grid.z;
    vec2 px = f_origin.xy + (vec2(c) + 0.5) * pitch;
    int nInf = int(f_counts.x + 0.5);
    float seedP = 0.0;
    for (int i = 0; i < MAX_INFLUENCES; i++) {
      if (i >= nInf) break;
      vec4 b = f_inf[i * 3 + 1];
      if (abs(b.w - 3.0) < 0.5) seedP = max(seedP, influenceK(i, px, pitch) * sat(b.z) * 0.5);
    }
    if (seedP > 0.0 && u01(hash3(uvec3(key, u_seed ^ 0x27d4eb2du))) < seedP) next = true;
  }
  float g = next == alive ? min(self.g * 255.0 + 1.0, 255.0) : 0.0;
  float age = next ? min(self.b * 255.0 + 1.0, 255.0) : 0.0;
  // On a change, remember the level shown at the end of the previous step.
  float lvl = next == alive ? self.a : lifeLevel(self, 1.0);
  o_state = vec4(next ? 1.0 : 0.0, g / 255.0, age / 255.0, lvl);
}
`}var Ht=class{constructor(e){this.ctx=e;this.prog=new M(e,D,es(e.header),"life",t=>{w(e.gl,t,"u_prev",L)})}ctx;prog;stepCounter=0;poll(){return this.prog.poll()}run(e,t,i,r,n,s,a,l){let c=this.ctx.gl,u=this.prog.use();c.bindFramebuffer(c.FRAMEBUFFER,i),N(this.ctx),c.viewport(0,0,r,n),v(c,L,t),c.uniform4i(u.uniform("u_size"),r,n,Math.max(1,s),Math.max(1,a)),c.uniform1i(u.uniform("u_mode"),e),this.stepCounter=this.stepCounter+1>>>0,c.uniform1ui(u.uniform("u_seed"),(l.lifeSeed>>>0^Math.imul(this.stepCounter,2654435761))>>>0),c.uniform1i(u.uniform("u_rule"),l.lifeRule|0),c.uniform1f(u.uniform("u_birth"),l.lifeBirth),c.uniform1f(u.uniform("u_density"),l.lifeSeedDensity),c.drawArrays(c.TRIANGLES,0,3)}dispose(){this.prog.dispose()}};function ts(o){return`${o}
layout(location = 0) in vec4 a_i0;  // cellX, cellY, offX, offY
layout(location = 1) in vec4 a_i1;  // scaleX, scaleY, tiltX, tiltY
layout(location = 2) in vec4 a_i2;  // h, alpha, blur, seed
uniform sampler2D u_fieldA;
uniform sampler2D u_fieldB;
uniform sampler2D u_lut;
uniform vec4 u_cellTex;
uniform vec4 u_output;
uniform vec4 u_view;  // xy drawing buffer px, z opaque output (1) or alpha canvas (0)
out vec2 v_plane;
flat out vec4 v_body;  // rgb body color (tonemapped, sRGB), a unused
flat out vec4 v_halo;  // rgb halo color per unit of kernel (linear, exposure applied), a unused
flat out vec4 v_geo;   // xy body half extents px, z height, w edge feather px
flat out vec4 v_misc;  // xy shadow offset px, z alpha, w corner radius px

#ifdef P_lift_threshold
#define LIFT_GATE_HI P_lift_threshold
#else
#define LIFT_GATE_HI 0.2
#endif

void main() {
  ivec2 lim = ivec2(u_cellTex.xy) - 1;
  ivec2 cell = clamp(ivec2(floor(a_i0.xy + 0.5)), ivec2(0), lim);
  vec4 A = dec4(texelFetch(u_fieldA, cell, 0));
  vec4 B = texelFetch(u_fieldB, cell, 0);
  float Ipre = B.a * 2.0;
  float h = a_i2.x;
  // Fade the copy out when its source cell goes dark (it would float over nothing).
  float gate = smoothstep(0.5 * LIFT_GATE_HI, LIFT_GATE_HI, Ipre);
  float alpha = sat(a_i2.y) * gate;
  float pitch = f_grid.z;
  vec2 center = f_origin.xy + (vec2(cell) + 0.5) * pitch + a_i0.zw;
  vec2 halfB = (1.0 - P_grid_gap) * 0.5 * pitch * max(a_i1.xy, vec2(0.05));
  float corner = sat(P_grid_roundness) * min(halfB.x, halfB.y);
  float la = P_modes_sphere_lightAngle;
  vec2 shOff = -vec2(cos(la), sin(la)) * (max(h, 0.0) * 0.3 * pitch);
  // Crisp like a grid cell unless the controller gave this lift a depth-of-field blur (bokeh).
  float feather = P_grid_softness + 0.5 + max(a_i2.z, 0.0) + 0.02 * pitch * max(h, 0.0);
  // Nonzero output reaches past the body edge by at most: feather (the body's edge ramp), 0.9
  // pitch (the halo, zero while h <= 0.05) and the shadow offset + blur (zero while h <= 0). The
  // regions overlap, so the quad takes the largest margin (+2 px of slack), not their sum.
  float hp = max(h, 0.0);
  float haloM = (h > 0.05 && P_lift_halo != 0.0) ? 0.9 * pitch : 0.0;
  float shadowM = (hp > 0.0 && P_lift_shadow > 0.0) ? length(shOff) + (0.15 + 0.5 * hp) * pitch : 0.0;
  float ext = max(halfB.x, halfB.y) + max(max(haloM, shadowM), feather) + 2.0;
  vec2 c = (vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0) * ext;
  float tx = a_i1.z;
  float ty = a_i1.w;
  vec3 v = vec3(c.x, c.y * cos(tx), c.y * sin(tx));
  v = vec3(v.x * cos(ty) + v.z * sin(ty), v.y, -v.x * sin(ty) + v.z * cos(ty));
  float focal = 6.0 * max(halfB.x, halfB.y);
  float w = max((focal + v.z) / focal, 0.2);
  vec2 s = center + v.xy / w;
  vec2 ndc = vec2((s.x-u_output.x) / u_output.z * 2.0 - 1.0, 1.0 - (s.y-u_output.y) / u_output.w * 2.0);
  gl_Position = alpha > 0.002 ? vec4(ndc * w, 0.0, w) : vec4(2.0, 2.0, 2.0, 1.0);
  v_plane = c;
  vec3 hotC = textureLod(u_lut, vec2(B.r * (255.0 / 256.0) + 0.5 / 256.0, 0.75), 0.0).rgb;
  hotC /= max(max3(hotC), 1e-4);
  // Brighter than the grid around it even after the tonemap shoulder (neighbours also get their
  // halo and bloom on top), otherwise the copy reads as a dim tile with a glowing outline.
  float Il = max(Ipre, 0.7) * (1.0 + 2.0 * P_lift_brightness * max(h, 0.0));
  // The popped cell glows in its local hue at full chroma even when it comes from the dark end
  // of the palette (outskirts); scaling a navy up would read as grey. Whitening stays a hint:
  // the hot tint is near white, and a pastel lift reads as a washed-out sticker.
  vec3 hue = A.rgb / max(max3(A.rgb), 1e-4);
  vec3 base = saturateColor(hue, 1.15);
  // Whitening mixes in a gamma-2 space: a linear mix of 10% near-white into saturated blue
  // already reads pastel after the sRGB encode.
  float whiten = sat(P_lift_whiten * max(h, 0.0) + 0.1 * B.g);
  vec3 col = sq3(mix(sqrt(base), sqrt(hotC), whiten)) * Il;
  float ex = P_glow_exposure;
  v_body = vec4(lin2srgb(tonemapMax(col * ex, P_glow_whitePoint)), 0.0);
  v_halo = vec4(saturateColor(base, P_glow_saturation) * (Il * P_lift_halo * 0.8 * ex), 0.0);
  v_geo = vec4(halfB, h, feather);
  v_misc = vec4(shOff, alpha, corner);
}
`}function is(o){return`${o}
uniform vec4 u_view;
in vec2 v_plane;
flat in vec4 v_body;
flat in vec4 v_halo;
flat in vec4 v_geo;
flat in vec4 v_misc;
out vec4 o_color;

void main() {
  // Plane positions and distances stay highp (tens of px, sub-pixel edges); colors are mediump.
  float pitch = f_grid.z;
  float h = max(v_geo.z, 0.0);
  float feather = v_geo.w;
  float d = sdRoundBox(v_plane, v_geo.xy, v_misc.w);
  mediump float body = 1.0 - smoothstep(-feather, feather, d);
  float ds = sdRoundBox(v_plane - v_misc.xy, v_geo.xy, v_misc.w);
  float sBlur = (0.15 + 0.5 * h) * pitch;
  mediump float shadow = P_lift_shadow;
  mediump float shadowA = satM(shadow) * satM(h) * (1.0 - smoothstep(-sBlur, sBlur, ds));
  // Soft lobe only (a tight rim would outline the tile instead of making it glow), grown in with
  // the height: at h ~ 0 the copy still sits on its own cell. Exactly 0 there and under the body.
  mediump vec3 haloS = vec3(0.0);
  if (h > 0.05 && body < 1.0) {
    float dh = max(d, 0.0) / pitch;
    mediump float r2 = max(P_glow_halo_radius, 0.01) * (1.0 + 1.5 * h);
    mediump float haloK = 0.45 * exp2(-dh * 1.4427 / r2) * sq(sat(1.0 - dh / 0.9))
                        * smoothstep(0.05, 0.6, h);
    mediump vec3 haloC = v_halo.rgb;
    mediump float wp = P_glow_whitePoint;
    haloS = lin2srgbM(tonemapMaxM(haloC * haloK, wp));
  }
  mediump float alpha = v_misc.z;
  mediump vec3 bodyS = v_body.rgb;
  mediump vec3 rgb = (bodyS * body + haloS * (1.0 - body)) * alpha;
  mediump float a = alpha * (body + shadowA * (1.0 - body));
  if (u_view.z < 0.5) {
    // Alpha canvas: outside the host the composite leaves glow-only pixels (alpha ~ max3(rgb)),
    // and the purely additive halo (rgb > a) would push them past valid premultiplied alpha.
    // Raise alpha there like the composite does; inside the host (opaque) keep it additive.
    vec2 px = vec2(gl_FragCoord.x, u_view.y - gl_FragCoord.y);
    vec2 hp = px - f_host.xy;
    mediump float inHost = sat(min(hp.x, f_host.z - hp.x) + 0.5) * sat(min(hp.y, f_host.w - hp.y) + 0.5);
    a = mix(max(a, max3M(rgb)), a, inHost);
  }
  o_color = vec4(rgb, a);
}
`}var $t=class{constructor(e){this.ctx=e;let t=e.gl;this.prog=new M(e,ts(e.header),is(e.header),"lift",s=>{w(t,s,"u_fieldA",q),w(t,s,"u_fieldB",W),w(t,s,"u_lut",V)});let i=t.createVertexArray(),r=t.createBuffer();if(!i||!r)throw new Error("[lumicells] cannot create lift buffers");this.vao=i,this.buffer=r,t.bindVertexArray(i),t.bindBuffer(t.ARRAY_BUFFER,r),t.bufferData(t.ARRAY_BUFFER,1536*4,t.DYNAMIC_DRAW);let n=48;for(let s=0;s<3;s++)t.enableVertexAttribArray(s),t.vertexAttribPointer(s,4,t.FLOAT,!1,n,s*16),t.vertexAttribDivisor(s,1);t.bindVertexArray(null),t.bindBuffer(t.ARRAY_BUFFER,null)}ctx;prog;vao;buffer;last=new Float32Array(7).fill(Number.NaN);poll(){return this.prog.poll()}run(e,t,i,r,n,s,a,l,c,u=null){let d=Math.min(t,128,Math.floor(e.length/12));if(d<=0)return;let f=this.ctx.gl,h=this.prog.use(),m=this.last;(m[0]!==n||m[1]!==s||m[2]!==a||m[3]!==l)&&(m[0]=n,m[1]=s,m[2]=a,m[3]=l,f.uniform4f(h.uniform("u_cellTex"),n,s,1/a,1/l));let b=c?1:0;(m[4]!==i||m[5]!==r||m[6]!==b)&&(m[4]=i,m[5]=r,m[6]=b,f.uniform4f(h.uniform("u_view"),i,r,b,0)),f.uniform4f(h.uniform("u_output"),u?.x??0,u?.y??0,u?.width??i,u?.height??r),f.bindBuffer(f.ARRAY_BUFFER,this.buffer),f.bufferSubData(f.ARRAY_BUFFER,0,e,0,d*12),f.bindBuffer(f.ARRAY_BUFFER,null),f.bindVertexArray(this.vao),f.enable(f.BLEND),f.blendFunc(f.ONE,f.ONE_MINUS_SRC_ALPHA),f.drawArraysInstanced(f.TRIANGLE_STRIP,0,4,d),f.disable(f.BLEND),f.bindVertexArray(null)}dispose(){let e=this.ctx.gl;this.prog.dispose(),e.deleteVertexArray(this.vao),e.deleteBuffer(this.buffer)}};var or=16;function os(o){return`${o}
layout(location = 0) out vec4 o_a;
layout(location = 1) out vec4 o_b;

// d: distance from a body edge in pitch units (>= 0). Tight rim lobe + soft lobe; the window is
// flat across the gap and reaches exactly 0 at half a pitch (what makes the 2x2 quadrant exact).
float haloKernel(float d, float invR2) {
  return (0.6 * exp2(-d * 28.8539) + 0.35 * exp2(-d * invR2)) * (1.0 - smoothstep(0.2, 0.5, d));
}

void main() {
  float pitch = f_grid.z;
  // Pixel center relative to the cell center, device px (y down, like the composite).
  vec2 lc = gl_FragCoord.xy - 0.5 * pitch;
  float hb = (1.0 - P_grid_gap) * 0.5 * pitch;
  float rad = sat(P_grid_roundness) * hb;
  float d0 = sdRoundBox(lc, vec2(hb), rad);
  float aw = P_grid_softness + 0.5;
  float body = 1.0 - smoothstep(-aw, aw, d0);
  float dc = length(lc) / hb;
  float emit = 1.0 - P_grid_emitter * min(dc * dc, 1.0);
  // Pastel only in the core of hot cells: a soft rounded square (L4 norm, no diagonal creases
  // unlike the box SDF) following the body; the rim and the halo stay saturated.
  vec2 q2 = lc / hb;
  q2 *= q2;
  float dq = sqrt(sqrt(dot(q2, q2)));
  float core = 1.0 - smoothstep(0.45 * P_color_hot_core, 1.45 * P_color_hot_core, dq);
  float rim = 1.0 - smoothstep(0.0, 0.3 * hb, -d0);
  float bevel = rim * clamp(-(lc.x + lc.y) / hb, -1.0, 1.0);
  // Halo from the 2x2 quadrant neighbourhood (the quadrant the pixel sits in).
  float invR2 = 1.4427 / max(P_glow_halo_radius, 0.01);
  float ip = 1.0 / pitch;
  vec2 o = vec2(lc.x < 0.0 ? -pitch : pitch, lc.y < 0.0 ? -pitch : pitch);
  float k0 = haloKernel(max(d0, 0.0) * ip, invR2);
  float kx = haloKernel(max(sdRoundBox(lc - vec2(o.x, 0.0), vec2(hb), rad), 0.0) * ip, invR2);
  float ky = haloKernel(max(sdRoundBox(lc - vec2(0.0, o.y), vec2(hb), rad), 0.0) * ip, invR2);
  float kd = haloKernel(max(sdRoundBox(lc - o, vec2(hb), rad), 0.0) * ip, invR2);
  o_a = vec4(emit * body, core, 0.5 + 0.5 * bevel, 1.0);
  o_b = vec4(k0, kx, ky, kd) * (1.0 - body);
}
`}var Vt=class{constructor(e){this.ctx=e;this.prog=new M(e,D,os(e.header),"cell-stamp",()=>{})}ctx;prog;texA=null;texB=null;fb=null;alloc=0;pitch=0;dirty=!0;poll(){return this.prog.poll()}update(e){let t=Math.max(1,Math.round(e)),i=this.ctx.gl;v(i,Ve,this.texA),v(i,qe,this.texB),!(!this.dirty&&t===this.pitch&&this.fb)&&((!this.fb||_e(this.alloc,t,or))&&this.allocate(le(t,or)),this.prog.use(),i.bindFramebuffer(i.FRAMEBUFFER,this.fb),N(this.ctx,2),i.viewport(0,0,t,t),i.drawArrays(i.TRIANGLES,0,3),this.pitch=t,this.dirty=!1)}allocate(e){let t=this.ctx.gl;this.free();let i=this.ctx.caps.hdrFormat;t.activeTexture(t.TEXTURE0+L),this.texA=oe(t,e,e,{format:i}),this.texB=oe(t,e,e,{format:i}),this.fb=$e(t,[this.texA,this.texB]),v(t,L,null),v(t,Ve,this.texA),v(t,qe,this.texB),this.alloc=e}free(){let e=this.ctx.gl;e.deleteFramebuffer(this.fb),e.deleteTexture(this.texA),e.deleteTexture(this.texB),this.fb=null,this.texA=null,this.texB=null,this.alloc=0}dispose(){this.prog.dispose(),this.free()}};var qt=32,Wt=8,Xt=class{constructor(e,t){this.gl=e;this.caps=t}gl;caps;w=0;h=0;qw=0;qh=0;aw=0;ah=0;aqw=0;aqh=0;prevW=0;prevH=0;fieldA=null;fieldB=null;fieldFb=null;bloom=null;bloomTmp=null;glow=null;haze=null;hazeTmp=null;life=[];lifeCur=0;orphanLife=null;target(e,t,i,r,n){let s=this.gl,a=oe(s,e,t,{filter:r,format:n??(i?this.caps.hdrFormat:this.caps.rgba8)}),l=$e(s,[a]);return{tex:a,fb:l}}free(e){e&&(this.gl.deleteFramebuffer(e.fb),this.gl.deleteTexture(e.tex))}ensure(e,t){if(e===this.w&&t===this.h&&this.fieldFb)return 0;let i=this.gl;this.prevW=this.w,this.prevH=this.h;let r=Math.ceil(e/4),n=Math.ceil(t/4),s=1;if(!this.fieldFb||_e(this.aw,e,qt)||_e(this.ah,t,qt)){s=2;let a=le(e,qt),l=le(t,qt);this.free(this.orphanLife),this.orphanLife=this.life[this.lifeCur]??null,this.free(this.life[1-this.lifeCur]??null),this.freeCellTargets(),this.fieldA=oe(i,a,l,{format:this.caps.hdrFormat}),this.fieldB=oe(i,a,l,{format:this.caps.rgba8}),this.bloom=this.target(a,l,!0,i.LINEAR),this.fieldFb=$e(i,[this.fieldA,this.fieldB,this.bloom.tex]),this.bloomTmp=this.target(a,l,!0,i.LINEAR),this.glow=this.target(a,l,!0,i.LINEAR,this.caps.glowFormat),this.life=[this.target(a,l,!1,i.NEAREST),this.target(a,l,!1,i.NEAREST)],this.lifeCur=0,this.aw=a,this.ah=l}if(!this.haze||_e(this.aqw,r,Wt)||_e(this.aqh,n,Wt)){let a=le(r,Wt),l=le(n,Wt);this.free(this.haze),this.free(this.hazeTmp),this.haze=this.target(a,l,!0,i.LINEAR),this.hazeTmp=this.target(a,l,!0,i.LINEAR),this.aqw=a,this.aqh=l}return this.w=e,this.h=t,this.qw=r,this.qh=n,s}releaseOrphanLife(){this.free(this.orphanLife),this.orphanLife=null}freeCellTargets(){let e=this.gl;e.deleteFramebuffer(this.fieldFb),e.deleteTexture(this.fieldA),e.deleteTexture(this.fieldB),this.fieldFb=null,this.fieldA=null,this.fieldB=null,this.free(this.bloom),this.free(this.bloomTmp),this.free(this.glow),this.bloom=null,this.bloomTmp=null,this.glow=null}dispose(){this.freeCellTargets();for(let e of this.life)this.free(e);this.life=[],this.releaseOrphanLife(),this.free(this.haze),this.free(this.hazeTmp),this.haze=null,this.hazeTmp=null,this.w=this.h=this.aw=this.ah=0}};var ki=256,Ei=2,ns=ki*Ei*4,rr={high:0,medium:1,low:2},Kt=class{canvas;caps;softwareFallback;cubeInstances=0;gl;opts;passes=null;res=null;paramsUbo=null;frameUbo=null;lutTex=null;timer=null;paramsFloats;ranges=new Int32Array(6);linked=!1;failure=null;disposed=!1;paramsUploaded=!1;lutUploaded=!1;wasLost=!1;onContextLost=()=>{this.wasLost=!0};constructor(e,t){this.canvas=e,this.opts=t;let i={alpha:!t.opaque,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1,powerPreference:"default",failIfMajorPerformanceCaveat:!0},r=e.getContext("webgl2",i),n=!1;if(r||(r=e.getContext("webgl2",{...i,failIfMajorPerformanceCaveat:!1}),n=!!r),!r)throw new me("no-webgl2","[lumicells] WebGL2 is not available");this.gl=r,this.caps=Co(r,t.forceRgba8??!1),this.softwareFallback=n||this.caps.software;let s=/u_p\s*\[\s*(\d+)\s*\]/.exec(t.paramsPrelude),a=Math.max(1,Math.floor(t.paramsVec4Count)||0,Number(s?.[1]??0));if(this.paramsFloats=a*4,e.addEventListener("webglcontextlost",this.onContextLost),t.warnMissingParams??!0){let l=No(t.paramsPrelude);l.length>0&&console.warn(`[lumicells] params prelude lacks ${l.length} macro(s), using defaults: ${l.join(", ")}`)}if(!r.isContextLost())try{this.createResources()}catch(l){this.fail(l,"resource")}}createResources(){let e=this.gl,t={gl:e,caps:this.caps,header:Do(this.caps.hdr,this.opts.paramsPrelude)};if(this.passes={life:new Ht(t),field:new Gt(t,this.opts.cubeMask??!1,this.opts.scenarioParameters??!1,this.opts.cubeGeometry??!1,this.opts.sceneProfile?.field),bloom:new Nt(t),composite:new Dt(t,this.opts.cubeMask??!1,this.opts.cubeGeometry??!1,this.opts.cubeMinPitch??16,this.opts.sceneProfile?.composite,this.opts.backgroundProfile),cubes:this.opts.cubeGeometry?new zt(t,this.opts.cubeMask??!1,this.opts.scenarioParameters??!1,this.opts.cubeMinPitch??16,this.opts.backgroundProfile):null,lift:new $t(t),stamp:new Vt(t)},this.res=new Xt(e,this.caps),this.paramsUbo=e.createBuffer(),this.frameUbo=e.createBuffer(),!this.paramsUbo||!this.frameUbo)throw new Error("[lumicells] cannot create uniform buffers");e.bindBuffer(e.UNIFORM_BUFFER,this.paramsUbo),e.bufferData(e.UNIFORM_BUFFER,this.paramsFloats*4,e.DYNAMIC_DRAW),e.bindBuffer(e.UNIFORM_BUFFER,this.frameUbo),e.bufferData(e.UNIFORM_BUFFER,6064,e.DYNAMIC_DRAW),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,We,this.paramsUbo),e.bindBufferBase(e.UNIFORM_BUFFER,Xe,this.frameUbo),e.activeTexture(e.TEXTURE0+V),this.lutTex=oe(e,ki,Ei,{filter:e.LINEAR,format:{internalFormat:e.SRGB8_ALPHA8,format:e.RGBA,type:e.UNSIGNED_BYTE}}),this.caps.timerQuery&&(this.timer=new Tt(e,this.caps.timerQuery)),e.disable(e.DEPTH_TEST),e.disable(e.CULL_FACE),e.disable(e.BLEND),e.disable(e.DITHER)}get ready(){return this.linked&&!this.failure&&!this.disposed&&!this.isContextLost()}get error(){return this.failure}get gpuTimeMs(){return this.timer?.ms??null}isContextLost(){return this.wasLost||this.gl.isContextLost()}loseContextForTesting(){this.gl.isContextLost()||this.caps.loseContext?.loseContext()}restoreContextForTesting(){this.gl.isContextLost()&&this.caps.loseContext?.restoreContext()}fail(e,t){if(this.failure)return;let i=e instanceof xe?new me("compile",e.message,{cause:e}):e instanceof me?e:new me(t,e instanceof Error?e.message:String(e),{cause:e});this.failure=i,console.error(i),i.cause instanceof xe&&i.cause.source&&console.debug(i.cause.source),this.opts.onError?.(i)}pollLinked(){let e=this.passes;if(!e)return!1;try{let t=e.life.poll();return t=e.field.poll()&&t,t=e.bloom.poll()&&t,t=e.composite.poll()&&t,e.cubes&&(t=e.cubes.poll()&&t),t=e.lift.poll()&&t,t=e.stamp.poll()&&t,t&&(this.linked=!0,e.bloom.invalidate()),t}catch(t){return this.fail(t,"compile"),!1}}render(e,t=null){if(this.disposed||this.failure||!this.passes||!this.res||this.isContextLost()||!this.linked&&!this.pollLinked())return!1;try{return this.draw(e,this.passes,this.res,t),!0}catch(i){return this.isContextLost()||this.fail(i,"resource"),!1}}renderMask(e,t){if(!this.ready||!this.opts.cubeMask||!this.passes||!this.res?.bloom)return!1;let i=this.gl,r=this.res;return i.bindVertexArray(null),i.disable(i.SCISSOR_TEST),i.disable(i.DEPTH_TEST),i.disable(i.BLEND),i.colorMask(!0,!0,!0,!0),i.bindBufferBase(i.UNIFORM_BUFFER,We,this.paramsUbo),i.bindBufferBase(i.UNIFORM_BUFFER,Xe,this.frameUbo),v(i,q,r.fieldA),v(i,W,r.fieldB),v(i,L,r.bloom.tex),this.passes.composite.run(e.canvasWidth,e.canvasHeight,r.w,r.h,r.aw,r.ah,rr[e.quality]??0,5,!0,!1,t),!0}draw(e,t,i,r){let n=this.gl,s=this.canvas,a=Math.max(1,Math.floor(e.canvasWidth)),l=Math.max(1,Math.floor(e.canvasHeight));!r&&s.width!==a&&(s.width=a),!r&&s.height!==l&&(s.height=l);let c=r?a:n.drawingBufferWidth,u=r?l:n.drawingBufferHeight,d=Math.max(1,e.cols+2*e.pad),f=Math.max(1,e.rows+2*e.pad);n.activeTexture(n.TEXTURE0+L);let h=i.ensure(d,f);h!==0&&(t.bloom.setSizes(d,f,i.aw,i.ah,i.qw,i.qh,i.aqw,i.aqh),v(n,q,i.fieldA),v(n,W,i.fieldB),v(n,ve,i.glow?.tex??null),v(n,Rt,i.haze?.tex??null)),n.bindVertexArray(null),n.disable(n.SCISSOR_TEST),n.disable(n.DEPTH_TEST),n.disable(n.CULL_FACE),n.disable(n.BLEND),n.disable(n.DITHER),n.colorMask(!0,!0,!0,!0),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1);for(let B=0;B<14;B++)n.bindSampler(B,null);n.bindBufferBase(n.UNIFORM_BUFFER,We,this.paramsUbo),n.bindBufferBase(n.UNIFORM_BUFFER,Xe,this.frameUbo),v(n,V,this.lutTex),v(n,q,i.fieldA),v(n,W,i.fieldB),v(n,ve,i.glow?.tex??null),this.upload(e),this.timer?.begin();let m=i.life[0],b=i.life[1];if(!m||!b)throw new Error("[lumicells] life targets missing");if(h===2?(i.orphanLife&&i.prevW>0?t.life.run(Pi,i.orphanLife.tex,m.fb,d,f,i.prevW,i.prevH,e):t.life.run(wi,b.tex,m.fb,d,f,d,f,e),i.lifeCur=0,i.releaseOrphanLife()):h===1&&this.lifeRun(Pi,e,i),e.lifeReset)this.lifeRun(wi,e,i);else{let B=Math.min(Math.max(e.lifeSteps|0,0),2);for(let z=0;z<B;z++)this.lifeRun(ir,e,i)}let g=i.life[i.lifeCur],{fieldFb:x,bloom:P,bloomTmp:_,haze:y,hazeTmp:E,glow:I}=i;if(!x||!g||!P||!_||!y||!E||!I)throw new Error("[lumicells] cell targets missing");t.field.run(x,d,f,g.tex,r?.interaction);let F=e.debugView|0,X=(F===0||F===3||F===4)&&(e.bloomStrength!==0||e.hazeStrength!==0);X&&(t.bloom.setSigmas(e.bloomSigma,e.hazeSigma),t.bloom.run(d,f,i.qw,i.qh,P,_,y,E,I,F)),t.stamp.update(e.frame[14]??e.pitchPx),t.composite.run(c,u,d,f,i.aw,i.ah,rr[e.quality]??0,F,e.opaque,X,r),this.cubeInstances=t.cubes&&F===0?t.cubes.run(e,d,f,r,i.aw,i.ah,X):0,e.liftCount>0&&F===0&&t.lift.run(e.lifts,e.liftCount,c,u,d,f,i.aw,i.ah,e.opaque,r),this.timer?.end()}lifeRun(e,t,i){let r=i.life[i.lifeCur],n=i.life[1-i.lifeCur];!r||!n||!this.passes||(this.passes.life.run(e,r.tex,n.fb,i.w,i.h,i.prevW||i.w,i.prevH||i.h,t),i.lifeCur=1-i.lifeCur)}upload(e){let t=this.gl;if((e.paramsDirty||!this.paramsUploaded)&&this.paramsUbo&&(t.bindBuffer(t.UNIFORM_BUFFER,this.paramsUbo),t.bufferSubData(t.UNIFORM_BUFFER,0,e.params,0,Math.min(e.params.length,this.paramsFloats)),this.paramsUploaded=!0,this.passes&&(this.passes.stamp.dirty=!0)),this.frameUbo){let i=e.frame,r=this.ranges,n=ji(i,r);t.bindBuffer(t.UNIFORM_BUFFER,this.frameUbo);for(let s=0;s<n;s++){let a=r[s*2],l=Math.min(i.length,r[s*2+1]);l>a&&t.bufferSubData(t.UNIFORM_BUFFER,a*4,i,a,l-a)}}t.bindBuffer(t.UNIFORM_BUFFER,null),(e.lutDirty||!this.lutUploaded)&&this.lutTex&&e.lut.length>=ns&&(t.activeTexture(t.TEXTURE0+V),t.bindTexture(t.TEXTURE_2D,this.lutTex),t.pixelStorei(t.UNPACK_ALIGNMENT,1),t.texSubImage2D(t.TEXTURE_2D,0,0,0,ki,Ei,t.RGBA,t.UNSIGNED_BYTE,e.lut),this.lutUploaded=!0)}readFieldForTesting(){let e=this.gl,t=this.res;if(!t?.fieldFb||this.isContextLost())return null;let{w:i,h:r}=t,n=new Float32Array(i*r*4),s=new Uint8Array(i*r*4);if(e.bindFramebuffer(e.READ_FRAMEBUFFER,t.fieldFb),e.readBuffer(e.COLOR_ATTACHMENT0),this.caps.hdr)e.readPixels(0,0,i,r,e.RGBA,e.FLOAT,n);else{let a=new Uint8Array(i*r*4);e.readPixels(0,0,i,r,e.RGBA,e.UNSIGNED_BYTE,a);for(let l=0;l<a.length;l++){let c=(a[l]??0)/255;n[l]=c*c*4}}return e.readBuffer(e.COLOR_ATTACHMENT1),e.readPixels(0,0,i,r,e.RGBA,e.UNSIGNED_BYTE,s),e.readBuffer(e.COLOR_ATTACHMENT0),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),{w:i,h:r,a:n,b:s}}dispose(){if(this.disposed)return;this.disposed=!0,this.canvas.removeEventListener("webglcontextlost",this.onContextLost);let e=this.gl;if(this.isContextLost()){this.passes=null,this.res=null,this.timer=null;return}try{this.timer?.dispose(),this.passes&&(this.passes.life.dispose(),this.passes.field.dispose(),this.passes.bloom.dispose(),this.passes.composite.dispose(),this.passes.cubes?.dispose(),this.passes.lift.dispose(),this.passes.stamp.dispose()),this.res?.dispose(),e.deleteBuffer(this.paramsUbo),e.deleteBuffer(this.frameUbo),e.deleteTexture(this.lutTex)}catch(t){console.warn("[lumicells] engine dispose failed",t)}this.passes=null,this.res=null,this.timer=null}};function nr(o,e=!0,t=!1){return e&&!t&&Number.isFinite(o)?Math.max(0,Math.min(o,.05)):0}function sr(o,e,t=1){if(![o,e,t].every(n=>Number.isFinite(n)&&n>0))throw Error("Invalid viewport");let i=Math.round(o*t),r=Math.round(e*t);return{width:i,height:r,pitch:35*i/3591}}var ss=`
vec2 referencePoint(vec2 p,vec2 size){
  float scale=size.x/3591.0;
  return (p-size*.5)/scale+vec2(1795.5,556.5);
}
`,ar=`
vec4 profileField(vec2 px,vec2 size){
  // A true circle in screen pixels, not an ellipse in normalised viewport UV.
  float phase=f_clock.x*(6.28318530718/16.0);
  vec2 center=size*vec2(.5+.30*sin(phase),.5+.16*sin(phase*2.0));
  float radius=min(size.x,size.y)*(.72+.06*sin(phase*2.0));
  float distance=length(px-center)/radius;
  float mask=1.0-smoothstep(0.0,1.0,distance);
  vec3 blue=vec3(.24,.18,.88),cyan=vec3(.08,.78,.96),lilac=vec3(.90,.40,.98);
  vec3 rgb=mix(blue,cyan,.5+.5*sin(phase+px.x/size.x*3.0));
  rgb=mix(rgb,lilac,.25+.20*cos(phase*2.0+px.y/size.y*2.0));
  return vec4(mix(rgb/12.92,pow((rgb+.055)/1.055,vec3(2.4)),step(vec3(.04045),rgb)),1.3*mask);
}
`,lr=ss+`
#define KDW_RADIAL_CELLS 1
float radialAlpha(vec2 p,vec2 center,vec2 radius,float a,float b){
  float r=length((p-center)/radius);
  return r<.55?mix(a,b,r/.55):mix(b,0.0,clamp((r-.55)/.45,0.0,1.0));
}
vec3 angularColor(vec2 p,float phase){
  vec2 d=p-vec2(4779.03,602.099);
  vec2 q=vec2((d.y-.0437703*d.x)/1.87787,-d.x/1.86963);
  float t=fract(atan(q.y,q.x)/6.28318530718+1.0+.18*sin(phase));
  vec3 a=vec3(0.0,190.0,255.0)/255.0,b=vec3(71.0,26.0,255.0)/255.0;
  vec3 c=vec3(148.0,0.0,255.0)/255.0,dark=vec3(110.0,26.0,255.0)/255.0;
  if(t<.247607)return mix(a,b,t/.247607);
  if(t<.4958539)return mix(b,c,(t-.247607)/.2482469);
  if(t<.7469833)return mix(c,dark,(t-.4958539)/.2511294);
  return mix(dark,a,(t-.7469833)/.2530167);
}
float diskCoverage(vec2 p,float sigma){
  float distance=length(p-vec2(4779.03,602.099))-1877.87;
  // Gaussian CDF approximation with disk-curvature attenuation: bounded, no huge filter targets.
  float x=distance/(sigma*1.41421356);
  float erf=sign(x)*sqrt(1.0-exp(-x*x*(1.27323954+.147*x*x)/(1.0+.147*x*x)));
  return .5*(1.0-erf)*exp(-.5*sigma*sigma/(1877.87*1877.87));
}
vec3 profileComposite(vec2 px,vec2 size,vec3 cells){
  vec2 p=referencePoint(px,size);
  float phase=f_clock.x*(6.28318530718/8.0);
  // Independent smooth orbits move the colour field, never the UI or lattice.
  p+=vec2(440.0*sin(phase*.5),185.0*sin(phase));
  p+=vec2(110.0*sin(p.y/620.0+phase),90.0*cos(p.x/1100.0-phase*.5));
  vec3 base=vec3(13.0,0.0,26.0)/255.0,color=angularColor(p,phase*.5),bg=base;
  bg=mix(bg,color,diskCoverage(p,1591.16));
  bg=mix(bg,color,diskCoverage(p,662.985));
  bg=mix(bg,min(vec3(1.0),bg/max(vec3(.001),1.0-color)),.5*diskCoverage(p,1325.97));
  // Keep the moving cells subordinate to foreground copy and interaction cards.
#ifndef MAX_GRADIENT_ONLY
  bg=mix(bg,clamp(vec3(.016,.008,.040)+cells,0.0,1.0),.2);
#endif
  bg=mix(bg,vec3(71.0,26.0,255.0)/255.0,radialAlpha(p,vec2(438.48,264.504)+vec2(540.0*cos(phase*.5),210.0*sin(phase)),vec2(1434.49,1189.58),.42,.147));
  bg=mix(bg,vec3(149.0,0.0,255.0)/255.0,radialAlpha(p,vec2(3027.56,1132.2)+vec2(380.0*sin(phase),260.0*cos(phase*.5)),vec2(1154.59,1021.64),.38,.133));
  bg=mix(bg,vec3(0.0,191.0,255.0)/255.0,radialAlpha(p,vec2(530.591,1000.14)+vec2(720.0*sin(phase*.5),340.0*cos(phase)),vec2(1154.59,643.772),.23,.0805));
  bg=mix(bg,vec3(110.0,26.0,255.0)/255.0,radialAlpha(p,vec2(1719.02,-372.27),vec2(1119.6,860.695),.18,.063));
  bg=mix(bg,base,radialAlpha(p,vec2(3244.48,1291.74),vec2(1371.51,1055.23),.58,.26));
  return clamp(bg,0.0,1.0);
}
`,cr={extends:"reference",grid:{sizing:"count",count:32,gap:.18,roundness:.18,softness:1.1,bevel:0,emitter:.1},glow:{halo:{strength:.08},bloom:{strength:.16},haze:{strength:0},exposure:1,whitePoint:4},background:{color:"#0D001A",vignette:0,spotA:{strength:0},spotB:{strength:0}},animation:{speed:1,floor:0,flicker:{amount:0},sparkle:{amount:0}},lift:{amount:0},render:{quality:"high",maxDpr:4,maxPixels:12,opaque:!0,reducedMotion:"ignore"}};function ur(o,{offscreen:e=!1}={}){o.style.background="#0D001A";let t=new URLSearchParams(location.search),i=t.get("background-motion")==="auto",r=!e&&document.documentElement.dataset.production!=="true"&&t.has("background-debug")?document.createElement("output"):null;r&&(r.style.cssText="position:fixed;left:12px;bottom:12px;z-index:99999;padding:8px 12px;border-radius:8px;background:#080012;color:white;font:14px monospace;pointer-events:none;white-space:pre-line",document.body.append(r));let n=0,s=-1/0,a=(_,y=0,E=!1)=>{r&&(E||performance.now()-s>250)&&(r.textContent=`MAX \xB7 LumiCells \xD74 \xB7 pixels-03
${_} \xB7 \u043A\u0430\u0434\u0440 ${n} \xB7 ${y.toFixed(2)} \u0441`,s=performance.now())};a("\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430",0,!0);let l=new It({config:cr,random:()=>.5});l.nativeResolution=!0,l.nativeGridFractionalPitch=!1;let c=new Kt(o,{opaque:!0,paramsPrelude:l.layout.glslPrelude,paramsVec4Count:l.layout.vec4Count,sceneProfile:{field:ar,composite:lr}}),u=!1,d=!1,f=!1,h=performance.now(),m=!0,b=!1,g=(_=0,{active:y=!0,reduced:E=!1}={})=>{if(u||f||d||!y||!e&&document.hidden){h=performance.now();return}let I=nr(_,!0,i&&E);if(b&&!m&&I===0){a(i&&E?"\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0430\u044F \u043F\u0430\u0443\u0437\u0430":"\u041D\u0435\u0442 delta",l.clock.seconds);return}try{let F=l.update(b?I:0);if(c.render(F))l.commitFrame(),m=!1,b=!0,n++,a("\u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F",l.clock.seconds),document.documentElement.dataset.backgroundReady="true";else{if(c.error)throw c.error;if(performance.now()-h>15e3)throw Error("LumiCells shader warmup timeout")}}catch(F){f=!0,document.documentElement.dataset.backgroundReady="false",a(`\u041E\u0448\u0438\u0431\u043A\u0430: ${F.message}`,l.clock.seconds,!0),console.error("MAX LumiCells:",F)}},x=()=>{let _=sr(innerWidth,innerHeight,devicePixelRatio);l.nativeGridPitch=Math.max(1,Math.round(_.pitch)),l.setViewport({hostCssW:_.width,hostCssH:_.height,dpr:1,deviceW:_.width,deviceH:_.height}),m=!0,h=performance.now()},P=()=>{h=performance.now()};return addEventListener("resize",x),document.addEventListener("visibilitychange",P),x(),g(),{tick:g,pause(_){d=!!_,h=performance.now()},scanPulse(){},dispose(){u=!0,r?.remove(),removeEventListener("resize",x),document.removeEventListener("visibilitychange",P),c.dispose(),l.destroy(),delete document.documentElement.dataset.backgroundReady}}}if(!globalThis.kdwBackgroundOutput)throw Error("Background requires the desktop host");var fr=ur(document.querySelector("canvas"),{offscreen:!0}),mr=!1,dr=performance.now(),Si=0,pr=!1;globalThis.kdwBackgroundOutput.onFrame(o=>{mr=o.reduced===!0});function hr(o){pr||(fr.tick(Math.max(0,Math.min(.05,(o-dr)/1e3)),{active:!0,reduced:mr}),dr=o,globalThis.kdwBackgroundOutput.ack(),Si=requestAnimationFrame(hr))}Si=requestAnimationFrame(hr);addEventListener("pagehide",()=>{pr=!0,cancelAnimationFrame(Si),fr.dispose()},{once:!0});
