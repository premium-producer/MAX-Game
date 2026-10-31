param([ValidateSet('max-game','stela')][string]$App)
$ErrorActionPreference='Stop'
$port=if($App -eq 'max-game'){18772}else{18771}
$name='KDW-Screen-HTTP-'+$App
$rule=Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
if($rule){Set-NetFirewallRule -Name $name -Enabled True -Direction Inbound -Action Allow -Profile Any -RemoteAddress LocalSubnet|Out-Null; $rule|Get-NetFirewallPortFilter|Set-NetFirewallPortFilter -Protocol TCP -LocalPort $port|Out-Null}
else{New-NetFirewallRule -Name $name -DisplayName "KDW screen HTTP $App" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -RemoteAddress LocalSubnet -Profile Any|Out-Null}
@{computer=$env:COMPUTERNAME;port=$port;remoteAddress='LocalSubnet';rule=$name}|ConvertTo-Json -Compress
