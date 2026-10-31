"""Content-addressed private stand archive; never publishes operational data."""
import argparse, hashlib, json, pathlib, shutil, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'releases/stand-final-20261031'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def known():
 index={}
 folders=['apps/max-game/www','apps/max-game/launcher','apps/stela/www','apps/stela/launcher','production/KDW-Stand-20261027-RC4-1']
 for folder in folders:
  for p in (ROOT/folder).rglob('*'):
   if p.is_file() and not p.is_symlink() and not any(x in ('node_modules','.git','archives','data','private','secrets') for x in p.relative_to(ROOT/folder).parts):
    digest=sha(p);index.setdefault(digest,str(p))
 OUT.mkdir(parents=True,exist_ok=True)
 (OUT/'private').mkdir(exist_ok=True)
 (OUT/'private/known-index.json').write_text(json.dumps(index),encoding='utf-8')
 (OUT/'private/known.json').write_text(json.dumps(list(index)),encoding='utf-8')
 print(json.dumps({'knownObjects':len(index)}))
def ingest(device):
 dest=OUT/'private'/device;m=json.loads((dest/'manifest.json').read_text(encoding='utf-8-sig'))
 objects=OUT/'private/objects';objects.mkdir(exist_ok=True)
 for part in m['archives']:
  p=dest/part['name'];assert sha(p)==part['sha256'],p
  with zipfile.ZipFile(p) as z:
   for name in z.namelist():
    digest=name.removeprefix('objects/');assert len(digest)==64 and all(c in '0123456789abcdef' for c in digest)
    target=objects/digest
    if not target.exists():
     with z.open(name) as src,target.open('wb') as dst:shutil.copyfileobj(src,dst)
    assert sha(target)==digest
 index=json.loads((OUT/'private/known-index.json').read_text(encoding='utf-8'))
 for digest in {f['sha256'] for f in m['files']}:
  p=objects/digest
  if not p.exists():
   source=pathlib.Path(index[digest]);assert sha(source)==digest,source
   shutil.copyfile(source,p)
  assert sha(p)==digest
 receipt={'device':device,'files':len(m['files']),'logicalBytes':sum(f['bytes'] for f in m['files']),'errors':m['errors'],'manifestSha256':sha(dest/'manifest.json'),'allCapturedObjectsVerified':True}
 (dest/'verified.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
 print(json.dumps({k:v for k,v in receipt.items() if k!='errors'}))
def restore(device,destination,prefix):
 m=json.loads((OUT/'private'/device/'manifest.json').read_text(encoding='utf-8-sig'));destination=pathlib.Path(destination).resolve()
 if destination.exists():raise RuntimeError('Restore destination must not exist')
 for row in m['files']:
  if not row['path'].startswith(prefix):continue
  rel=row['path'][len(prefix):];target=(destination/rel).resolve();target.relative_to(destination)
  source=OUT/'private/objects'/row['sha256'];assert sha(source)==row['sha256']
  target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
 print('Restored '+str(destination))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('action',choices=['known','ingest','restore']);p.add_argument('--device');p.add_argument('--destination');p.add_argument('--prefix',default='stand/releases/KDW-Stand-20261027-RC4-1/');a=p.parse_args()
 if a.action=='known':known()
 elif a.action=='ingest':ingest(a.device)
 else:restore(a.device,a.destination,a.prefix)
