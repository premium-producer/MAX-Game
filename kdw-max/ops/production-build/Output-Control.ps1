param([ValidateSet('Status','Arm','Disarm')][string]$Action='Status')
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../apps/max-game'))
$statePath=Join-Path $root 'data/output-state.json'
$state=Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
if($Action -eq 'Status'){$state|ConvertTo-Json -Depth 8;exit 0}
if($state.stopped -or -not $state.bootId){throw 'MAX output is not running'}
if($Action -eq 'Arm' -and ($state.frames.Count -ne 2 -or $state.frames[0] -lt 1 -or $state.frames[1] -lt 1)){throw 'Both Spout layers must be ready before ARM'}
if($Action -eq 'Arm' -and (-not $state.contentReady -or -not $state.backgroundReady)){throw 'Game assets and background shader must finish loading before ARM'}
$target=Join-Path $root 'data/output-arm.json'
$temporary=$target+'.operator.tmp'
@{bootId=$state.bootId;armed=($Action -eq 'Arm')}|ConvertTo-Json|Set-Content -LiteralPath $temporary -Encoding UTF8
Move-Item -LiteralPath $temporary -Destination $target -Force
Write-Output $Action
