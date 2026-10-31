import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {v5QrAsset,v5QrFinaleEligible} from '../src/journey-v5-qr-finale.mjs';
test('final QR selection uses the supplied business code only in business, including early finishes',()=>{
 const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))));
 for(const [id,mission]of Object.entries(catalog.missions)){
  const asset=catalog.assets[mission.qr.assetId],qr={...mission.qr,asset};
  assert.equal(v5QrAsset(catalog,qr),asset);assert.equal(asset.path,`assets/kdw-native/final-qr/${id==='business'?'business':'download'}.svg`);
  const bytes=fs.readFileSync(new URL('../public/'+asset.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(asset.mimeType,'image/svg+xml');
  for(const status of ['completed','incomplete','expired'])assert.equal(v5QrFinaleEligible({state:{status},view:{qr}}),true);
 }
});
