from pathlib import Path
import argparse,json,hashlib,shutil,zipfile
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);a=p.parse_args()
root=Path(__file__).resolve().parents[2];out=a.directory.resolve()
meta=json.loads((out/'release-set.json').read_text(encoding='utf-8'))
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
for name in ['Install-Runtime.ps1','Output-Control.ps1']:shutil.copy2(root/'ops/production-build'/name,out/'tools'/name)
shutil.copy2(root/'docs/STAND_RELEASE.md',out/'README.md')
(out/'tools/licenses').mkdir(exist_ok=True)
shutil.copy2(root/'.cache/spout-prototype/Spout2/LICENSE',out/'tools/licenses/Spout2-LICENSE')
(out/'Install-Runtime.bat').write_text('@echo off\r\npowershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools/Install-Runtime.ps1" %*\r\nif errorlevel 1 pause\r\n')
runtime=out/'runtime/electron'
files={f.relative_to(runtime).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f)} for f in sorted(runtime.rglob('*')) if f.is_file() and f.relative_to(runtime).as_posix() != 'debug.log'}
(out/'runtime-manifest.json').write_text(json.dumps({'version':'44.4.5','platform':'win32-x64','files':files},indent=2),encoding='utf-8')
public={k:v for k,v in meta.items() if k not in ['containsPrivateSettings','privateSettingNames','updateArchivesContainPrivateSettings']}
public.update(containsPrivateSettings=False,requiresLocalProvisioning=['Stella voice credentials and VST presets/plugins','LiDAR measured calibration','TouchDesigner output ARM'])
(out/'release-set.public.json').write_text(json.dumps(public,indent=2),encoding='utf-8')
toolpaths=[*out.glob('*.bat'),out/'README.md',out/'runtime-manifest.json',out/'release-set.public.json',*[f for d in ['tools','examples'] for f in (out/d).rglob('*') if f.is_file()]]
archive=out/'archives'/('stand-tools-'+meta['releaseId']+'.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in toolpaths:z.write(f,f.relative_to(out).as_posix())
sums=[f'{sha(f)}  {f.name}' for f in sorted((out/'archives').glob('*.zip'))]
(out/'archives/SHA256SUMS.txt').write_text('\n'.join(sums)+'\n',encoding='utf-8')
print(json.dumps({'operatorArchive':archive.name,'sha256':sha(archive),'bytes':archive.stat().st_size}))
