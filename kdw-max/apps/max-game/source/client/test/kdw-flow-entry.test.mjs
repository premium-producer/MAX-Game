import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlowEntry} from '../src/kdw-flow-entry.mjs';
const row=(spawnId,y,h=100)=>({spawnId,y,h});
const ids=(gate,rows,ready=true)=>[...gate.update(rows,r=>r,ready)];
test('a delayed reveal skips in-flight cards and admits the next complete card above the viewport',()=>{
 const gate=createFlowEntry();
 assert.deepEqual(ids(gate,[row('old',-120)],false),[]);
 assert.deepEqual(ids(gate,[row('old',200),row('edge',-90),row('new',-100)]),['new']);
 assert.deepEqual(ids(gate,[row('old',400),row('edge',0),row('new',200),row('next',-130)]),['new','next']);
 // A large frame/clock gap must not pop a newly observed card into the field.
 assert.deepEqual(ids(gate,[row('late',300),row('next',450)]),['next']);
});
test('admitted flights survive pause and resize; task replay clears all admission state',()=>{
 const gate=createFlowEntry();
 assert.deepEqual(ids(gate,[row('1',-101)]),['1']);
 assert.deepEqual(ids(gate,[row('1',300,180)],false),['1']);
 gate.clear();assert.deepEqual(ids(gate,[row('1',400)],false),[]);
 assert.deepEqual(ids(gate,[row('1',400),row('2',-200)]),['2']);
 assert.deepEqual(ids(gate,[]),[]);
});
