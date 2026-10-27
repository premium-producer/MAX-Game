param([switch]$NoWindow,[switch]$Verify)
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$config = Get-Content -LiteralPath (Join-Path $appRoot 'app.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$hashProvider = [Security.Cryptography.SHA256]::Create()
try { $expectedKey = ([BitConverter]::ToString($hashProvider.ComputeHash([Text.Encoding]::UTF8.GetBytes($appRoot.ToLowerInvariant())))).Replace('-','').ToLowerInvariant() } finally { $hashProvider.Dispose() }
$runtimeExe = Join-Path $appRoot 'runtime/electron.exe'
if (-not (Test-Path -LiteralPath $runtimeExe)) { $runtimeExe = [IO.Path]::GetFullPath((Join-Path $appRoot '../../runtime/electron/electron.exe')) }
if (-not (Test-Path -LiteralPath $runtimeExe)) { throw 'Bundled Electron runtime is missing. Copy the complete application folder.' }
$entryPath = Join-Path $PSScriptRoot 'desktop-main.cjs'
function Read-OwnedHealth {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($config.port)/__kdw/health" -TimeoutSec 1
        $state = Get-Content -LiteralPath (Join-Path $appRoot 'data/runtime.json') -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($health.application -eq $config.id -and $health.instanceKey -eq $expectedKey -and $health.instanceKey -eq $state.instanceKey -and $health.pid -eq $state.pid) { return $health }
    } catch {}
    return $null
}
$already = Read-OwnedHealth
$processArgs = @('"' + $entryPath + '"')
if ($NoWindow) { $processArgs += '--serve-only' }
if ($Verify) { $processArgs += '--verify' }
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
if ($already) {
    if ($Verify) { throw 'Close this application before running verification.' }
    if (-not $NoWindow) { Start-Process -FilePath $runtimeExe -ArgumentList $processArgs -WorkingDirectory $appRoot -WindowStyle Hidden | Out-Null }
    Write-Output "$($config.title) is already running: $($already.origin)"
    exit 0
}
$process = Start-Process -FilePath $runtimeExe -ArgumentList $processArgs -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru
$null = $process.Handle
if ($Verify) { $process.WaitForExit(); exit $process.ExitCode }
$deadline = [DateTime]::UtcNow.AddSeconds(25)
do {
    Start-Sleep -Milliseconds 200
    $health = Read-OwnedHealth
    if ($health -and $health.pid -eq $process.Id) { Write-Output "$($config.title): $($health.origin)$($config.entry)"; exit 0 }
    if ($process.HasExited) { throw "Application exited before startup. See $appRoot/data/desktop.log" }
} while ([DateTime]::UtcNow -lt $deadline)
throw "Startup timed out. See $appRoot/data/desktop.log"
