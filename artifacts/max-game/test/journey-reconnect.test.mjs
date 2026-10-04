import test from 'node:test';
import assert from 'node:assert/strict';
import {changesExistingRoute,RouteReconnect} from '../src/journey-reconnect.mjs';
import {suspendSignalLink,stepSignalLinkPresence} from '../src/journey-links.mjs';

test('moving and adding a node keep existing ribbons lit, including a flight',()=>{
 const before={'open-max':'start',channel:'blog-0'};
 const after={...before,comments:'blog-1'};
 assert.equal(changesExistingRoute(before,{...before}),false);
 assert.equal(changesExistingRoute(before,after),false);
 const gate=new RouteReconnect(),edge={opacity:1,group:{visible:true}};
 for(let i=0;i<60;i++){
  gate.prepared(true);suspendSignalLink(edge,gate.active);
  assert.equal(stepSignalLinkPresence(edge,1/60),true);
  assert.equal(edge.opacity,1);assert.equal(edge.group.visible,true);
 }
});
test('replacement and exchanging route roles reconnect; merely opening a selector does not',()=>{
 const before={channel:'blog-0',comments:'blog-1'};
 assert.equal(changesExistingRoute(before,{...before}),false);
 assert.equal(changesExistingRoute(before,{channel:'blog-1',comments:'blog-0'}),true);
 assert.equal(changesExistingRoute(before,{channel:'blog-0',statistics:'blog-1'}),true);
});
test('reconnection survives the first unprepared layout and reappears after settling; zones are independent',()=>{
 const a=new RouteReconnect(),b=new RouteReconnect();a.begin();
 a.prepared(false);assert.equal(a.active,true);
 a.prepared(true);assert.equal(a.active,true);assert.equal(b.active,false);
 a.prepared(false);assert.equal(a.active,false);
 a.begin();a.prepared(false);a.begin();a.prepared(false);assert.equal(a.active,true);
 a.prepared(false);assert.equal(a.active,false);
});
