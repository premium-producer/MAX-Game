$ErrorActionPreference='Stop'
$base='C:/KDW-Stand/deploy/LIDAR-SMOOTHING-MAX-20261031-1'
Expand-Archive -LiteralPath "$base/patch.zip" -DestinationPath "$base/stage"
$p=Get-Content "$base/stage/plan.json" -Raw|ConvertFrom-Json
foreach($f in $p.files){if((Get-FileHash "$($p.release)/$($f.path)").Hash.ToLowerInvariant() -ne $f.before){throw 'TARGET_CHANGED'};if((Get-FileHash "$base/stage/$($f.path)").Hash.ToLowerInvariant() -ne $f.sha256){throw 'UPLOAD_MISMATCH'}}
Copy-Item "$base/stage/plan.json" "$base/plan.json"
Copy-Item "$base/stage/rollback.ps1" "$base/rollback.ps1"
$changed=@()
try{foreach($f in $p.files){$dest="$($p.release)/$($f.path)";$backup="$base/backup/$($f.path)";New-Item -ItemType Directory -Path (Split-Path $backup) -Force|Out-Null;[IO.File]::Replace("$base/stage/$($f.path)",$dest,$backup);$changed+=$f;if((Get-FileHash $dest).Hash.ToLowerInvariant() -ne $f.sha256 -or (Get-FileHash $backup).Hash.ToLowerInvariant() -ne $f.before){throw 'VERIFY_FAILED'}}}
catch{foreach($f in $changed){Copy-Item -LiteralPath "$base/backup/$($f.path)" -Destination "$($p.release)/$($f.path)"};throw}
$h=Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/health' -TimeoutSec 5
$page=(Invoke-WebRequest 'http://127.0.0.1:18752/admin/' -UseBasicParsing -TimeoutSec 5).Content
$r=@{id=$p.id;at=[DateTime]::UtcNow.ToString('o');phase='installed-awaiting-restart';filesVerified=$p.files.Count;restartRequested=$false;processesUnchanged=($h.runtime.api.pid -eq 17660 -and $h.runtime.output.pid -eq 5036 -and $h.runtime.supervisorPid -eq 7424);adminServesFilter=($page -match 'filterStrength');outputPid=$h.runtime.output.pid;apiPid=$h.runtime.api.pid}
$j=$r|ConvertTo-Json -Compress;[IO.File]::WriteAllText("$base/receipt.json",$j,[Text.UTF8Encoding]::new($false));$j
