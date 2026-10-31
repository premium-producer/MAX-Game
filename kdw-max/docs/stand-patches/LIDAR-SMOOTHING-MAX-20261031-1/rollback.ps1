$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'DESKTOP-64J4BMN'){throw 'WRONG_HOST'}
$base='C:/KDW-Stand/deploy/LIDAR-SMOOTHING-MAX-20261031-1'
$p=Get-Content "$base/plan.json" -Raw|ConvertFrom-Json
foreach($f in $p.files){if((Get-FileHash "$($p.release)/$($f.path)").Hash.ToLowerInvariant() -ne $f.sha256){throw 'NEWER_FILE_OR_ALREADY_ROLLED_BACK'};if((Get-FileHash "$base/backup/$($f.path)").Hash.ToLowerInvariant() -ne $f.before){throw 'BACKUP_HASH_MISMATCH'}}
# The previous validator does not accept inputFilter. Preserve a full copy before stripping only that field.
$config="$($p.release)/apps/max-game/data/lidar.local.json"
if(Test-Path $config){$v=Get-Content $config -Raw|ConvertFrom-Json;if($v.PSObject.Properties.Name -contains 'inputFilter'){Copy-Item -LiteralPath $config -Destination "$base/lidar-settings-before-rollback.json";$v.PSObject.Properties.Remove('inputFilter');[IO.File]::WriteAllText($config,($v|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))}}
foreach($f in $p.files){$dest="$($p.release)/$($f.path)";$temp="$dest.rollback-new";Copy-Item -LiteralPath "$base/backup/$($f.path)" -Destination $temp;[IO.File]::Replace($temp,$dest,$null)}
'Previous files restored. No restart performed; activate by full MAX restart.'
