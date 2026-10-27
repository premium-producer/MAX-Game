"""Build a small sound-panel overlay against the installed RC4.1, without runtime/media."""
import hashlib,json,pathlib,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUT=ROOT/'.cache/deploy-sound-20261027';OUT.mkdir(parents=True,exist_ok=True)
BASE=ROOT/'production/KDW-Stand-20261027-RC4-1'
PATCH='SOUND-20261027-1'
common=['launcher/sound-library.cjs','launcher/sound-events.cjs','launcher/sound-panel/index.html','launcher/sound-panel/panel.js','launcher/sound-panel/panel.css','launcher/portable-server.cjs']
selected={'max-game':common+['www/admin/index.html','www/webgl-v5/app.js','www/webgl-v5/build.json','www/webgl-v5/r9-build.json'],
 'stela':common+['www/stella/admin/index.html','www/stella/admin/panel.js','www/stella/operator/index.html','www/stella/operator/panel.js','www/stella/assets/app.js']}
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
plan={'id':PATCH,'release':'C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1','files':[]}
for app,files in selected.items():
 for relative in files:
  source=ROOT/'apps'/app/relative;old=BASE/'apps'/app/relative
  before=sha(old) if old.exists() else None;after=sha(source)
  if before!=after:plan['files'].append({'path':f'apps/{app}/{relative}','before':before,'sha256':after,'bytes':source.stat().st_size})
(OUT/'plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
installer=pathlib.Path(__file__).with_name('install.ps1')
if installer.exists():
 with zipfile.ZipFile(OUT/'patch.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  z.write(OUT/'plan.json','plan.json');z.write(installer,'install.ps1')
  for f in plan['files']:z.write(ROOT/f['path'],'payload/'+f['path'])
 (OUT/'package.json').write_text(json.dumps({'sha256':sha(OUT/'patch.zip'),'bytes':(OUT/'patch.zip').stat().st_size,'files':len(plan['files'])},indent=2))
print(json.dumps({'patch':PATCH,'files':len(plan['files']),'uncompressedBytes':sum(f['bytes'] for f in plan['files']),'zipBytes':(OUT/'patch.zip').stat().st_size if (OUT/'patch.zip').exists() else None}))
