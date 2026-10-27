"""Verify a completed release set and prove local credentials are absent from its public ZIPs."""
from pathlib import Path
import argparse,hashlib,json,zipfile
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);a=p.parse_args();root=a.directory.resolve()
meta=json.loads((root/'release-set.json').read_text(encoding='utf-8'))
secrets=[]
def collect(value,key=''):
 if isinstance(value,dict):
  for k,v in value.items():collect(v,k)
 elif isinstance(value,list):
  for v in value:collect(v,key)
 elif isinstance(value,str) and len(value)>12 and any(x in key.lower() for x in ['apikey','api_key','token','secret','password']):secrets.append(value.encode())
for f in (root/'apps/stela/data').glob('*.json'):collect(json.loads(f.read_text(encoding='utf-8-sig')))
reports=[]
for name,asset in meta['applications'].items():
 archive=root/'archives'/asset['archive'];assert hashlib.sha256(archive.read_bytes()).hexdigest()==asset['sha256']
 manifest=json.loads((root/'apps'/name/'release-manifest.json').read_text(encoding='utf-8'))
 assert manifest['sharedRevision']==meta['sharedRevision']
 with zipfile.ZipFile(archive) as z:
  expected={'apps/'+name+'/'+n for n in [*manifest['files'],'release-manifest.json']}
  assert set(z.namelist())==expected
  for rel,pin in manifest['files'].items():
   assert not set(Path(rel).parts)&{'data','runtime','plugins','source','node_modules','.git'}
   raw=z.read('apps/'+name+'/'+rel)
   assert len(raw)==pin['bytes'] and hashlib.sha256(raw).hexdigest()==pin['sha256']
   assert (root/'apps'/name/rel).read_bytes()==raw
   if Path(rel).suffix.lower() in ['.json','.js','.cjs','.mjs','.html','.txt','.md','.ps1','.bat']:
    assert not any(s in raw for s in secrets),'Credential value found in public archive'
 reports.append({'application':name,'files':len(expected),'archiveBytes':asset['bytes'],'sha256':asset['sha256']})
report={'passed':True,'releaseId':meta['releaseId'],'applications':reports,'secretValueChecks':len(secrets),'dataRuntimePluginsExcluded':True}
(root/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
