
$target='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/lidar.cjs';$base='C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1'
if((Get-FileHash "$base/lidar.new.cjs").Hash.ToLowerInvariant() -ne '38d21cc4b3b1134c8813563c71ffd6047af669a2be76d893b0f49066c33fc4cb'){throw 'UPLOAD_HASH_MISMATCH'}
if((Get-FileHash $target).Hash.ToLowerInvariant() -ne 'a88cb573c85b6efbf26875269b49a82389bbabce68b634d84e3f22884eaa4378'){throw 'TARGET_CHANGED'}
if(Test-Path "$base/lidar.previous.cjs"){throw 'BACKUP_ALREADY_EXISTS'}
[IO.File]::Replace("$base/lidar.new.cjs",$target,"$base/lidar.previous.cjs")
$installed=(Get-FileHash $target).Hash.ToLowerInvariant();$backup=(Get-FileHash "$base/lidar.previous.cjs").Hash.ToLowerInvariant()
if($installed -ne '38d21cc4b3b1134c8813563c71ffd6047af669a2be76d893b0f49066c33fc4cb' -or $backup -ne 'a88cb573c85b6efbf26875269b49a82389bbabce68b634d84e3f22884eaa4378'){throw 'VERIFY_FAILED'}
$h=Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/health' -TimeoutSec 5
$r=@{id='LIDAR-RECOVERY-MAX-20261030-1';computer=$env:COMPUTERNAME;at=[DateTime]::UtcNow.ToString('o');phase='installed-awaiting-restart';sha256=$installed;backupSha256=$backup;outputPid=$h.runtime.output.pid;supervisorPid=$h.runtime.supervisorPid;apiPid=$h.runtime.api.pid;processesUnchanged=($h.runtime.output.pid -eq 5036 -and $h.runtime.supervisorPid -eq 7424 -and $h.runtime.api.pid -eq 17660);restartRequested=$false}
$j=$r|ConvertTo-Json -Compress
[IO.File]::WriteAllText("$base/receipt.json",$j,[Text.UTF8Encoding]::new($false))
$j
