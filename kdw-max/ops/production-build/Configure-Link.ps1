param([string]$MaxAddress)
$ErrorActionPreference='Stop'
$kit=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $MaxAddress) { $MaxAddress=Read-Host 'IPv4 address of the MAX computer (for example 192.168.1.20)' }
$address=$null
if (-not [Net.IPAddress]::TryParse($MaxAddress,[ref]$address) -or $address.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) { throw 'Enter an IPv4 address, without https or a port.' }
$bytes=$address.GetAddressBytes()
if (-not (($bytes[0] -eq 10) -or (($bytes[0] -eq 192) -and ($bytes[1] -eq 168)) -or (($bytes[0] -eq 172) -and ($bytes[1] -ge 16) -and ($bytes[1] -le 31)) -or ($bytes[0] -eq 127))) { throw 'Use the local network address of MAX.' }
$pair=Get-Content -LiteralPath (Join-Path $kit 'settings/pairing.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$config=@{gameOrigin="https://$($address.ToString()):$($pair.port)";key=$pair.key;certificatePem=$pair.certificatePem;pairId=$pair.pairId}
$destination=Join-Path $kit 'stela/data/game-link.local.json'
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
[IO.File]::WriteAllText($destination,($config|ConvertTo-Json -Depth 5),(New-Object Text.UTF8Encoding($false)))
Write-Output 'Connection address saved. Start MAX, then run Check-Link.bat.'
