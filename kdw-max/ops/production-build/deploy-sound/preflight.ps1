$release=$plan.release
$base='C:/KDW-Stand/deploy/'+$plan.id
$names=if($plan.applications){@($plan.applications)}else{@('max-game','stela')}
$apps=@()
foreach($name in $names){
 $root="$release/apps/$name";$port=if($name -eq 'stela'){18751}else{18752}
 $profile=Get-Content "$root/app.json" -Raw|ConvertFrom-Json
 try{$health=Invoke-RestMethod "http://127.0.0.1:$port/__kdw/health" -TimeoutSec 3}catch{
  $owned=@(Get-CimInstance Win32_Process -Filter "Name='electron.exe'"|Where-Object {$_.CommandLine -and $_.CommandLine.Replace('\','/') -like "*$release/apps/$name/launcher/desktop-main.cjs*"})
  if($owned.Count){throw "Unresponsive owned $name process; refusing to overwrite running files"}
  if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue){throw "Unidentified service on port $port"}
  $apps+=@{name=$name;version=$profile.version;pid=$null;running=$false;serveOnly=$true;profileSha=(Get-FileHash "$root/app.json").Hash};continue
 }
 $runtime=Get-Content "$root/data/runtime.json" -Raw|ConvertFrom-Json
 if($runtime.pid -ne $health.pid -or $runtime.instanceKey -ne $health.instanceKey -or $profile.id -ne $health.application){throw 'Running application identity mismatch'}
 $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($health.pid)"
 if($process.CommandLine.Replace('\','/') -notlike "*$release/apps/$name/launcher/desktop-main.cjs*"){throw 'Unexpected running application directory'}
 $state=Invoke-RestMethod "http://127.0.0.1:$port/__kdw/operator/state" -TimeoutSec 4
 if(-not $plan.interruptVisitors -and $name -eq 'stela' -and $state.busy){throw 'Stella conversation or VST is busy'}
 $apps+=@{name=$name;version=$health.version;pid=$health.pid;running=$true;serveOnly=$(if($health.runtime){-not $health.runtime.outputEnabled}else{$process.CommandLine -match '--serve-only'});armed=$state.output.armed;profileSha=(Get-FileHash "$root/app.json").Hash}
}
$active="$release/apps/max-game/data/link/active.json"
if(-not $plan.interruptVisitors -and (Test-Path $active)){$pointer=Get-Content $active -Raw|ConvertFrom-Json;if($pointer.gameId){throw 'Active visitor assignment: wait before update'}}
$hashes=@{}
foreach($f in $plan.files){$p=Join-Path $release $f.path;$actual=if(Test-Path -LiteralPath $p){(Get-FileHash -LiteralPath $p).Hash.ToLowerInvariant()}else{$null};if($actual -ne $f.before -and $actual -ne $f.sha256){throw ('Unexpected base file: '+$f.path)};$hashes[$f.path]=$actual}
$user=(Get-CimInstance Win32_ComputerSystem).UserName;if(-not $user){throw 'No interactive desktop user'}
New-Item -ItemType Directory -Force $base|Out-Null
$result=@{computer=$env:COMPUTERNAME;release=$release;apps=$apps;hashes=$hashes;freeBytes=(Get-PSDrive C).Free;ready=$true}
$result|ConvertTo-Json -Depth 12|Set-Content "$base/preflight.json" -Encoding UTF8
$result|ConvertTo-Json -Depth 12 -Compress
