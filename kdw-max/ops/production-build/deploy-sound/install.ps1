$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$base=$PSScriptRoot;$plan=Get-Content "$base/plan.json" -Raw -Encoding UTF8|ConvertFrom-Json
$release=[IO.Path]::GetFullPath($plan.release);$before=Get-Content "$base/preflight.json" -Raw -Encoding UTF8|ConvertFrom-Json
$names=@($before.apps|ForEach-Object {$_.name})
$backup="$base/backup";$applied=@();$stopped=@();$results=@();$changedTasks=@()
function Status($phase,$extra){@{phase=$phase;patch=$plan.id;computer=$env:COMPUTERNAME;time=[DateTime]::UtcNow.ToString('o');details=$extra}|ConvertTo-Json -Depth 16|Set-Content "$base/status.json" -Encoding UTF8}
function Target($relative){if($relative -notmatch '^apps/(max-game|stela)/(launcher/|www/)' -and $relative -notin @('apps/stela/Start-Recorded.bat','apps/stela/Start-Generated.bat','apps/stela/Start-Touch-Recorded.bat','apps/stela/Start-Touch-Only-Recorded.bat','apps/stela/Start-Display-Only.bat')){throw 'Patch path outside application code'};$p=[IO.Path]::GetFullPath((Join-Path $release $relative));if(-not $p.StartsWith($release+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Unsafe patch target'};return $p}
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
 if(Test-Path "$base/applied.json"){throw 'Patch already applied; use existing report'}
 if(Test-Path $backup){throw 'Backup already exists; inspect previous attempt before retry'}
 Status 'validating' @{}
 $active="$release/apps/max-game/data/link/active.json"
 if(-not $plan.interruptVisitors -and (Test-Path $active) -and (Get-Content $active -Raw|ConvertFrom-Json).gameId){throw 'Active visitor assignment: update deferred'}
 if(-not $plan.interruptVisitors -and ($names -contains 'stela') -and (Health 'stela')){$s=Invoke-RestMethod http://127.0.0.1:18751/__kdw/operator/state -TimeoutSec 3;if($s.busy){throw 'Stella busy: update deferred'}}
 foreach($f in $plan.files){
  $target=Target $f.path;$actual=if(Test-Path -LiteralPath $target){(Get-FileHash -LiteralPath $target).Hash.ToLowerInvariant()}else{$null}
  if($actual -ne $f.before){throw ('Base changed since preflight: '+$f.path)}
  if((Get-FileHash -LiteralPath (Join-Path "$base/payload" $f.path)).Hash.ToLowerInvariant() -ne $f.sha256){throw 'Payload hash mismatch'}
 }
 $pins=PreservePins
 New-Item -ItemType Directory -Force $backup|Out-Null
 foreach($f in $plan.files){$p=Target $f.path;if(Test-Path -LiteralPath $p){$b=Join-Path $backup $f.path;New-Item -ItemType Directory -Force (Split-Path $b)|Out-Null;Copy-Item -LiteralPath $p -Destination $b}}
 foreach($name in $names){Copy-Item -LiteralPath "$release/apps/$name/release-manifest.json" -Destination "$backup/$name-release-manifest.json"}
 Status 'installing' @{files=$plan.files.Count}
 foreach($item in $before.apps){StopApp $item.name;$stopped+=$item}
 foreach($f in $plan.files){$p=Target $f.path;New-Item -ItemType Directory -Force (Split-Path $p)|Out-Null;$applied+=$f;Copy-Item -LiteralPath (Join-Path "$base/payload" $f.path) -Destination $p -Force;if((Get-FileHash -LiteralPath $p).Hash.ToLowerInvariant() -ne $f.sha256){throw 'Installed file hash mismatch'}}
 foreach($name in $names){
  $mfile="$release/apps/$name/release-manifest.json";$manifest=Get-Content $mfile -Raw -Encoding UTF8|ConvertFrom-Json
  foreach($f in $plan.files|Where-Object {$_.path.StartsWith("apps/$name/")}){$relative=$f.path.Substring("apps/$name/".Length);$manifest.files|Add-Member -NotePropertyName $relative -NotePropertyValue @{bytes=$f.bytes;sha256=$f.sha256} -Force}
  $manifest|Add-Member -NotePropertyName localPatch -NotePropertyValue @{id=$plan.id;installedAt=[DateTime]::UtcNow.ToString('o')} -Force
  [IO.File]::WriteAllText($mfile,($manifest|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
 }
 foreach($name in $names){$watchdog="$release/apps/$name/launcher/Install-RuntimeWatchdog.ps1";if(Test-Path -LiteralPath $watchdog){
  $config=Get-Content "$release/apps/$name/app.json" -Raw|ConvertFrom-Json;$taskName='KDW-Runtime-'+$config.id
  $existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if($existing){Export-ScheduledTask -TaskName $taskName|Set-Content "$backup/$name-task.xml" -Encoding Unicode}
  $changedTasks+=@{name=$taskName;app=$name;existed=($null -ne $existing)}
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $watchdog -AppRoot "$release/apps/$name"|Out-Null;if($LASTEXITCODE -ne 0){throw 'Watchdog registration failed'}}}
 Status 'starting' @{}
 foreach($item in $before.apps){StartApp $item}
 foreach($item in $before.apps){
  $name=$item.name;$port=if($name -eq 'stela'){18751}else{18752};$h=Health $name;if(-not $h){throw 'No health after startup'}
  $state=Invoke-RestMethod "http://127.0.0.1:$port/__kdw/sound/state" -TimeoutSec 4
  if($state.value.schemaVersion -ne 1 -or $state.events.Count -lt 1){throw 'Sound library not initialized'}
  if([IO.Path]::GetFullPath($state.folder) -ne [IO.Path]::GetFullPath("$release/apps/$name/data/audio")){throw 'Unexpected audio library path'}
  if((Invoke-WebRequest "http://127.0.0.1:$port/__kdw/sound/panel" -UseBasicParsing -TimeoutSec 4).StatusCode -ne 200){throw 'Sound panel unavailable'}
  $command=(Get-CimInstance Win32_Process -Filter "ProcessId=$($h.pid)").CommandLine
  $serveOnly=if($h.runtime){-not $h.runtime.outputEnabled}else{$command -match '--serve-only'};if(($item.serveOnly -or -not $item.pid) -and -not $serveOnly){throw 'Display mode changed'}
  $output=$null;if($name -eq 'max-game' -and -not $serveOnly){
   $deadline=[DateTime]::UtcNow.AddSeconds(35);do{$output=(Invoke-RestMethod "http://127.0.0.1:$port/__kdw/operator/state" -TimeoutSec 3).output;if($output.backgroundReady -and $output.contentReady){break};Start-Sleep -Milliseconds 500}while([DateTime]::UtcNow -lt $deadline)
   if(-not $output.backgroundReady -or -not $output.contentReady){throw 'MAX output did not recover'}
   # Preserve the operator's input state across an explicitly requested update.
   # The runtime still starts disarmed; restore only after both layers are ready.
   if($item.armed){
    $restored=Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/__kdw/operator/arm" -ContentType 'application/json' -Headers @{Origin="http://127.0.0.1:$port"} -Body '{"armed":true}' -TimeoutSec 4
    $output=$restored.output
    $armDeadline=[DateTime]::UtcNow.AddSeconds(8)
    while((-not $output.armed -or -not $output.active) -and [DateTime]::UtcNow -lt $armDeadline){
     Start-Sleep -Milliseconds 250
     $output=(Invoke-RestMethod "http://127.0.0.1:$port/__kdw/operator/state" -TimeoutSec 3).output
    }
    if(-not $output.armed -or -not $output.active){throw 'MAX input did not recover'}
   }
  }
  $results+=@{app=$name;pid=$h.pid;version=$h.version;serveOnly=$serveOnly;events=$state.events.Count;files=$state.files.Count;audioFolder=$state.folder;panel=200;outputReady=($output.backgroundReady -and $output.contentReady);armed=$output.armed;inputActive=$output.active}
 }
 foreach($entry in $pins.GetEnumerator()){if((Get-FileHash -LiteralPath "$release/apps/$($entry.Key)").Hash -ne $entry.Value){throw ('Preserved settings changed: '+$entry.Key)}}
 @{id=$plan.id;files=$plan.files.Count;preservedFiles=$pins.Count;apps=$results}|ConvertTo-Json -Depth 12|Set-Content "$base/applied.json" -Encoding UTF8
 Status 'complete' @{files=$plan.files.Count;preservedFiles=$pins.Count;apps=$results;rollback=$backup}
}catch{
 $errorText=$_.Exception.Message;$rolledBack=$false
 if($applied.Count){
  try{
   foreach($item in $before.apps){StopApp $item.name}
   foreach($task in $changedTasks){
    if($task.existed){Register-ScheduledTask -TaskName $task.name -Xml (Get-Content "$backup/$($task.app)-task.xml" -Raw) -Force|Out-Null}
    else{Unregister-ScheduledTask -TaskName $task.name -Confirm:$false -ErrorAction SilentlyContinue}
   }
   foreach($f in $applied){$target=Target $f.path;$old=Join-Path $backup $f.path;if(Test-Path -LiteralPath $old){Copy-Item -LiteralPath $old -Destination $target -Force}else{Remove-Item -LiteralPath $target -Force}}
   foreach($name in $names){Copy-Item -LiteralPath "$backup/$name-release-manifest.json" -Destination "$release/apps/$name/release-manifest.json" -Force}
   foreach($item in $before.apps){if($item.pid){StartApp $item;RestoreInput $item}};$rolledBack=$true
  }catch{$errorText+='; rollback: '+$_.Exception.Message}
 }elseif($stopped.Count){foreach($item in $stopped){if($item.pid){try{StartApp $item;RestoreInput $item}catch{$errorText+='; restart: '+$_.Exception.Message}}}}
 Status 'failed' @{error=$errorText;rolledBack=$rolledBack};exit 1
}
