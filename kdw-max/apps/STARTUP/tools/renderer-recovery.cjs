// Bounded recovery for Electron; no input, profile or visitor state is reset.
function attachRendererRecovery({window,entry,log=()=>{},now=()=>Date.now(),schedule=setTimeout,cancel=clearTimeout}){
 let failures=[],timer=null,closed=false;
 const retry=()=>{
  if(closed)return;
  failures=failures.filter(at=>now()-at<300000);failures.push(now());
  log({event:'renderer-recovery',attempt:failures.length});
  if(timer)cancel(timer);
  if(failures.length<=3){timer=schedule(()=>{timer=null;if(!closed)void window.loadURL(entry).catch(retry);},1000*failures.length);return;}
  const html='<html lang="ru"><meta charset="utf-8"><body style="margin:0;background:#10091e;color:white;font:28px Arial;display:grid;place-content:center;height:100vh;text-align:center"><p>Не удалось восстановить игровой экран.</p><p>Ваша миссия сохранена.</p><a style="color:white;padding:24px;background:#2679ff;border-radius:20px" href="'+entry.replaceAll('&','&amp;').replaceAll('"','&quot;')+'">Повторить запуск</a></body></html>';
  void window.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html)).catch(()=>{});window.show();
 };
 const navigation=(_event,url)=>{if(url===entry&&failures.length>3)failures=[];};
 window.webContents.on('render-process-gone',retry);
 window.on('unresponsive',retry);
 window.webContents.on('will-navigate',navigation);
 window.on('closed',()=>{closed=true;if(timer)cancel(timer);});
 return {retry};
}
module.exports={attachRendererRecovery};
