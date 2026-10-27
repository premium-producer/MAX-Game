import test from 'node:test';import assert from 'node:assert/strict';
test('assignment changes coalesce into one live transition and never reload the document',async()=>{
 const saved=globalThis.location;let reloads=0,calls=0,finish;globalThis.location={reload:()=>reloads++};
 try{const {transitionReload,installSceneTransition}=await import('../src/kdw-standby-cover.mjs?live-spec');const stop=installSceneTransition(()=>{calls++;return new Promise(r=>finish=r);});const a=transitionReload(),b=transitionReload();assert.equal(a,b);await Promise.resolve();assert.equal(calls,1);finish();await a;assert.equal(reloads,0);stop();}finally{globalThis.location=saved;}
});
test('preparation markers remain hidden and cannot mount or intercept a loading screen',async()=>{
 const saved=globalThis.document;const marker={hidden:false};globalThis.document={getElementById:()=>marker};
 try{const {showStandbyCover,dismissStandbyCover,STANDBY_COVER_CSS}=await import('../src/kdw-standby-cover.mjs?hidden-spec');showStandbyCover();assert.equal(marker.hidden,true);dismissStandbyCover();assert.equal(marker.hidden,true);assert.ok(STANDBY_COVER_CSS.includes('display:none!important'));assert.ok(STANDBY_COVER_CSS.includes('pointer-events:none!important'));}finally{globalThis.document=saved;}
});
