import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeviceVideo} from '../src/journey-v5-video-source.mjs';

class Media extends EventTarget{
 style={};readyState=0;videoWidth=1920;videoHeight=1080;paused=true;seeks=0;
 set currentTime(value){this.seeks++;this.readyState=1;}
 setAttribute(){} removeAttribute(){} load(){} remove(){} pause(){this.paused=true;}
 play(){this.paused=false;return Promise.resolve();}
}
test('first decoded video frame is not invalidated by an unnecessary seek before GPU preparation',async()=>{
 const element=new Media(),document={createElement:()=>element},asset={width:1920,height:1080,path:'video.mp4',sha256:'test'};
 const video=createDeviceVideo(document,asset);
 element.readyState=2;element.dispatchEvent(new Event('loadeddata'));await video.ready;
 assert.equal(element.seeks,0);assert.equal(element.readyState,2);
 video.setPlaying(true);await new Promise(r=>setImmediate(r));assert.equal(video.readyForAck(true),true);
 video.dispose();assert.equal(element.paused,true);
});
