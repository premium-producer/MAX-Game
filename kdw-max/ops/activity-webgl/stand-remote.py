"""Use the existing pinned transport, explicit fallback node and bounded commands."""
import sys,pathlib,base64,subprocess,runpy,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops/production-build/deploy-rc2'))
import remote
remote.arguments=lambda device:remote.route.arguments(remote.resolve_device(device),'cloudcore')
def run(device,source,timeout=90):
 device=remote.resolve_device(device)
 source="$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue';[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);if($env:COMPUTERNAME -ne '"+remote.route.TARGETS[device]['computer']+"'){throw 'WRONG_HOST'};\n"+source
 command='powershell.exe -NoProfile -NonInteractive -EncodedCommand '+base64.b64encode(source.encode('utf-16le')).decode()
 if len(command)>7000:
  digest=hashlib.sha256(source.encode()).hexdigest()
  local=ROOT/'.cache'/('activity-remote-'+digest[:16]+'.ps1')
  local.write_text(source,encoding='utf-8-sig')
  target='C:/KDW-Stand/deploy/activity-remote-'+digest[:16]+'.ps1'
  remote.upload(device,local,target)
  command='powershell.exe -NoProfile -NonInteractive -File '+target
 reply=subprocess.run([*remote.arguments(device),command],stdin=subprocess.DEVNULL,capture_output=True,timeout=timeout)
 if reply.returncode:raise RuntimeError(reply.stderr.decode('utf-8',errors='replace')[-1500:])
 return reply.stdout.decode('utf-8-sig')
remote.run=run
if sys.argv[1]=='run':
 output=run('max-game-pc',pathlib.Path(sys.argv[2]).read_text(encoding='utf-8-sig'),timeout=240)
 pathlib.Path(sys.argv[3]).write_text(output,encoding='utf-8');print('Saved',sys.argv[3])
else:
 sys.argv=[str(ROOT/'ops/production-build/deploy-sound/deploy.py'),*sys.argv[1:]]
 runpy.run_path(sys.argv[0],run_name='__main__')
