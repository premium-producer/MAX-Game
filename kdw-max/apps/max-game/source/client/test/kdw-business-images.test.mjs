import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {BUSINESS_CARD_IMAGES,preloadBusinessImages} from '../src/kdw-business-images.mjs';
import {postBank} from '../src/kdw-posts-model.mjs';
import {storeBank} from '../src/kdw-store-rating.mjs';
test('all sixty current cards have distinct, intact photographic assets; legacy banks stay unchanged',()=>{
 const cards=['cafe','flowers','auto'].flatMap(type=>[...postBank(type,12),...storeBank(type,7)]);
 assert.equal(cards.length,60);assert.equal(Object.keys(BUSINESS_CARD_IMAGES).length,60);
 const hashes=new Set();
 for(const card of cards){
  const a=card.image;assert.ok(a,card.id);assert.ok(a.path.endsWith('/'+card.id+'.webp'));
  const bytes=fs.readFileSync(new URL('../public/'+a.path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(a.width>=900&&a.height>=600);assert.ok(!hashes.has(a.sha256),card.id);hashes.add(a.sha256);
 }
 for(const type of ['cafe','flowers','auto']){
  assert.ok(postBank(type,11).every(p=>!p.image));assert.ok(storeBank(type,6).every(p=>!p.image));
 }
});
test('image preload shares decoding and allows retry after failure',async()=>{
 const old=globalThis.Image;let count=0,fail=true;
 globalThis.Image=class{constructor(){count++;}decode(){return fail?Promise.reject(Error('offline')):Promise.resolve();}};
 try{
  const card={image:{path:'assets/test-retry.webp'}};
  await assert.rejects(preloadBusinessImages([card]));fail=false;
  await Promise.all([preloadBusinessImages([card]),preloadBusinessImages([card])]);assert.equal(count,2);
  await preloadBusinessImages([card]);assert.equal(count,2);
 }finally{globalThis.Image=old;}
});
