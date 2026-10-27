param([Parameter(Mandatory=$true)][string]$AppRoot)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($AppRoot);$config=Get-Content "$root/app.json" -Raw|ConvertFrom-Json
if($config.id -notin @('kdw-max-game','kdw-max-stela','kdw-stela')){throw 'Unknown application identity'}
$exe=Join-Path $root 'runtime/electron.exe';if(-not(Test-Path $exe)){$exe=[IO.Path]::GetFullPath((Join-Path $root '../../runtime/electron/electron.exe'))}
if(-not(Test-Path $exe) -or -not(Test-Path "$root/launcher/runtime-main.cjs")){throw 'Runtime is not installed'}
$user=(Get-CimInstance Win32_ComputerSystem).UserName;if(-not $user){throw 'No interactive desktop user'}
$name='KDW-Runtime-'+$config.id
$existing=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
if($existing){if($existing.Actions.Count -ne 1 -or $existing.Actions[0].Execute -ne $exe -or $existing.Actions[0].Arguments -notlike ('*'+$root+'/launcher/desktop-main.cjs*')){throw 'Existing task belongs to another path; migration requires explicit review'}}
$action=New-ScheduledTaskAction -Execute $exe -Argument ('"'+$root+'/launcher/desktop-main.cjs" --runtime-watchdog') -WorkingDirectory $root
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $user
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force|Out-Null
Write-Output "Installed $name for $user; not started. desiredState=stopped prevents automatic restart."
