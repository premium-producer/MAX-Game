param([ValidateSet('Check','Stop')][string]$Action = 'Check')
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$config = Get-Content -LiteralPath (Join-Path $appRoot 'app.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$hashProvider = [Security.Cryptography.SHA256]::Create()
try { $expectedKey = ([BitConverter]::ToString($hashProvider.ComputeHash([Text.Encoding]::UTF8.GetBytes($appRoot.ToLowerInvariant())))).Replace('-','').ToLowerInvariant() } finally { $hashProvider.Dispose() }
try { $state = Get-Content -LiteralPath (Join-Path $appRoot 'data/runtime.json') -Raw -Encoding UTF8 | ConvertFrom-Json } catch { if(Test-Path (Join-Path $appRoot 'data/supervisor.json')){$state=$null}else{Write-Output "$($config.title): stopped"; exit $(if ($Action -eq 'Stop') {0} else {1})} }
try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($config.port)/__kdw/health" -TimeoutSec 2 } catch {
    $super=Get-Content (Join-Path $appRoot 'data/supervisor.json') -Raw|ConvertFrom-Json
    $origin="http://127.0.0.1:$($config.port+100)"
    $status=Invoke-RestMethod "$origin/__kdw/runtime/state" -TimeoutSec 2
    if($super.application -ne $config.id -or $status.application -ne $config.id -or $super.pid -ne $status.supervisorPid -or $super.bootId -ne $status.bootId){throw 'Supervisor identity mismatch'}
    if($Action -eq 'Check'){Write-Output "$($config.title): API unavailable; recovery $origin/__kdw/runtime/panel";exit 1}
    Invoke-RestMethod "$origin/__kdw/runtime/stop" -Method Post -Headers @{Origin=$origin} -ContentType 'application/json' -Body '{}' -TimeoutSec 5|Out-Null
    $deadline=[DateTime]::UtcNow.AddSeconds(12)
    do{Start-Sleep -Milliseconds 150;if(-not(Test-Path (Join-Path $appRoot 'data/supervisor.json'))){Write-Output "$($config.title): stopped";exit 0}}while([DateTime]::UtcNow -lt $deadline)
    throw 'Supervisor shutdown timeout'
}
if ($health.application -ne $config.id -or $health.instanceKey -ne $expectedKey -or $health.instanceKey -ne $state.instanceKey -or $health.pid -ne $state.pid) { throw 'The port is owned by a different application. Nothing was stopped.' }
if ($Action -eq 'Check') { Write-Output "$($config.title): running at $($health.origin)$($config.entry)"; exit 0 }
Invoke-RestMethod -Uri "http://127.0.0.1:$($config.port)/__kdw/stop" -Method Post -Headers @{'X-KDW-Token'=$state.token} -TimeoutSec 2 | Out-Null
$deadline = [DateTime]::UtcNow.AddSeconds(10)
do { Start-Sleep -Milliseconds 100; if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'data/runtime.json')) -and -not (Test-Path -LiteralPath (Join-Path $appRoot 'data/supervisor.json'))) { Write-Output "$($config.title): stopped"; exit 0 } } while ([DateTime]::UtcNow -lt $deadline)
throw 'Shutdown did not complete within 10 seconds.'
