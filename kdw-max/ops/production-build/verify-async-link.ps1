$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1'
$folder='C:/KDW-Stand/deploy/ASYNC-STELA-20261027-2'
$source=@'
const fs=require('node:fs');
const root='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps';
const {pinnedFetch}=require(root+'/stela/launcher/game-link-network.cjs');
(async()=>{
 const c=JSON.parse(fs.readFileSync(root+'/stela/data/game-link.local.json','utf8'));
 const headers={'x-kdw-relay-key':c.key},remote={};
 for(const endpoint of ['capabilities','readiness']){const response=await pinnedFetch(c.gameOrigin+'/__kdw/link/v2/'+endpoint,{headers,signal:AbortSignal.timeout(4000)},c.certificatePem);if(!response.ok)throw Error('REMOTE_'+response.status);remote[endpoint]=await response.json();}
 if(remote.capabilities.protocolVersion!==2)throw Error('PROTOCOL_MISMATCH');
 const start=performance.now(),settings=await fetch('http://127.0.0.1:18751/__kdw/settings',{signal:AbortSignal.timeout(3000)}).then(r=>r.json());
 console.log(JSON.stringify({protocol:2,pinnedTls:!!c.certificatePem,remote,localSettings:{source:settings.source,elapsedMs:Math.round(performance.now()-start),production:settings.production}}));
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});
'@
[IO.File]::WriteAllText("$folder/verify-link.cjs",$source,[Text.UTF8Encoding]::new($false))
$runtime="$release/runtime/electron/electron.exe"
$env:ELECTRON_RUN_AS_NODE='1'
try{
 $p=Start-Process -FilePath $runtime -ArgumentList "$folder/verify-link.cjs" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$folder/verify-link.out.json" -RedirectStandardError "$folder/verify-link.err.txt"
 $null=$p.Handle;if(-not $p.WaitForExit(15000)){throw 'Link verification deadline exceeded'}
 if($p.ExitCode -ne 0){throw (Get-Content "$folder/verify-link.err.txt" -Raw)}
 Get-Content "$folder/verify-link.out.json" -Raw
}finally{Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue}
