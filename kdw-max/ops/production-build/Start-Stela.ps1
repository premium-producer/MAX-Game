param([switch]$NoWindow,[switch]$Verify)
$ErrorActionPreference='Stop'
$kit=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$file=Join-Path $kit 'stela/data/game-link.local.json'
$config=$null
if (Test-Path -LiteralPath $file) { $config=Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json }
if (-not $config -or ([Uri]$config.gameOrigin).Host.EndsWith('.invalid')) { & (Join-Path $PSScriptRoot 'Configure-Link.ps1') }
$launchArgs=@()
if ($NoWindow) { $launchArgs+='-NoWindow' }
if ($Verify) { $launchArgs+='-Verify' }
& (Join-Path $kit 'stela/Start.bat') @launchArgs
exit $LASTEXITCODE
