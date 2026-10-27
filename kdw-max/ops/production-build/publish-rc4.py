"""Publish the approved pixel-default production candidate, without private provisioning."""
import hashlib,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2];REL=ROOT/'production/KDW-Stand-20261027-RC4';TAG='stand-production-20261027-rc4'
mapping=json.loads((ROOT/'ops/sync/paths.json').read_text(encoding='utf-8'));receipts=[]
def run(args,cwd=None):return subprocess.check_output(args,cwd=cwd,text=True,encoding='utf-8').strip()
for repo,app in [('MAX-Game','max-game'),('VK_Stella','stela')]:
    folder=ROOT/'github'/repo;git=['git','-c','safe.directory='+folder.as_posix(),'-C',str(folder)]
    assert run(git+['branch','--show-current'])=='kdw-max'
    allowed={mapping['repositories'][repo]['prefix']+name for name,owners in mapping['files'].items() if repo in owners}
    allowed.add(mapping['repositories'][repo]['prefix']+'docs/kdw-max/SOURCE_MANIFEST.json')
    assert set(run(git+['diff','--cached','--name-only']).splitlines()).issubset(allowed),'Unrelated staged work'
    entries=subprocess.check_output(git+['status','--porcelain','--untracked-files=all'],text=True,encoding='utf-8').splitlines()
    paths=[line[3:] for line in entries]
    paths+= [mapping['repositories'][repo]['prefix']+'ops/production-build/'+n for n in ['build-stand.py','check-stand.py','prepare-stand-tools.py','Install-Runtime.ps1','Output-Control.ps1']]
    tracked=set(run(git+['ls-files']).splitlines())
    paths += sorted(p for p in allowed-tracked if (folder/p).is_file())
    paths=list(dict.fromkeys(paths))
    assert all(p in allowed for p in paths), 'Unrelated repository changes'
    if paths:
        subprocess.run(git+['add','--sparse','-f','--',*paths],check=True)
        if run(git+['diff','--cached','--name-only']):subprocess.run(git+['commit','-m','Add original Stella soundtrack and stand operator panels'],check=True)
    commit=run(git+['rev-parse','HEAD']);subprocess.run(git+['push','origin','kdw-max'],check=True)
    notes=REL/'archives'/('notes-'+app+'.md')
    notes.write_text('Original music and event sounds from the previous dual-brand Stella, with separate levels and an AEC-referenced output. Pixel Stella remains final; old voices are not included. Browser operator panels start with each app or via Start-Admin.bat. MAX adds cursor visibility, LiDAR calibration with four corners and center verification, and explicit ARM control.\n\nBoth applications are installable on either stand PC. RC3-to-RC4 overlays require the pinned RC3 base and full RC4 file verification. Preserve existing data, settings, plugins and app launch profiles. Local secrets and runtime are excluded. Physical LiDAR/acoustic acceptance remains required.\n',encoding='utf-8')
    repoArg='premium-producer/'+repo
    exists=subprocess.run(['gh','release','view',TAG,'--repo',repoArg,'--json','isDraft'],capture_output=True)
    if exists.returncode:
        subprocess.run(['gh','release','create',TAG,'--repo',repoArg,'--target',commit,'--title','Production stand RC4 — operator panels and original soundtrack','--notes-file',str(notes),'--draft','--prerelease'],check=True)
    assets=[REL/'archives'/f'{app}-KDW-Stand-20261027-RC4.zip',REL/'archives/stand-tools-KDW-Stand-20261027-RC4.zip',REL/'archives/SHA256SUMS.txt',REL/'release-set.public.json',REL/'archives'/f'{app}-RC3-to-RC4.zip',REL/'delta.json']
    release_id=json.loads(run(['gh','release','view',TAG,'--repo',repoArg,'--json','databaseId']))['databaseId']
    release=json.loads(run(['gh','api',f'repos/{repoArg}/releases/{release_id}']))
    existing={a['name']:a for a in release['assets']}
    for f in assets:
        if f.name not in existing:subprocess.run(['gh','release','upload',TAG,str(f),'--repo',repoArg],check=True)
    release=json.loads(run(['gh','api',f'repos/{repoArg}/releases/{release["id"]}']));actual={a['name']:a for a in release['assets']}
    for f in assets:
        assert actual[f.name]['size']==f.stat().st_size
        assert actual[f.name]['digest']=='sha256:'+hashlib.sha256(f.read_bytes()).hexdigest()
    subprocess.run(['gh','release','edit',TAG,'--repo',repoArg,'--draft=false','--prerelease','--latest=false'],check=True)
    published=json.loads(run(['gh','api',f'repos/{repoArg}/releases/{release_id}']))
    receipts.append({'repository':repoArg,'commit':commit,'url':published['html_url'],'assetsVerified':len(assets)})
(REL/'github-publication.json').write_text(json.dumps(receipts,indent=2),encoding='utf-8')
print(json.dumps(receipts))
