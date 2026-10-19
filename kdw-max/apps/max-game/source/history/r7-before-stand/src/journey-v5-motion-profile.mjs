// Shared cadence for v5 only. maath owns damping; no second animation clock.
export const V5_MOTION=Object.freeze({
 travelOmega:10,dragOmega:14,presenceOmega:12,
 presenceDistance:.005,presenceSpeed:.05,
 resizeDistance:.5,resizeSpeed:3,
 traceSeconds:.65,fanSeconds:.65,fanStagger:0,
 introPath:Object.freeze({seconds:1.2,stagger:.14,bend:220}),
 startupPath:Object.freeze({seconds:.85,stagger:.28,bend:0}),
 repackPath:Object.freeze({seconds:1.3,stagger:.08,bend:0}),
 popup:Object.freeze({exit:.45,enter:.45,interruptOmega:12}),
});
