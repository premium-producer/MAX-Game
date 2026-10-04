import test from 'node:test';
import assert from 'node:assert/strict';
import {planPhoneInsertion,wallLinePositions,WALL_GAME} from '../public/site-game/model.mjs';

test('horizontal PC frame opens beside either business step without crossing an icon',()=>{
  const base=wallLinePositions(4).map(x=>({x,y:815}));
  for(const active of [1,2]){
    const plan=planPhoneInsertion(base,active,WALL_GAME,520),left=plan.left,right=left+520;
    const activeCenter=plan.positions[active].x;
    if(plan.side==='right')assert.ok(left>=activeCenter+120+32);
    else assert.ok(right<=activeCenter-120-32);
    for(let i=0;i<plan.positions.length;i++)if(i!==active){
      const center=plan.positions[i].x;
      assert.ok(center+120<=left||center-120>=right,`active ${active}, node ${i}`);
    }
  }
});
