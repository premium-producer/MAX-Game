"""Prepare new code overlays for the existing installer. Local only; no connections."""
import argparse,hashlib,json,pathlib,re,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[3]
def digest(file):return hashlib.sha256(file.read_bytes()).hexdigest()

def max_required_assets(root,files):
 """Include pinned runtime dependencies whenever the MAX bundle is shipped."""
 prefix='apps/max-game/www/'
 if not any(prefix+'webgl-v5/'+n in files for n in ('app.js','r9-build.json')):return {}
 manifest=root/(prefix+'webgl-v5/r9-build.json')
 if not manifest.exists():return {}
 required=json.loads(manifest.read_text(encoding='utf-8-sig')).get('requiredAssets',{})
 if not isinstance(required,dict):raise ValueError('Invalid MAX requiredAssets')
 result={}
 for name,pin in required.items():
  if not re.fullmatch(r'assets/kdw-native/[A-Za-z0-9_./-]+',name) or any(p in ('','..','.') for p in name.split('/')):raise ValueError('Invalid MAX asset path')
  source=(root/(prefix+name)).resolve();source.relative_to(root.resolve())
  if not source.is_file() or digest(source)!=pin:raise ValueError('Missing or changed required MAX asset: '+name)
  result[prefix+name]=pin
 return result

def check_max_asset_pair(root,base,previous,rows):
 """A tested JS bundle must travel with the CSS pinned by its build manifests."""
 prefix='apps/max-game/www/webgl-v5/'
 changed={r['path']:r['sha256'] for r in rows}
 names=('app.js','kdw-interactions.css','build.json','r9-build.json')
 if not any(prefix+n in changed for n in names):return
 def effective(name):
  relative=prefix+name;original=base/relative
  return changed.get(relative,previous.get(relative,digest(original) if original.exists() else None))
 manifests={}
 for name in ('build.json','r9-build.json'):
  source=root/(prefix+name)
  if not source.exists() or digest(source)!=effective(name):
   raise ValueError('Incomplete MAX asset set: include current '+prefix+name)
  manifests[name]=json.loads(source.read_text(encoding='utf-8-sig'))
 pins=manifests['build.json'].get('files',{})
 r9=manifests['r9-build.json']
 for name,other in [('app.js',r9.get('bundleSha256')),('kdw-interactions.css',r9.get('cssSha256'))]:
  expected=pins.get(name)
  if not expected or expected!=other or effective(name)!=expected:
   raise ValueError('Incomplete MAX asset set: bundle/CSS manifests disagree with planned '+prefix+name)
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
 # New HQ/personalized resources cannot silently be omitted by a short spec.
 required=max_required_assets(root,spec['files'])
 rows=[]
 for relative in dict.fromkeys([*spec['files'],*required]):
  if not (re.fullmatch(r'apps/(max-game|stela)/(launcher|www)/[A-Za-z0-9_. /-]+',relative) or relative in ('apps/stela/Start-Recorded.bat','apps/stela/Start-Generated.bat','apps/stela/Start-Touch-Recorded.bat','apps/stela/Start-Touch-Only-Recorded.bat','apps/stela/Start-Display-Only.bat')) or any(p in ('','..','.') for p in relative.split('/')):raise ValueError('Only application launcher/www code can be patched')
  source=(root/relative).resolve();source.relative_to(root.resolve())
  old=base/relative;before=previous.get(relative,digest(old) if old.exists() else None);after=digest(source)
  if before!=after:rows.append({'path':relative,'before':before,'sha256':after,'bytes':source.stat().st_size})
 if not rows:raise ValueError('No changes against the confirmed baseline')
 check_max_asset_pair(root,base,previous,rows)
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
