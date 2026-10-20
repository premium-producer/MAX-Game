param([ValidateSet('Check','Stop')][string]$Action = 'Check')
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$config = Get-Content -LiteralPath (Join-Path $appRoot 'app.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$hashProvider = [Security.Cryptography.SHA256]::Create()
try { $expectedKey = ([BitConverter]::ToString($hashProvider.ComputeHash([Text.Encoding]::UTF8.GetBytes($appRoot.ToLowerInvariant())))).Replace('-','').ToLowerInvariant() } finally { $hashProvider.Dispose() }
try { $state = Get-Content -LiteralPath (Join-Path $appRoot 'data/runtime.json') -Raw -Encoding UTF8 | ConvertFrom-Json } catch { Write-Output "$($config.title): stopped"; exit $(if ($Action -eq 'Stop') {0} else {1}) }
try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($config.port)/__kdw/health" -TimeoutSec 2 } catch { Write-Output "$($config.title): not responding"; exit 1 }
if ($health.application -ne $config.id -or $health.instanceKey -ne $expectedKey -or $health.instanceKey -ne $state.instanceKey -or $health.pid -ne $state.pid) { throw 'The port is owned by a different application. Nothing was stopped.' }
if ($Action -eq 'Check') { Write-Output "$($config.title): running at $($health.origin)$($config.entry)"; exit 0 }
Invoke-RestMethod -Uri "http://127.0.0.1:$($config.port)/__kdw/stop" -Method Post -Headers @{'X-KDW-Token'=$state.token} -TimeoutSec 2 | Out-Null
$deadline = [DateTime]::UtcNow.AddSeconds(10)
do { Start-Sleep -Milliseconds 100; if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'data/runtime.json'))) { Write-Output "$($config.title): stopped"; exit 0 } } while ([DateTime]::UtcNow -lt $deadline)
throw 'Shutdown did not complete within 10 seconds.'
