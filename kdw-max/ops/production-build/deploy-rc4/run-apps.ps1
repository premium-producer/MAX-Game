param([string]$Device,[ValidateSet('verify','start','probe')][string]$Mode='verify')
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1';$base='C:/KDW-Stand/deploy/RC4-1'
function Status($phase,$results){@{phase=$phase;mode=$Mode;device=$Device;results=$results;time=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Depth 12|Set-Content "$base/$Mode-status.json" -Encoding UTF8}
function LidarPin {if(Test-Path "$release/apps/max-game/data/lidar.local.json"){return (Get-FileHash "$release/apps/max-game/data/lidar.local.json").Hash};return 'absent'}
function Launch($name,$extra){
 $args=@('-NoProfile','-ExecutionPolicy','Bypass','-File',"$release/apps/$name/launcher/Launch.ps1")+$extra
 $p=Start-Process powershell.exe -WindowStyle Hidden -PassThru -ArgumentList $args -RedirectStandardOutput "$base/$Mode-$name.out.log" -RedirectStandardError "$base/$Mode-$name.err.log"
 $null=$p.Handle;$p.WaitForExit();if($p.ExitCode -ne 0){throw "App $name $Mode failed: $($p.ExitCode)"}
}
try{
 if((Get-Content "$base/install-status.json" -Raw|ConvertFrom-Json).phase -ne 'installed-verified'){throw 'Installation not verified'}
 $results=@()
 if($Mode -eq 'verify'){
  foreach($name in @('max-game','stela')){Status ('verifying-'+$name) $results;Launch $name @('-Verify');$results+=Get-Content "$release/apps/$name/data/verification.json" -Raw -Encoding UTF8|ConvertFrom-Json}
 }elseif($Mode -eq 'start'){
  # Admin services first; MAX's normal launch then tests serve-only -> Spout promotion.
  foreach($name in @('max-game','stela')){Launch $name @('-NoWindow')}
  if($Device -ne 'stella'){
   Launch 'max-game' @();$deadline=[DateTime]::UtcNow.AddSeconds(60)
   do{Start-Sleep -Milliseconds 500;try{$state=Invoke-RestMethod http://127.0.0.1:18752/__kdw/operator/state}catch{$state=$null}}while((-not $state.output.contentReady -or -not $state.output.backgroundReady) -and [DateTime]::UtcNow -lt $deadline)
   if(-not $state.output.contentReady -or -not $state.output.backgroundReady){throw 'Spout not ready after promotion'}
  }
  foreach($name in @('max-game','stela')){$port=if($name -eq 'stela'){18751}else{18752};$h=Invoke-RestMethod "http://127.0.0.1:$port/__kdw/health";$results+=@{application=$h.application;pid=$h.pid;version=$h.version}}
 }else{
  $m=Invoke-RestMethod http://127.0.0.1:18752/__kdw/operator/state;$s=Invoke-RestMethod http://127.0.0.1:18751/__kdw/operator/state
  $results+=@{stellaRenderer=$s.renderer;soundFiles=$s.bank.assets.Count;displayCount=$s.displays.Count;stellaBusy=$s.busy;stellaPanel=(Invoke-WebRequest http://127.0.0.1:18751/stella/admin/ -UseBasicParsing).StatusCode;maxPanel=(Invoke-WebRequest http://127.0.0.1:18752/admin/ -UseBasicParsing).StatusCode;output=$m.output}
  if($Device -ne 'stella'){
   if($m.output.armed){throw 'Do not interrupt armed output'}
   $headers=@{Origin='http://127.0.0.1:18752'}
   $before=LidarPin
   try{
    $c=Invoke-RestMethod http://127.0.0.1:18752/__kdw/operator/calibration/start -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'
    if(-not $c.output.calibration -or -not $c.output.lidar.bound -or $c.output.active){throw 'Calibration did not safely open receiver'}
    $results+=@{calibrationStarted=$true;target=$c.output.calibration.target;inputBlocked=(-not $c.output.active)}
   }finally{$c=Invoke-RestMethod http://127.0.0.1:18752/__kdw/operator/calibration/cancel -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'}
   if($before -ne (LidarPin) -or $c.output.armed -or $c.output.calibration){throw 'Cancel failed to preserve calibration/disarm'}
   $results+=@{calibrationCancelled=$true;calibrationFilePreserved=$true;armed=$c.output.armed}
   $receiver=Start-Process -FilePath "$release/tools/kdw_spout_receiver.exe" -ArgumentList @("$base/receiver",'15','headless') -WindowStyle Hidden -PassThru
   $null=$receiver.Handle;$receiver.WaitForExit();if($receiver.ExitCode -ne 0){throw 'Independent Spout receiver failed'}
   $results+=Get-Content "$base/receiver/receiver-summary.json" -Raw|ConvertFrom-Json
  }
 }
 Status 'complete' $results
}catch{Status ('failed: '+$_.Exception.Message+'; '+$_.ScriptStackTrace) @();exit 1}
