import argparse,pathlib,sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent/'deploy-rc2'))
import remote
p=argparse.ArgumentParser();p.add_argument('device',choices=['max_right','stella']);p.add_argument('mode',choices=['install','verify','start','probe']);a=p.parse_args()
file={'install':'install.ps1'}.get(a.mode,'run-apps.ps1')
remote.upload(a.device,pathlib.Path(__file__).with_name(file),'C:/KDW-Stand/deploy/RC4-1/'+file)
extra='' if a.mode == 'install' else ' -Mode '+a.mode
script="""
$name='KDW-RC4-1-MODE';$existing=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
if($existing -and $existing.State -eq 'Running'){throw 'Task is already running'}
if($existing -and $existing.Actions.Arguments -notlike '*C:/KDW-Stand/deploy/RC4-1/*'){throw 'Unowned task'}
$user=(Get-CimInstance Win32_ComputerSystem).UserName;if(-not $user){throw 'No interactive user'}
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File C:/KDW-Stand/deploy/RC4-1/FILE -Device DEVICEEXTRA'
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 3) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $name -Action $action -Principal $principal -Settings $settings -Force|Out-Null
Start-ScheduledTask -TaskName $name;'Started '+$name+' for '+$user
""".replace('MODE',a.mode).replace('FILE',file).replace('DEVICE',a.device).replace('EXTRA',extra)
sys.stdout.buffer.write(remote.run(a.device,script).encode('utf-8'))
