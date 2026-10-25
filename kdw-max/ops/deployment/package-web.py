"""Package a web release only; never the private development folder."""
from pathlib import Path
import sys,zipfile,json,hashlib
root=Path(__file__).resolve().parents[2]
kind,release=sys.argv[1:]
assert kind in ('max-game','stela') and len(release)==20 and all(c in '0123456789abcdef' for c in release)
source=root/'dist'/(kind+'-web')
if kind=='stela': source=source/release
assert source.is_dir(), source
if kind=='max-game': assert json.loads((source/'release.json').read_text())['release']==release
name=('MAX-Game-Web-' if kind=='max-game' else 'MAX-Stela-Web-No-Photo-')+release+'.zip'
target=root/'dist'/name
assert not target.exists(), 'Archive already exists; keep immutable exports'
with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(source.rglob('*')):
  assert not p.is_symlink()
  if p.is_file():
   rel=p.relative_to(source)
   if kind=='max-game' and rel.parts[0]=='releases' and rel.parts[1]!=release: continue
   assert not any(x in rel.parts for x in ('data','private','node_modules'))
   z.write(p,rel.as_posix())
print(json.dumps({'archive':str(target),'bytes':target.stat().st_size,'sha256':hashlib.file_digest(target.open('rb'),'sha256').hexdigest()}))
