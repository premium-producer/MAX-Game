
$target='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/game-state-osc.cjs';$base='C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1'
if((Get-FileHash "$base/mission-osc.new.cjs").Hash.ToLowerInvariant() -ne 'b84dc85945f9d29b730cc303f583bb1fdb605079a19329aeba472d0bb19ad7d3'){throw 'UPLOAD_HASH_MISMATCH'}
if((Get-FileHash $target).Hash.ToLowerInvariant() -ne '069ecb21b38b5f5412d98d65e6f177613cfccf6bbd68fa19f6cbd56bcfeeeb53'){throw 'TARGET_CHANGED'}
if(Test-Path "$base/mission-osc.previous.cjs"){throw 'BACKUP_ALREADY_EXISTS'}
[IO.File]::Replace("$base/mission-osc.new.cjs",$target,"$base/mission-osc.previous.cjs")
$installed=(Get-FileHash $target).Hash.ToLowerInvariant();$backup=(Get-FileHash "$base/mission-osc.previous.cjs").Hash.ToLowerInvariant()
if($installed -ne 'b84dc85945f9d29b730cc303f583bb1fdb605079a19329aeba472d0bb19ad7d3' -or $backup -ne '069ecb21b38b5f5412d98d65e6f177613cfccf6bbd68fa19f6cbd56bcfeeeb53'){throw 'VERIFY_FAILED'}
$h=Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/health' -TimeoutSec 5
$r=@{id='MISSION-OSC-MAX-20261030-1';computer=$env:COMPUTERNAME;at=[DateTime]::UtcNow.ToString('o');phase='installed-awaiting-restart';sha256=$installed;backupSha256=$backup;outputPid=$h.runtime.output.pid;supervisorPid=$h.runtime.supervisorPid;apiPid=$h.runtime.api.pid;processesUnchanged=($h.runtime.output.pid -eq 5036 -and $h.runtime.supervisorPid -eq 7424 -and $h.runtime.api.pid -eq 17660);restartRequested=$false}
$j=$r|ConvertTo-Json -Compress
[IO.File]::WriteAllText("$base/receipt.json",$j,[Text.UTF8Encoding]::new($false))
$j
