const fs=require('node:fs'),path=require('node:path');
const kit=path.resolve(__dirname,'..'),configFile=path.join(kit,'stela/data/game-link.local.json');
if(!fs.existsSync(configFile)){console.error('Run Configure-Link.bat and enter the MAX computer IPv4 address.');process.exitCode=1;}
else{const c=JSON.parse(fs.readFileSync(configFile)),{pinnedFetch}=require('../stela/launcher/game-link-network.cjs');
 pinnedFetch(c.gameOrigin+'/__kdw/link/status',{headers:{'x-kdw-relay-key':c.key},signal:AbortSignal.timeout(7000)},c.certificatePem).then(async r=>{const value=await r.json();if(!r.ok||value.application!=='kdw-max-link')throw Error('PAIR_NOT_ACCEPTED');console.log('OK: encrypted connection and pairing verified.');}).catch(()=>{console.error('No verified connection. Check MAX, the IP address, Private network and the firewall rule.');process.exitCode=1;});}
