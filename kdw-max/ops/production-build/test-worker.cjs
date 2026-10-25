const path=require('node:path');
const [role,moduleRoot,root,port]=process.argv.slice(2);
const host=require(path.join(moduleRoot,'launcher/portable-server.cjs')).createPortableServer({root,config:{id:role,version:'production-verification',port:Number(port),entry:'/'},voiceOptions:{configLoader:()=>null}});
host.listen().then(()=>process.stdout.write('READY\n')).catch(e=>{process.stderr.write(e.code||'START_FAILED');process.exit(1);});
let closing=false;for(const event of ['SIGTERM','SIGINT'])process.on(event,()=>{if(closing)return;closing=true;host.close().then(()=>process.exit());});
