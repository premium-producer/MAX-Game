import argparse,concurrent.futures,json,pathlib,sys,subprocess,time,re,hashlib
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(HERE.parent/'deploy-rc2'));import remote
p=argparse.ArgumentParser();p.add_argument('phase',choices=['preflight','apply','status']);p.add_argument('devices',nargs='+',choices=remote.PRODUCTION_CHOICES);p.add_argument('--resume',action='store_true');p.add_argument('--package-dir',type=pathlib.Path,required=True);a=p.parse_args()
a.devices=[remote.resolve_device(d) for d in a.devices]
if len(set(a.devices)) != len(a.devices):p.error('Duplicate physical target through aliases')
OUT=a.package_dir.resolve();PLAN=json.loads((OUT/'plan.json').read_text(encoding='utf-8'));PATCH=PLAN['id']
if not re.fullmatch(r'[A-Z0-9][A-Z0-9-]{2,79}',PATCH):raise ValueError('Invalid patch id')
if not re.fullmatch(r'C:/KDW-Stand/releases/[A-Za-z0-9_-]+',PLAN['release']):raise ValueError('Invalid release path')
REPORT=ROOT/'docs/stand-patches'/PATCH;REPORT.mkdir(parents=True,exist_ok=True)

def work(device):
 try:
  if a.phase=='preflight':
   plan=PLAN;source="$plan='"+json.dumps(plan).replace("'","''")+"'|ConvertFrom-Json;\n"+(HERE/'preflight.ps1').read_text(encoding='utf-8')
   value=json.loads(remote.run(device,source,timeout=90));value['planSha256']=hashlib.sha256((OUT/'plan.json').read_bytes()).hexdigest();(REPORT/(device+'-preflight.json')).write_text(json.dumps(value,indent=2),encoding='utf-8');return {'device':device,'ready':value['ready'],'apps':value['apps'],'files':len(value['hashes'])}
  if a.phase=='status':
   value=json.loads(remote.run(device,("$f='C:/KDW-Stand/deploy/SOUND-20261027-1/status.json';if(Test-Path $f){Get-Content $f -Raw}else{'{\"phase\":\"pending\"}'}").replace('SOUND-20261027-1',PATCH),timeout=60));(REPORT/'plan.json').write_text(json.dumps(PLAN,indent=2),encoding='utf-8');(REPORT/(device+'-status.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8');return {'device':device,**value}
  start=time.monotonic();preflight=json.loads((REPORT/(device+'-preflight.json')).read_text(encoding='utf-8'));assert preflight['ready'];assert preflight['planSha256']==hashlib.sha256((OUT/'plan.json').read_bytes()).hexdigest()
  package=json.loads((OUT/'package.json').read_text());assert hashlib.sha256((OUT/'patch.zip').read_bytes()).hexdigest()==package['sha256'];args=remote.arguments(device);row=remote.route.TARGETS[device]
  batch=OUT/(device+'-sftp.txt');batch.write_text(('put -a "' if a.resume else 'put "')+(OUT/'patch.zip').as_posix()+'" "C:/KDW-Stand/deploy/'+PATCH+'/patch.zip"\n',encoding='utf-8')
  result=subprocess.run([str(pathlib.Path(args[0]).with_name('sftp.exe')),*args[1:-5],'-P',str(row['port']),'-b',str(batch),row['windows_user']+'@127.0.0.1'],capture_output=True,timeout=150)
  if result.returncode:raise RuntimeError(result.stderr.decode(errors='replace')[-1200:])
  transfer=round(time.monotonic()-start,2)
  source="""
$base='C:/KDW-Stand/deploy/SOUND-20261027-1'
if((Get-FileHash "$base/patch.zip").Hash.ToLowerInvariant() -ne 'PACKAGE_SHA'){throw 'Patch transport hash mismatch'}
if(Test-Path "$base/applied.json"){throw 'Patch already applied'}
Expand-Archive "$base/patch.zip" $base -Force
$name='KDW-Sound-20261027-1';$task=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
if($task -and ($task.State -eq 'Running' -or $task.Actions.Arguments -notlike '*deploy/SOUND-20261027-1/install.ps1*')){throw 'Existing or running task conflicts'}
$user=(Get-CimInstance Win32_ComputerSystem).UserName;if(-not $user){throw 'No interactive user'}
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File C:/KDW-Stand/deploy/SOUND-20261027-1/install.ps1'
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $name -Action $action -Principal $principal -Settings $settings -Force|Out-Null
Start-ScheduledTask $name
@{started=$true;task=$name}|ConvertTo-Json -Compress
""".replace('PACKAGE_SHA',package['sha256']).replace('SOUND-20261027-1',PATCH).replace('KDW-Sound-20261027-1','KDW-'+PATCH)
  started=json.loads(remote.run(device,source,timeout=60));value={'device':device,**started,'zipBytes':package['bytes'],'transferSeconds':transfer,'dispatchSeconds':round(time.monotonic()-start,2)}
  (REPORT/(device+'-delivery.json')).write_text(json.dumps(value,indent=2),encoding='utf-8');return value
 except Exception as e:return {'device':device,'error':str(e)}
failed=False
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for result in pool.map(work,a.devices):
  print(json.dumps(result,ensure_ascii=False),flush=True);failed=failed or 'error' in result or result.get('phase')=='failed'
sys.exit(1 if failed else 0)
