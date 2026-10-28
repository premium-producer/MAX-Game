"""Prepare new code overlays for the existing installer. Local only; no connections."""
import argparse,hashlib,json,pathlib,re,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[3]
def digest(file):return hashlib.sha256(file.read_bytes()).hexdigest()
def prepare(root,spec,output):
 patch=spec['id'];release=spec['release']
 if not re.fullmatch(r'[A-Z0-9][A-Z0-9-]{2,79}',patch):raise ValueError('Invalid patch id')
 if not re.fullmatch(r'C:/KDW-Stand/releases/[A-Za-z0-9_-]+',release):raise ValueError('Invalid release path')
 if output.exists():raise ValueError('Package directory already exists; never replace a dispatched package')
 base=(root/spec['base']).resolve();previous={}
 for relative in spec.get('previousPlans',[]):
  plan=json.loads((root/relative).read_text(encoding='utf-8-sig'))
  if plan['release']!=release:raise ValueError('Previous plan targets a different release')
  for f in plan['files']:
   old=previous.get(f['path'])
   if old is None:
    original=base/f['path'];old=digest(original) if original.exists() else None
   if old!=f['before']:raise ValueError('Broken baseline chain: '+f['path'])
   previous[f['path']]=f['sha256']
 rows=[]
 for relative in dict.fromkeys(spec['files']):
  if not (re.fullmatch(r'apps/(max-game|stela)/(launcher|www)/[A-Za-z0-9_. /-]+',relative) or relative in ('apps/stela/Start-Recorded.bat','apps/stela/Start-Generated.bat','apps/stela/Start-Touch-Recorded.bat')) or any(p in ('','..','.') for p in relative.split('/')):raise ValueError('Only application launcher/www code can be patched')
  source=(root/relative).resolve();source.relative_to(root.resolve())
  old=base/relative;before=previous.get(relative,digest(old) if old.exists() else None);after=digest(source)
  if before!=after:rows.append({'path':relative,'before':before,'sha256':after,'bytes':source.stat().st_size})
 if not rows:raise ValueError('No changes against the confirmed baseline')
 plan={'id':patch,'release':release,'applications':sorted({r['path'].split('/')[1] for r in rows}),'files':rows}
 # User policy (2026-10-27): an explicitly requested deployment may interrupt visitors.
 if spec.get('interruptVisitors', True) is True:plan['interruptVisitors']=True
 output.mkdir(parents=True);(output/'plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
 with zipfile.ZipFile(output/'patch.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  z.write(output/'plan.json','plan.json');z.write(pathlib.Path(__file__).with_name('install.ps1'),'install.ps1')
  for row in rows:z.write(root/row['path'],'payload/'+row['path'])
 package={'sha256':digest(output/'patch.zip'),'bytes':(output/'patch.zip').stat().st_size,'files':len(rows)}
 (output/'package.json').write_text(json.dumps(package,indent=2),encoding='utf-8');return package
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--spec',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path);a=p.parse_args()
 print(json.dumps(prepare(ROOT,json.loads(a.spec.read_text(encoding='utf-8-sig')),a.output)))
