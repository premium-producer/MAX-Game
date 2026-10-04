import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateFlowDocument} from '../src/asset-audit/flow-document.mjs';
import {mergeFlowDocuments} from '../src/asset-audit/collaboration.mjs';
import {acknowledgeSave,undoLocalEdit,recoveryKey,pollReceiptIsCurrent} from '../src/asset-audit/collaboration-client.mjs';

const hash='a'.repeat(64);
const source=id=>({screenId:id,assetId:'asset-'+id,asset:{width:100,height:200,sha256:hash},instruction:'Help',automaticMs:null,actions:[{actionId:id+'.go',label:'Next',placement:'hotspot',rect:[2,3,20,25],outcome:{kind:'complete-task'}}]});
const catalog={contentRevision:'test',missions:[{missionId:'m',tasks:[{taskId:'t',startScreenId:'a',screens:[source('a'),source('b')]}]}]};
const fixture=()=>migrateFlowDocument({schemaVersion:2,contentRevision:'test',records:[],screens:[]},catalog);
const screen=(d,index=0)=>d.tasks[0].screens[index];
const action=(d,index=0)=>screen(d,index).interactions[0];
const copy=structuredClone;

test('receipt retains typing made during request and incorporates teammate edits',()=>{
 const sent=fixture();action(sent).name='First';
 const current=copy(sent);action(current).name='First plus typing';
 const acknowledged=copy(sent);screen(acknowledged,1).help={mode:'override',text:'Teammate help'};
 const result=acknowledgeSave(sent,current,acknowledged);
 assert.equal(result.dirty,true);assert.deepEqual(result.conflicts,[]);
 assert.equal(action(result.document).name,'First plus typing');assert.equal(screen(result.document,1).help.text,'Teammate help');
 assert.equal(action(sent).name,'First');
});

test('lost acknowledgement retry already applied is clean',()=>{
 const sent=fixture(),remote=copy(sent);screen(remote,1).help.text='Remote';
 const result=acknowledgeSave(sent,sent,remote);assert.equal(result.dirty,false);assert.deepEqual(result.document,remote);
});

test('undo reverses only one local edit while preserving remote and later local changes',()=>{
 const before=fixture(),after=copy(before);action(after).rect=[10,20,20,25];
 const current=copy(after);screen(current,1).help.text='Remote text';current.missions[0].helpText='Later local edit';
 const result=undoLocalEdit({before,after},current);
 assert.deepEqual(result.conflicts,[]);assert.deepEqual(action(result.document).rect,action(before).rect);
 assert.equal(screen(result.document,1).help.text,'Remote text');assert.equal(result.document.missions[0].helpText,'Later local edit');
});

test('undo does not silently overwrite a newer teammate edit on the same action',()=>{
 const before=fixture(),after=copy(before);action(after).name='Mine';
 const current=copy(after);action(current).name='Teammate';
 const result=undoLocalEdit({before,after},current);assert.equal(result.conflicts.length,1);
 const accepted=undoLocalEdit({before,after},current,{resolution:'remote'});assert.equal(action(accepted.document).name,'Teammate');
});

test('accept shared conflicts retains other unsaved local changes and all remote changes',()=>{
 const base=fixture(),local=copy(base),remote=copy(base);
 action(local).name='Mine';action(remote).name='Theirs';local.missions[0].helpText='Mine independent';screen(remote,1).help.text='Theirs independent';
 const result=mergeFlowDocuments(base,local,remote,{resolution:'remote'});
 assert.equal(action(result.document).name,'Theirs');assert.equal(result.document.missions[0].helpText,'Mine independent');assert.equal(screen(result.document,1).help.text,'Theirs independent');
});

test('a slow poll cannot regress a newer acknowledged revision',()=>{
 assert.equal(pollReceiptIsCurrent('R1','R2'),false);assert.equal(pollReceiptIsCurrent('R1','R1'),true);
});

test('different tabs cannot overwrite each other recovery keys',()=>{
 assert.notEqual(recoveryKey('catalog','tab-a'),recoveryKey('catalog','tab-b'));
 assert.equal(recoveryKey('catalog','tab-a'),recoveryKey('catalog','tab-a'));
 assert.notEqual(recoveryKey('catalog-2','tab-a'),recoveryKey('catalog','tab-a'));
});
