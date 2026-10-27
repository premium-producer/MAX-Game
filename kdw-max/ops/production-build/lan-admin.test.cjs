const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {allowedPath,privateIP,createLanAdmin}=require('../../apps/STARTUP/tools/lan-admin.cjs');
test('LAN ingress only accepts local network addresses and operator resources',()=>{
 for(const ip of ['10.0.0.13','192.168.1.5','172.16.1.1','172.31.255.2','127.0.0.1','::ffff:10.0.0.12'])assert.equal(privateIP(ip),true,ip);
 for(const ip of ['8.8.8.8','172.32.1.1','192.169.1.1','10.0.0.13.evil','not-an-ip','::'])assert.equal(privateIP(ip),false,ip);
 for(const route of ['/__kdw/voice/session','/__kdw/link/active','/__kdw/link/ingest','/__kdw/stop','/data/omni.local.json'])assert.equal(allowedPath('stela',route,'POST'),false,route);
 assert.equal(allowedPath('max','/config/client-webgl.json','GET'),true);assert.equal(allowedPath('max','/__kdw/layout/save','POST'),true);assert.equal(allowedPath('stela','/__kdw/audio/config','POST'),true);assert.equal(allowedPath('stela','/__kdw/audio/session','POST'),false);assert.equal(allowedPath('max','/assets/foo.svg','POST'),false);
});
test('LAN is disabled until configured; invalid certificate does not fail the game API',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lan-admin-config-'));try{let g=createLanAdmin({root,port:18000,app:'max'});await g.listen();assert.equal(g.state().enabled,false);await g.close();const dir=path.join(root,'data/lan-admin');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'config.json'),JSON.stringify({enabled:true,passphrase:'test-password-only'}));fs.writeFileSync(path.join(dir,'server.pfx'),'invalid');g=createLanAdmin({root,port:18000,app:'max'});await g.listen();assert.equal(g.state().enabled,false);assert.ok(g.state().error);await g.close();}finally{fs.rmSync(root,{recursive:true,force:true});}
});
