"""Prepare public exact runtime archives, separate from private operational capture."""
import collections, csv, hashlib, json, pathlib, re, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'releases/stand-final-20261031';PRIVATE=OUT/'private';PUBLIC=OUT/'public';DOC=ROOT/'docs/stand-final-20261031'
PUBLIC.mkdir(parents=True,exist_ok=True);DOC.mkdir(parents=True,exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
receipts=[]
for device,app in [('max-game-pc','max-game'),('stela-pc','stela')]:
 manifest=json.loads((PRIVATE/device/'manifest.json').read_text(encoding='utf-8-sig'))
 assert json.loads((PRIVATE/device/'verified.json').read_text())['allCapturedObjectsVerified']
 base='stand/releases/KDW-Stand-20261027-RC4-1/apps/'+app+'/'
 selected=[];differences=[];pins={};excluded=collections.Counter()
 for row in manifest['files']:
  if not row['path'].startswith(base):continue
  rel=row['path'][len(base):];top=rel.split('/')[0]
  # No data/settings/plugins/runtime or operational manifests enter a public archive.
  allow=top in ('launcher','www') or '/' not in rel and (rel.endswith('.bat') or rel=='app.json')
  if not allow:excluded[top]+=1;continue
  assert not re.search(r'(^|/)(private|secrets|data|profile|node_modules)(/|$)|\.local\.|\.(pem|key|pfx|db|jsonl|log)$',rel,re.I),rel
  source=PRIVATE/'objects'/row['sha256'];assert sha(source)==row['sha256']
  if rel=='app.json':
   config=json.loads(source.read_text(encoding='utf-8-sig'));assert set(config)<=set('id title version port entry window verifyExpression production output'.split()),'Review app profile keys'
  pins['apps/'+app+'/'+rel]={'bytes':row['bytes'],'sha256':row['sha256']};selected.append((row,rel,source))
  current=ROOT/'apps'/app/rel
  if top in ('launcher','www') and (not current.exists() or sha(current)!=row['sha256']):
   differences.append({'path':rel,'installedSha256':row['sha256'],'workingSha256':sha(current) if current.exists() else None})
   # Keep the small exact installed overrides in Git as well as in release ZIPs.
   target=DOC/('installed-'+app)/rel;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(source.read_bytes())
 code_manifest={'snapshot':'stand-final-20261031','application':app,'captureStartedUtc':manifest['startedUtc'],'captureCompletedUtc':manifest['completedUtc'],'files':pins,'localSourceDifferences':differences,'excludedPrivateCategories':dict(excluded)}
 save(DOC/('runtime-'+app+'.json'),code_manifest)
 archive=PUBLIC/(app+'-stand-final-20261031.zip')
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for row,rel,source in selected:z.write(source,'apps/'+app+'/'+rel)
  z.writestr('runtime-manifest.json',json.dumps(code_manifest,ensure_ascii=False,indent=2))
  z.writestr('RESTORE.txt','Exact captured application code and media. Overlay onto an existing KDW Windows installation with the bundled Electron/runtime. Preserve data, settings, secrets, plugins and hardware profiles. Full original installations and raw logs are in the private local archive. This package does not change hardware configuration. Do not rebuild before restoring: working source may be newer than installed shared runtime files.\n')
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  for name,pin in pins.items():assert hashlib.sha256(z.read(name)).hexdigest()==pin['sha256']
 receipts.append({'application':app,'files':len(pins),'archive':archive.name,'bytes':archive.stat().st_size,'sha256':sha(archive),'workingRuntimeDifferences':len(differences)})
save(PUBLIC/'runtime-archives.json',receipts)
print(json.dumps(receipts))
