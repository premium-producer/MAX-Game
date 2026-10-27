param([int]$Seconds=180,[int]$Width=3072,[string]$RunId='probe',[string]$RuntimePath='')
$ErrorActionPreference='Stop'
if($RunId -notmatch '^[a-zA-Z0-9_-]+$'){throw 'Invalid RunId'}
if($Width -notin @(1920,3072) -or $Seconds -lt 20 -or $Seconds -gt 14400){throw 'Invalid probe settings'}
$root=$PSScriptRoot
if(-not $RuntimePath){$RuntimePath=Join-Path $root 'runtime'}
if(-not(Test-Path -LiteralPath (Join-Path $RuntimePath 'electron.exe'))){throw 'Electron runtime missing'}
$out=Join-Path $root "results/$RunId"
if(Test-Path -LiteralPath $out){throw 'Run already exists; use a new RunId'}
New-Item -ItemType Directory -Force -Path $out | Out-Null
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$senderArgs=@(('"'+(Join-Path $root 'app/main.cjs')+'"'),"--seconds=$Seconds","--width=$Width",("--height="+($Width/2)),('"--out='+(Join-Path $out 'sender')+'"'))
$sender=Start-Process -FilePath (Join-Path $RuntimePath 'electron.exe') -ArgumentList $senderArgs -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $out 'sender-stderr.log')
$receiver=Start-Process -FilePath (Join-Path $root 'kdw_spout_receiver.exe') -ArgumentList ('"'+(Join-Path $out 'receiver')+'"'),($Seconds+5) -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $out 'receiver-stderr.log')
@{sender=$sender.Id;receiver=$receiver.Id;session=[Diagnostics.Process]::GetCurrentProcess().SessionId;started=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $out 'processes.json') -Encoding utf8
$samples=@()
$deadline=(Get-Date).AddSeconds($Seconds+45)
while(-not $sender.HasExited -or -not $receiver.HasExited){
  if((Get-Date) -gt $deadline){
    foreach($owned in @($sender,$receiver)){if(-not $owned.HasExited){Stop-Process -InputObject $owned -Force}}
    'Owned prototype processes exceeded deadline' | Set-Content -LiteralPath (Join-Path $out 'timeout.txt')
    break
  }
  $samples+=Get-Process -Id @($sender.Id,$receiver.Id) -ErrorAction SilentlyContinue | Select-Object @{n='at';e={(Get-Date).ToUniversalTime().ToString('o')}},Id,CPU,WorkingSet64,PrivateMemorySize64,HandleCount,SessionId
  Start-Sleep -Seconds 5
  $sender.Refresh();$receiver.Refresh()
}
$samples | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $out 'process-samples.json') -Encoding utf8
@{senderExit=$sender.ExitCode;receiverExit=$receiver.ExitCode;finished=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $out 'exit.json') -Encoding utf8
