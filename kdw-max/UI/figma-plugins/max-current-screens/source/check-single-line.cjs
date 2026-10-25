const assert=require('assert/strict'),fs=require('fs');
module.exports=async function(win,report){
 const js=s=>win.webContents.executeJavaScript(s),sel='[data-pc-field="reply"]';
 const before=await js(`(()=>{const e=document.querySelector('${sel}');e.focus();return {value:e.value,height:e.getBoundingClientRect().height,top:e.getBoundingClientRect().top}})()`);
 const fill=async text=>{await js(`(()=>{const e=document.querySelector('${sel}');e.focus();e.select()})()`);await win.webContents.insertText(text);};
 const read=()=>js(`(()=>{const e=document.querySelector('${sel}');return {tag:e.tagName,type:e.type,value:e.value,height:e.getBoundingClientRect().height,top:e.getBoundingClientRect().top,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,whiteSpace:getComputedStyle(e).whiteSpace}})()`);
 const states=[];
 try{
  await fill('Спасибо за вопрос! Премьера уже завтра. '.repeat(8));
  states.push(await read());assert.equal(states[0].value.length,200);
  await fill('Первая строка\r\nВторая строка\nТретья строка');
  states.push(await read());assert.ok(!/[\r\n]/.test(states[1].value));
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});
  states.push(await read());assert.equal(states[2].value,states[1].value);
  await fill('Привет ');
  const key=await js(`(()=>{const e=document.querySelector('#kdw-personal-channel [data-pc-key="а"]');if(!e)return false;e.click();return true})()`);assert.ok(key);
  states.push(await read());assert.equal(states[3].value.length,8);
  for(const s of states){assert.equal(s.tag,'INPUT');assert.equal(s.type,'text');assert.equal(s.height,before.height);assert.equal(s.top,before.top);assert.equal(s.whiteSpace,'nowrap');assert.ok(s.scrollHeight<=s.clientHeight);assert.ok(!/[\r\n]/.test(s.value));}
  fs.writeFileSync(report+'/single-line-checks.json',JSON.stringify({passed:true,checks:['long input limited to 200','multiline insertion cannot create lines','physical Enter cannot add a line','virtual keyboard inserts into same input','constant height and no vertical overflow'],states},null,2));
 }finally{await fill(before.value);await js(`document.querySelector('${sel}').setSelectionRange(0,0)`);}
};
