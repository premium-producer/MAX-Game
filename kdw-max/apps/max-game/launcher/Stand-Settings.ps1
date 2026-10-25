param([ValidateSet('Show','Edit','Manual','Stella','Combined')][string]$Action='Show')
$ErrorActionPreference='Stop'
$standRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$standFile=Join-Path $standRoot 'settings/stand.json'
if ($Action -eq 'Edit') { Start-Process -FilePath 'notepad.exe' -ArgumentList ('"'+$standFile+'"'); exit 0 }
if ($Action -in @('Manual','Stella','Combined')) {
    $standSettings=Get-Content -LiteralPath $standFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $standSettings.max.entryMode=$Action.ToLowerInvariant()
    $standTemp=$standFile+'.tmp'
    [IO.File]::WriteAllText($standTemp,($standSettings | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $standTemp -Destination $standFile -Force
}
$standApp=Get-Content -LiteralPath (Join-Path $standRoot 'app.json') -Raw | ConvertFrom-Json
try {
    $standReply=Invoke-RestMethod -Uri "http://127.0.0.1:$($standApp.port)/__kdw/settings" -TimeoutSec 5
} catch {
    if ($Action -eq 'Show') { throw }
    Write-Output ('Saved for the next MAX start: '+$standFile)
    exit 0
}
Write-Output ('Accepted revision: '+$standReply.revision)
Write-Output ('Accepted at: '+$standReply.acceptedAt)
if ($standReply.error) { throw $standReply.error }
$standReply.value | ConvertTo-Json -Depth 10
Write-Output 'Applies to the next game. The active game keeps its timing.'
