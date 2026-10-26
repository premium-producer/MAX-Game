// Real launchers and built assets, isolated from all operator data and credentials.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-browser-fixtures-'));
const {DEFAULTS}=require('../../apps/STARTUP/tools/stand-settings.cjs');
const hosts=[];
(async()=>{for(const [app,port]of [['max-game',18782],['stela',18781]]){
 const fixture=path.join(temp,app);fs.mkdirSync(fixture,{recursive:true});fs.symlinkSync(path.join(root,'apps',app,'www'),path.join(fixture,'www'),process.platform==='win32'?'junction':'dir');
 const config={...JSON.parse(fs.readFileSync(path.join(root,'apps',app,'app.json'))),port};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
 if(app==='max-game'){fs.mkdirSync(path.join(fixture,'settings'));fs.writeFileSync(path.join(fixture,'settings/stand.json'),JSON.stringify({...DEFAULTS,max:{...DEFAULTS.max,entryMode:'combined'}}));}
 const {createPortableServer}=require(path.join(root,'apps',app,'launcher/portable-server.cjs'));
 const host=createPortableServer({root:fixture,config});await host.listen();hosts.push(host);
 }
 console.log(JSON.stringify({ready:true,max:'http://127.0.0.1:18782',stela:'http://127.0.0.1:18781',fixture:temp}));
})().catch(e=>{console.error(e);process.exitCode=1;});
async function close(){for(const host of hosts)await host.close();fs.rmSync(temp,{recursive:true,force:true});process.exit();}
process.on('SIGTERM',close);process.on('SIGINT',close);
