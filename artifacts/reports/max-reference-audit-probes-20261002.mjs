// Read-only CPU counterexamples for the currently shipped presentation.
import assert from 'node:assert/strict';
import {separateReferenceObjects} from '../max-game/src/journey-reference-motion.mjs';
import {MotionValue} from '../max-game/src/journey-motion.mjs';
const obstacle={x:0,y:0,w:100,h:100};
function resolve(x,obstacles){const box={id:'tile',x,y:40,w:20,h:20};const d=separateReferenceObjects([box],obstacles).get('tile');return {x:box.x+d.x,y:box.y+d.y};}
const before=resolve(39.99,[obstacle]),after=resolve(40.01,[obstacle]);
const boundaryJump=Math.hypot(after.x-before.x,after.y-before.y);
assert.ok(boundaryJump>100);
const without=resolve(40,[]),withObstacle=resolve(40,[obstacle]);
const obstacleAppearanceJump=Math.hypot(withObstacle.x-without.x,withObstacle.y-without.y);
assert.ok(obstacleAppearanceJump>50);
// Current adapter gates reference entrance by mediaReady and alpha>.97 only.
const alpha=new MotionValue(0),x=new MotionValue(0),goal=1500;
for(let i=0;i<48;i++){alpha.step(1,1/60,8);x.step(goal,1/60,8);}
assert.ok(alpha.value>.97);assert.ok(Math.abs(x.value-goal)>10);
console.log(JSON.stringify({
 scope:'CPU counterexamples; no browser, no gameplay mutation',
 solverBoundary:{inputDelta:.02,before,after,outputJump:boundaryJump},
 newObstacle:{without,withObstacle,outputJump:obstacleAppearanceJump},
 referenceGateAfter800ms:{alpha:alpha.value,positionError:goal-x.value,speed:x.velocity,adapterReady:alpha.value>.97},
 conclusion:'Nonintersection does not prove continuous motion; alpha does not prove positional readiness.'
},null,2));
