import concurrent.futures,hashlib,json,os,pathlib,stat,sys,urllib.request,zipfile
deployment,release,archive_sha,expected_old=sys.argv[1:]
root=pathlib.Path('/srv/projects/futuronika/df/max-game-client')
old=(root/'current').resolve();assert str(old)==expected_old and old.is_relative_to(root/'releases')
incoming=root/'.incoming'/deployment;target=root/'releases'/deployment
sha=lambda b:hashlib.sha256(b).hexdigest()
archive=incoming/('MAX-Game-Web-'+release+'.zip')
assert sha(archive.read_bytes())==archive_sha and not target.exists()
target.mkdir(mode=0o755)
with zipfile.ZipFile(archive) as z:
 for item in z.infolist():
  name=pathlib.PurePosixPath(item.filename)
  assert not name.is_absolute() and '..' not in name.parts and not stat.S_ISLNK(item.external_attr>>16)
  dest=target.joinpath(*name.parts);assert dest.resolve().is_relative_to(target)
  if item.is_dir():dest.mkdir(parents=True,exist_ok=True,mode=0o755)
  else:dest.parent.mkdir(parents=True,exist_ok=True,mode=0o755);dest.write_bytes(z.read(item));dest.chmod(0o644)
m=json.loads((target/'releases'/release/'asset-manifest.json').read_text())
for name,pin in m['files'].items():
 b=(target/'releases'/release/name).read_bytes();assert len(b)==pin['bytes'] and sha(b)==pin['sha256'],name
retained=[]
for p in (old/'releases').iterdir():
 assert p.resolve().is_relative_to(root/'releases')
 assert not (target/'releases'/p.name).exists()
 (target/'releases'/p.name).symlink_to(p.resolve());retained.append(p.name)
def swap(dest):
 tmp=root/('current.'+deployment);assert not tmp.exists() and not tmp.is_symlink()
 tmp.symlink_to(dest);os.replace(tmp,root/'current')
base='https://futuronika.pro/df/max-game-client/'
def get(name,headers=None):
 with urllib.request.urlopen(urllib.request.Request(base+name,headers=headers or {}),timeout=30) as r:return r.status,dict(r.headers),r.read()
def check(name):
 status,headers,data=get('releases/'+release+'/'+name);pin=m['files'][name]
 assert status==200 and len(data)==pin['bytes'] and sha(data)==pin['sha256'],name
 if name.endswith('.webp'):assert headers['Content-Type'].split(';')[0]=='image/webp'
 return name
try:
 assert (root/'current').resolve()==old
 swap(target)
 assert json.loads(get('release.json')[2])['release']==release
 names=['entry.js','webgl-v5/app.js','webgl-v5/kdw-interactions.css']+[n for n in m['files'] if '/business-cards-v1/' in n or '/business-ui/choice-' in n or n.endswith('/business-ui/choice.svg')]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:checked=list(pool.map(check,names))
 assert get('releases/'+release+'/'+m['standby']['video']['path'],{'Range':'bytes=0-1023'})[0]==206
 for previous in retained:assert get('releases/'+previous+'/entry.js')[0]==200
except BaseException:
 swap(old);raise
receipt={'passed':True,'deployment':deployment,'release':release,'previous':str(old),'filesVerified':len(m['files']),'httpsVerified':checked,'retainedImmutableReleases':retained,'videoRange206':True}
(incoming/'deployment.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
