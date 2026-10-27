param([string]$ReleaseRoot=(Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference='Stop'
$release=[IO.Path]::GetFullPath($ReleaseRoot)
$app=Join-Path $release 'apps/max-game'
$profile=Get-Content (Join-Path $app 'app.json') -Raw -Encoding UTF8|ConvertFrom-Json
if($profile.id -ne 'kdw-max-game' -or $profile.output -ne 'spout-dual'){throw 'Expected MAX Spout release'}
$configPath=Join-Path $app 'data/lidar.local.json'
$config=if(Test-Path $configPath){Get-Content $configPath -Raw -Encoding UTF8|ConvertFrom-Json}else{[pscustomobject]@{sourceAddress='10.0.0.11';port=9001}}
$ip=$null
if(-not [Net.IPAddress]::TryParse($config.sourceAddress,[ref]$ip) -or $config.sourceAddress -eq '0.0.0.0' -or $config.port -lt 1024 -or $config.port -gt 65535){throw 'Invalid LiDAR endpoint'}
$program=[IO.Path]::GetFullPath((Join-Path $release 'runtime/electron/electron.exe'))
if(-not(Test-Path -LiteralPath $program)){throw 'Missing Electron runtime'}
$name='KDW-'+$profile.version+'-Lidar'
$rule=Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
if($rule){
 if(($rule|Get-NetFirewallApplicationFilter).Program -ne $program){throw 'Rule belongs to another program'}
 $rule|Set-NetFirewallRule -Enabled True -Direction Inbound -Action Allow -Protocol UDP -LocalPort $config.port -RemoteAddress $config.sourceAddress -Profile Any|Out-Null
}else{
 New-NetFirewallRule -Name $name -DisplayName ('KDW LiDAR OSC '+$profile.version) -Direction Inbound -Action Allow -Protocol UDP -LocalPort $config.port -RemoteAddress $config.sourceAddress -Profile Any -Program $program|Out-Null
}
@{rule=$name;program=$program;protocol='UDP';port=$config.port;source=$config.sourceAddress}|ConvertTo-Json
