"""Finish already staged RC4.1 update, preserving logged-in session and stop gates."""
import argparse,concurrent.futures,json,pathlib,subprocess,sys,time
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(HERE.parent/'deploy-rc2'));import remote
BASE='C:/KDW-Stand/deploy/RC4-1'
def status(device,file,expected,seconds=240):
 end=time.monotonic()+seconds;last='pending'
 while time.monotonic()<end:
  try:
   raw=remote.run(device,f"if(Test-Path '{BASE}/{file}.json'){{Get-Content '{BASE}/{file}.json' -Raw}}else{{'{{\"phase\":\"pending\"}}'}}",timeout=40)
   value=json.loads(raw);last=value['phase']
   if last==expected:return value
   if last.startswith('failed:'):raise ValueError(last)
  except ValueError:raise
  except Exception as e:last=str(e)
  time.sleep(5)
 raise RuntimeError('Timed out '+file+': '+last)
def apply(device):
 try:
  try:status(device,'status','downloads-complete',120)
  except (ValueError,RuntimeError):
   # Same immutable assets, only transport changes when GitHub CDN stalls.
   rel=ROOT/'production/KDW-Stand-20261027-RC4-1'
   for name in ['max-game-RC4-to-RC4-1.zip','stela-RC4-to-RC4-1.zip']:remote.upload(device,rel/'archives'/name,BASE+'/'+name)
   remote.run(device,f"$d=Get-Content '{BASE}/delta.json' -Raw|ConvertFrom-Json;foreach($a in $d.applications.PSObject.Properties){{if((Get-FileHash ('{BASE}/'+$a.Value.name)).Hash -ne $a.Value.sha256){{throw 'Overlay mismatch'}}}};@{{phase='downloads-complete';transport='verified-ssh-fallback'}}|ConvertTo-Json|Set-Content '{BASE}/status.json' -Encoding UTF8")
  for phase,expected in [('install','installed-verified'),('verify','complete'),('start','complete'),('probe','complete')]:
   subprocess.run([sys.executable,'-X','utf8',str(HERE/'task.py'),device,phase],check=True,cwd=ROOT)
   status(device,phase+'-status',expected)
   print(device+': '+phase+' passed',flush=True)
  return {'device':device,'updated':True}
 except Exception as e:return {'device':device,'updated':False,'error':str(e)}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('devices',nargs='+',choices=['max_right','stella']);args=parser.parse_args()
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  for result in pool.map(apply,args.devices):print(json.dumps(result,ensure_ascii=False),flush=True)
