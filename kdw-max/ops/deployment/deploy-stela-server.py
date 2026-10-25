"""Guarded update; arguments: release, archive SHA256, expected current absolute path."""
import hashlib,json,os,pathlib,stat,subprocess,time,urllib.request,zipfile,sys,re
base=pathlib.Path('/srv/projects/futuronika/df/max-info-panel')
release,archive_sha,expected_previous=sys.argv[1:]
assert re.fullmatch(r'[a-f0-9]{20}',release) and re.fullmatch(r'[a-f0-9]{64}',archive_sha)
previous=pathlib.Path(expected_previous);assert previous.is_relative_to(base/'releases')
target=base/'releases'/release
current=base/'current';archive=base/'.incoming'/('MAX-Stela-Web-No-Photo-'+release+'.zip')
sha=lambda b:hashlib.sha256(b).hexdigest()
assert current.resolve()==previous and not target.exists()
assert sha(archive.read_bytes())==archive_sha
routes={str(p):sha(p.read_bytes()) for p in pathlib.Path('/etc/caddy/sites-enabled').glob('*.caddy')}
routes['/etc/caddy/Caddyfile']=sha(pathlib.Path('/etc/caddy/Caddyfile').read_bytes())
unit=pathlib.Path('/etc/systemd/system/max-info-panel.service');unit_sha=sha(unit.read_bytes())
private=[p for p in (base/'shared/data').rglob('*') if p.is_file() and ('logs' not in p.relative_to(base/'shared/data').parts)]
private_sha={str(p):sha(p.read_bytes()) for p in private}
def get(name):
 with urllib.request.urlopen('https://futuronika.pro/df/max-info-panel/'+name,timeout=25) as r:return r.status,r.read()
assert not json.loads(get('__kdw/voice/status')[1])['busy']
assert not json.loads(get('__kdw/audio/config')[1])['busy']
target.mkdir(mode=0o755)
with zipfile.ZipFile(archive) as package:
 for item in package.infolist():
  name=pathlib.PurePosixPath(item.filename)
  assert not name.is_absolute() and '..' not in name.parts and not stat.S_ISLNK(item.external_attr>>16)
  dest=target.joinpath(*name.parts);assert dest.resolve().is_relative_to(target)
  if item.is_dir():dest.mkdir(parents=True,exist_ok=True,mode=0o755)
  else:dest.parent.mkdir(parents=True,exist_ok=True,mode=0o755);dest.write_bytes(package.read(item));dest.chmod(0o644)
manifest=json.loads((target/'manifest.json').read_text());assert manifest['release']==release
assert manifest['pages']['pixelsNoPhoto']['photo'] is False
for name,record in manifest['files'].items():
 p=target/name;b=p.read_bytes();assert len(b)==record['bytes'] and sha(b)==record['sha256'],name
(target/'data').symlink_to('../../shared/data')
retained=[]
for old in (previous/'public/releases').iterdir():
 assert len(old.name)==20 and old.resolve().is_relative_to(base/'releases')
 (target/'public/releases'/old.name).symlink_to(old.resolve());retained.append(old.name)
def swap(dest):
 temp=base/'current.next-no-photo';assert not temp.is_symlink() and not temp.exists();temp.symlink_to(dest);os.replace(temp,current)
def restart():subprocess.run(['systemctl','restart','max-info-panel'],check=True)
swapped=False
try:
 assert current.resolve()==previous
 assert not json.loads(get('__kdw/voice/status')[1])['busy'] and not json.loads(get('__kdw/audio/config')[1])['busy']
 swap(target);swapped=True;restart()
 for n in range(25):
  try:
   voice=json.loads(get('__kdw/voice/status')[1]);assert voice['configured'] and voice['speechVoice']=='Vasilisa';break
  except Exception:
   if n==24:raise
   time.sleep(.4)
 status,html=get('pixels-no-photo/');assert status==200 and b'data-stela-variant="pixels-no-photo"' in html
 assert b'data-stela-variant=' not in get('')[1]
 for old in retained:assert sha(get('releases/'+old+'/assets/app.js')[1])==sha((previous/'public/releases'/old/'assets/app.js').read_bytes())
 for name,digest in routes.items():assert sha(pathlib.Path(name).read_bytes())==digest,name
 assert sha(unit.read_bytes())==unit_sha
 for name,digest in private_sha.items():assert sha(pathlib.Path(name).read_bytes())==digest,name
 for service in ['max-info-panel','caddy','max-asset-audit']:subprocess.run(['systemctl','is-active','--quiet',service],check=True)
 receipt={'pass':True,'release':release,'previous':str(previous),'url':'https://futuronika.pro/df/max-info-panel/pixels-no-photo/','filesVerified':len(manifest['files']),'retainedImmutableReleases':retained,'routesAndServiceUnitUnchanged':True,'privateConfigAndPresetsUnchanged':True}
 (base/'shared/deployment-no-photo.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
except BaseException:
 if swapped and current.resolve()==target:swap(previous);restart()
 raise
