$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$base=$PSScriptRoot;$plan=Get-Content "$base/plan.json" -Raw -Encoding UTF8|ConvertFrom-Json
$release=[IO.Path]::GetFullPath($plan.release);$before=Get-Content "$base/preflight.json" -Raw -Encoding UTF8|ConvertFrom-Json
$names=@($before.apps|ForEach-Object {$_.name})
$backup="$base/backup";$applied=@();$stopped=@();$results=@();$changedTasks=@()
function Status($phase,$extra){@{phase=$phase;patch=$plan.id;computer=$env:COMPUTERNAME;time=[DateTime]::UtcNow.ToString('o');details=$extra}|ConvertTo-Json -Depth 16|Set-Content "$base/rollback-status.json" -Encoding UTF8}
function Target($relative){if($relative -notmatch '^apps/(max-game|stela)/(launcher/|www/)' -and $relative -notin @('apps/stela/Start-Recorded.bat','apps/stela/Start-Generated.bat','apps/stela/Start-Touch-Recorded.bat','apps/stela/Start-Touch-Only-Recorded.bat')){throw 'Patch path outside application code'};$p=[IO.Path]::GetFullPath((Join-Path $release $relative));if(-not $p.StartsWith($release+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Unsafe patch target'};return $p}
function Health($name){$port=if($name -eq 'stela'){18751}else{18752};try{return Invoke-RestMethod "http://127.0.0.1:$port/__kdw/health" -TimeoutSec 2}catch{return $null}}
function StopApp($name){if((Health $name) -or (Test-Path "$release/apps/$name/data/supervisor.json")){& powershell.exe -NoProfile -File "$release/apps/$name/launcher/Control.ps1" -Action Stop|Out-Null;if($LASTEXITCODE -ne 0){throw "Failed to stop $name"}}}
function StartApp($item){
 $args=@('-NoProfile','-ExecutionPolicy','Bypass','-File',"$release/apps/$($item.name)/launcher/Launch.ps1")
 if($item.serveOnly -or -not $item.pid){$args+='-NoWindow'}
 $p=Start-Process powershell.exe -WindowStyle Hidden -PassThru -ArgumentList $args -RedirectStandardOutput "$base/start-$($item.name).out.log" -RedirectStandardError "$base/start-$($item.name).err.log"
 $null=$p.Handle;if(-not $p.WaitForExit(45000)){throw 'Startup deadline exceeded'};if($p.ExitCode -ne 0){throw "Startup failed: $($item.name)"}
}
function PreservePins {
 $pins=@{}
 foreach($name in $names){
  foreach($relative in @('app.json','settings/stand.json','data/lidar.local.json','data/layout.local.json','data/layout-profiles.local.json','data/calibration-targets.local.json','data/lan-admin/config.json','data/lan-admin/server.pfx','data/operator.local.json','data/display.local.json','data/display-filters.local.json','data/soundtrack.local.json','data/sound-events.local.json','data/omni.local.json','data/narration-mode.local.json','data/audio.local.json','data/audio-profile.json','data/game-link.local.json','data/game-link-network.local.json')){
   $f="$release/apps/$name/$relative";if(Test-Path -LiteralPath $f){$pins["$name/$relative"]=(Get-FileHash -LiteralPath $f).Hash}
  }
 };return $pins
}
function RestoreInput($item){
 if($item.name -ne 'max-game' -or -not $item.armed -or $item.serveOnly -or -not $item.pid){return}
 $deadline=[DateTime]::UtcNow.AddSeconds(35);$o=$null
 do {try{$o=(Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/operator/state' -TimeoutSec 3).output}catch{};if($o.backgroundReady -and $o.contentReady -and -not $o.calibration){break};Start-Sleep -Milliseconds 250}while([DateTime]::UtcNow -lt $deadline)
 if(-not $o.backgroundReady -or -not $o.contentReady -or $o.calibration){throw 'MAX input restore: output not ready'}
 Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:18752/__kdw/operator/arm' -ContentType 'application/json' -Headers @{Origin='http://127.0.0.1:18752'} -Body '{"armed":true}' -TimeoutSec 4|Out-Null
 $deadline=[DateTime]::UtcNow.AddSeconds(8)
 do {Start-Sleep -Milliseconds 250;$o=(Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/operator/state' -TimeoutSec 3).output;if($o.armed -and $o.active){return}}while([DateTime]::UtcNow -lt $deadline)
 throw 'MAX input restore not confirmed'
}
try{
 if($env:COMPUTERNAME -ne 'DESKTOP-64J4BMN'){throw 'WRONG_HOST'}
 if(-not(Test-Path "$base/applied.json")){throw 'PATCH_NOT_INSTALLED'}
 foreach($name in $names){$m=Get-Content "$release/apps/$name/release-manifest.json" -Raw|ConvertFrom-Json;if($m.localPatch.id -ne $plan.id){throw 'NEWER_PATCH_PRESENT'}}
 foreach($f in $plan.files){
  $target=Target $f.path;$old=Join-Path $backup $f.path
  if((Get-FileHash -LiteralPath $target).Hash.ToLowerInvariant() -ne $f.sha256){throw 'LIVE_FILES_CHANGED'}
  if(-not $f.before -or (Get-FileHash -LiteralPath $old).Hash.ToLowerInvariant() -ne $f.before){throw 'BACKUP_MISMATCH'}
 }
 Status 'restoring' @{}
 foreach($item in $before.apps){StopApp $item.name}
 foreach($f in $plan.files){Copy-Item -LiteralPath (Join-Path $backup $f.path) -Destination (Target $f.path) -Force}
 # Old validator does not know keyboard. Preserve the full new configuration,
 # then remove only this optional field; all other operator settings stay intact.
 $saved="$base/rollback-settings";New-Item -ItemType Directory -Force $saved|Out-Null
 foreach($relative in @('layout.local.json','layout-profiles.local.json')){
  $file="$release/apps/max-game/data/$relative"
  if(Test-Path -LiteralPath $file){
   Copy-Item -LiteralPath $file -Destination "$saved/$relative" -Force
   $value=Get-Content -LiteralPath $file -Raw -Encoding UTF8|ConvertFrom-Json
   if($relative -eq 'layout.local.json'){$value.PSObject.Properties.Remove('keyboard')}
   else{foreach($p in $value.profiles){$p.value.PSObject.Properties.Remove('keyboard')}}
   [IO.File]::WriteAllText($file,($value|ConvertTo-Json -Depth 30),[Text.UTF8Encoding]::new($false))
  }
 }
 foreach($name in $names){Copy-Item -LiteralPath "$backup/$name-release-manifest.json" -Destination "$release/apps/$name/release-manifest.json" -Force}
 foreach($item in $before.apps){StartApp $item;RestoreInput $item}
 foreach($f in $plan.files){if((Get-FileHash -LiteralPath (Target $f.path)).Hash.ToLowerInvariant() -ne $f.before){throw 'RESTORED_HASH_MISMATCH'}}
 Status 'complete' @{restoredFiles=$plan.files.Count;settingsBackup=$saved}
}catch{Status 'failed' @{error=$_.Exception.Message};exit 1}
