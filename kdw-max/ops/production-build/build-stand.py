"""Production layout for MAX dual Spout + fullscreen Stella. Local secrets never enter update ZIPs."""
from pathlib import Path
import argparse,hashlib,json,shutil,zipfile,datetime,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('--id',required=True);a=p.parse_args()
if not all(c.isalnum() or c in '-_' for c in a.id):raise SystemExit('Invalid release id')
root=Path(__file__).resolve().parents[2];out=root/'production'/a.id
if out.exists():raise SystemExit('Release already exists; use a new id')
out.mkdir(parents=True);(out/'archives').mkdir();(out/'tools').mkdir()
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
def save(f,v):f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def copy(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 if sha(src)!=sha(dst):raise RuntimeError('Copy verification failed')
shared={n:sha(root/'apps/STARTUP/tools'/n) for n in ['game-link.cjs','game-link-network.cjs','stand-settings.cjs','renderer-recovery.cjs']}
shared_revision=hashlib.sha256(json.dumps(shared,sort_keys=True).encode()).hexdigest()
native=root/'.cache/spout-prototype/build/Release/kdw_spout.node'
if not native.exists():raise SystemExit('Build the pinned native bridge first: ops/spout-prototype/build.ps1')
runtime=root/'apps/max-game/runtime'
if (runtime/'version').read_text().strip()!='44.4.5':raise SystemExit('Unexpected Electron version')
releases={}
for name in ['max-game','stela']:
 src=root/'apps'/name;dst=out/'apps'/name
 for folder in ['launcher','www','licenses','settings']:
  if not (src/folder).exists():continue
  for f in (src/folder).rglob('*'):
   if not f.is_file():continue
   rel=f.relative_to(src)
   if f.name in ['.DS_Store','Thumbs.db'] or '(2)' in f.name:continue
   if folder=='www' and (f.name.startswith(('r6-','r7-','r8-')) or f.suffix=='.map'):continue
   copy(f,dst/rel)
 for f in src.glob('*.bat'):copy(f,dst/f.name)
 copy(root/'apps/STARTUP/tools/Launch.ps1',dst/'launcher/Launch.ps1')
 config=json.loads((src/'app.json').read_text(encoding='utf-8'))
 config.update(version=a.id,production=True)
 if name=='stela':config.update(entry='/stella/pixels/')
 if name=='max-game':
  config.update(output='spout-dual',entry='/webgl-v5/client.html?backend=local&view=pixel-map')
  copy(native,dst/'launcher/kdw_spout.node')
  copy(root/'.cache/spout-prototype/Spout2/LICENSE',dst/'licenses/Spout2-LICENSE')
  for f in (root/'apps/max-game/source/stand-output/vendor').rglob('*'):
   if f.is_file() and ('license' in f.name.lower() or 'copying' in f.name.lower()):copy(f,dst/'licenses/osc-dependencies'/f.relative_to(root/'apps/max-game/source/stand-output/vendor'))
 save(dst/'app.json',config)
 files={f.relative_to(dst).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f)} for f in sorted(dst.rglob('*')) if f.is_file()}
 manifest={'schemaVersion':1,'releaseId':a.id,'application':name,'platform':'win32-x64','electron':'44.4.5','sharedRevision':shared_revision,'output':'spout-dual' if name=='max-game' else 'fullscreen','files':files,'mutableExcluded':['data','settings/stand.json','plugins'],'status':'release-candidate-hardware-acceptance-pending'}
 save(dst/'release-manifest.json',manifest)
 archive=out/'archives'/(name+'-'+a.id+'.zip')
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for rel in [*files,'release-manifest.json']:z.write(dst/rel,'apps/'+name+'/'+rel)
 releases[name]={'archive':archive.name,'bytes':archive.stat().st_size,'sha256':sha(archive),'files':len(files)}
# Ready local installation: one runtime and the existing private voice preset.
# These files are intentionally copied only AFTER the public update archives.
shutil.copytree(runtime,out/'runtime/electron')
shutil.copytree(root/'apps/stela/plugins',out/'apps/stela/plugins')
private=[]
for name in ['omni.local.json','audio.local.json','audio-profile.json','voice-profiles','audio-presets']:
 src=root/'apps/stela/data'/name;dst=out/'apps/stela/data'/name
 if not src.exists():continue
 if src.is_dir():shutil.copytree(src,dst)
 else:copy(src,dst)
 private.append(name)
for action in ['Start','Stop','Check']:
 lines=['@echo off','setlocal DisableDelayedExpansion','set "KDW_STATUS=0"']
 for name in ['max-game','stela']:lines += [f'call "%~dp0apps/{name}/{action}.bat" %*','if errorlevel 1 set "KDW_STATUS=1"']
 lines+=['exit /b %KDW_STATUS%'];(out/(action+'.bat')).write_text('\r\n'.join(lines)+'\r\n')
copy(root/'ops/production-build/Output-Control.ps1',out/'tools/Output-Control.ps1')
for action in ['Arm','Disarm','Status']:
 (out/(action+'-Output.bat')).write_text('@echo off\r\npowershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools/Output-Control.ps1" -Action '+action+'\r\nif errorlevel 1 pause\r\n')
copy(root/'.cache/spout-prototype/build/Release/kdw_spout_receiver.exe',out/'tools/kdw_spout_receiver.exe')
save(out/'examples/lidar.local.json',{'enabled':False,'bindAddress':'0.0.0.0','sourceAddress':'10.0.0.11','port':9001,'timeoutMs':350,'width':3072,'height':1536,'rawPoints':None,'targetPoints':None})
save(out/'release-set.json',{'schemaVersion':1,'releaseId':a.id,'sharedRevision':shared_revision,'electron':'44.4.5','spoutSDK':'6b68a5b4fdeca6130b851e5f9366467a844860e5','nativeSha256':sha(native),'applications':releases,'containsPrivateSettings':True,'privateSettingNames':private,'updateArchivesContainPrivateSettings':False,'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
copy(root/'docs/STAND_RELEASE.md',out/'README.md')
subprocess.run([sys.executable,str(root/'ops/production-build/prepare-stand-tools.py'),str(out)],check=True)
print(json.dumps({'directory':str(out),'applications':releases,'privateLocalOnly':True},indent=2))
