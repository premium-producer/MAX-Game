"""Small immutable RC4 -> RC4-1 overlays; full RC4-1 manifests verify every installed file."""
import pathlib,json,hashlib,zipfile
root=pathlib.Path(__file__).resolve().parents[2];new=root/'production/KDW-Stand-20261027-RC4-1';old=root/'production/KDW-Stand-20261027-RC4'
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
result={'base':'KDW-Stand-20261027-RC4','release':'KDW-Stand-20261027-RC4-1','applications':{}}
for name in ['max-game','stela']:
 a=old/'apps'/name;b=new/'apps'/name
 before=json.loads((a/'release-manifest.json').read_text(encoding='utf-8'));after=json.loads((b/'release-manifest.json').read_text(encoding='utf-8'))
 changed=[n for n,v in after['files'].items() if before['files'].get(n)!=v]
 archive=new/'archives'/f'{name}-RC4-to-RC4-1.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for n in [*changed,'release-manifest.json']:z.write(b/n,'apps/'+name+'/'+n)
 result['applications'][name]={'name':archive.name,'bytes':archive.stat().st_size,'sha256':sha(archive),'changed':len(changed),'baseManifestSha256':sha(a/'release-manifest.json'),'removed':sorted(set(before['files'])-set(after['files']))}
(new/'delta.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
(new/'archives/SHA256SUMS.txt').write_text('\n'.join(f'{sha(f)}  {f.name}' for f in sorted((new/'archives').glob('*.zip')))+'\n',encoding='utf-8')
print(json.dumps(result))
