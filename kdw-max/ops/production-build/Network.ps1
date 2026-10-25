param([ValidateSet('Show','Enable','Disable')][string]$Action='Show')
$ErrorActionPreference='Stop'
$kit=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$config=Get-Content -LiteralPath (Join-Path $kit 'max-game/data/game-link-network.local.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$ruleName='KDW-MAX-Link-'+$config.pairId
if ($Action -eq 'Enable') {
 $existing=Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
 if ($existing) { Enable-NetFirewallRule -Name $ruleName | Out-Null }
 else { New-NetFirewallRule -Name $ruleName -DisplayName 'KDW MAX encrypted link' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $config.port -RemoteAddress LocalSubnet -Profile Private -Program (Join-Path $kit 'max-game/runtime/electron.exe') | Out-Null }
 Write-Output 'MAX link allowed on Private networks for LocalSubnet only.'
} elseif ($Action -eq 'Disable') {
 Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue | Disable-NetFirewallRule | Out-Null
 Write-Output 'MAX link firewall rule disabled.'
}
Write-Output "Encrypted link port: $($config.port). Pair: $($config.pairId)"
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object InterfaceAlias,IPAddress | Format-Table
