param([string]$Device)
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$base='C:/KDW-Stand/deploy/RC4-1';$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1';$old='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4'
function Status($phase){@{phase=$phase;device=$Device;time=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json|Set-Content "$base/install-status.json" -Encoding UTF8}
try {
 if((Get-Content "$base/status.json" -Raw|ConvertFrom-Json).phase -ne 'downloads-complete'){throw 'Downloads incomplete'}
 if(Test-Path $release){throw 'Release exists; refusing overwrite'}
 $delta=Get-Content "$base/delta.json" -Raw|ConvertFrom-Json
 $pins=Get-Content "$base/install-pins.json" -Raw|ConvertFrom-Json
 foreach($name in @('max-game','stela')){
  $d=$delta.applications.$name
  if((Get-FileHash "$old/apps/$name/release-manifest.json").Hash -ne $d.baseManifestSha256){throw 'Wrong base manifest'}
  if((Get-FileHash "$base/$($d.name)").Hash -ne $d.sha256){throw 'Wrong overlay hash'}
  if($d.removed.Count){throw 'Unexpected removed paths; review migration'}
 }
 if((Get-FileHash "$base/stand-tools-KDW-Stand-20261027-RC4-1.zip").Hash -ne $pins.tools){throw 'Tools hash mismatch'}
 $active="$old/apps/max-game/data/link/active.json"
 if((Test-Path $active) -and (Get-Content $active -Raw|ConvertFrom-Json).gameId){throw 'Active assignment: wait before update'}
 foreach($name in @('max-game','stela')){
  if(Test-Path "$old/apps/$name/data/runtime.json"){
   & powershell.exe -NoProfile -File "$old/apps/$name/launcher/Control.ps1" -Action Stop
   if($LASTEXITCODE -ne 0){throw "Cannot safely stop $name"}
  }
 }
 Status 'installing'
 New-Item -ItemType Directory -Force "$release/apps","$release/runtime"|Out-Null
 Expand-Archive "$base/stand-tools-KDW-Stand-20261027-RC4-1.zip" $release
 Copy-Item -LiteralPath "$base/OPERATOR_PANELS.md" -Destination "$release/OPERATOR_PANELS.md"
 Copy-Item -LiteralPath "$base/Configure-LidarFirewall.ps1" -Destination "$release/tools/Configure-LidarFirewall.ps1"
 $preserved=@()
 foreach($name in @('max-game','stela')){
  Copy-Item -LiteralPath "$old/apps/$name" -Destination "$release/apps/$name" -Recurse
  Expand-Archive "$base/$($delta.applications.$name.name)" $release -Force
  $manifest=Get-Content "$release/apps/$name/release-manifest.json" -Raw -Encoding UTF8|ConvertFrom-Json
  foreach($f in $manifest.files.PSObject.Properties){
   if($f.Name -eq 'settings/stand.json'){continue}
   if((Get-FileHash -LiteralPath (Join-Path "$release/apps/$name" $f.Name)).Hash -ne $f.Value.sha256){throw "File mismatch: $name/$($f.Name)"}
  }
  # Preserve all configured launch options; only the release version changes.
  $profile=Get-Content "$old/apps/$name/app.json" -Raw -Encoding UTF8|ConvertFrom-Json
  $profile.version='KDW-Stand-20261027-RC4-1'
  [IO.File]::WriteAllText("$release/apps/$name/app.json",($profile|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
  foreach($folder in @('data','settings','plugins')){
   if(Test-Path "$old/apps/$name/$folder"){
    foreach($f in Get-ChildItem -LiteralPath "$old/apps/$name/$folder" -File -Recurse){
     $relative=$f.FullName.Substring(([IO.Path]::GetFullPath("$old/apps/$name")).Length+1)
     if((Get-FileHash -LiteralPath $f.FullName).Hash -ne (Get-FileHash -LiteralPath (Join-Path "$release/apps/$name" $relative)).Hash){throw "Preserved file mismatch: $name/$relative"}
     $preserved+=1
    }
   }
  }
 }
 Copy-Item -LiteralPath "$old/runtime/electron" -Destination "$release/runtime/electron" -Recurse
 $manifest=Get-Content "$release/runtime-manifest.json" -Raw|ConvertFrom-Json
 foreach($f in $manifest.files.PSObject.Properties){if((Get-FileHash -LiteralPath (Join-Path "$release/runtime/electron" $f.Name)).Hash -ne $f.Value.sha256){throw "Runtime mismatch: $($f.Name)"}}
 $shell=New-Object -ComObject WScript.Shell;$desktop=[Environment]::GetFolderPath('Desktop')
 foreach($name in @('max-game','stela')){
  $label=if($name -eq 'max-game'){'MAX'}else{'STELLA'}
  foreach($action in @('Start','Stop','Admin')){
   $bat=if($action -eq 'Admin'){'Start-Admin'}else{$action}
   [IO.File]::WriteAllText("$release/$action-$label.bat",('@echo off'+"`r`n"+'call "%~dp0apps/'+$name+'/'+$bat+'.bat"'+"`r`n"),[Text.Encoding]::ASCII)
   $shortcut=$shell.CreateShortcut((Join-Path $desktop "KDW $label RC4-1 - $action.lnk"));$shortcut.TargetPath="$release/$action-$label.bat";$shortcut.WorkingDirectory=$release;$shortcut.Save()
  }
 }
 if($Device -ne 'chuwi'){
  $local=if($Device -eq 'max_right'){'10.0.0.12'}else{'10.0.0.13'};$peer=if($Device -eq 'max_right'){'10.0.0.13'}else{'10.0.0.12'}
  if(-not(Get-NetFirewallRule -Name 'KDW-RC4-1-Link-Peer' -ErrorAction SilentlyContinue)){
   New-NetFirewallRule -Name 'KDW-RC4-1-Link-Peer' -DisplayName 'KDW RC4-1 encrypted link from paired PC only' -Direction Inbound -Action Allow -Protocol TCP -LocalAddress $local -LocalPort 18753 -RemoteAddress $peer -Profile Any -Program ([IO.Path]::GetFullPath("$release/runtime/electron/electron.exe"))|Out-Null
  }
 }
 & "$release/tools/Configure-LidarFirewall.ps1"|Out-Null
 @{preservedFiles=$preserved.Count;profilesPreserved=$true;runtimeVerified=$true;applications=@('max-game','stela')}|ConvertTo-Json|Set-Content "$base/integrity.json" -Encoding UTF8
 Status 'installed-verified'
}catch{Status ('failed: '+$_.Exception.Message+'; '+$_.ScriptStackTrace);exit 1}
