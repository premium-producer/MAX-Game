"""Synchronize code in existing derived kits, retaining profiles and private data."""
import pathlib,json,hashlib,shutil
ROOT=pathlib.Path(__file__).resolve().parents[2]
ARCHIVE=ROOT/'.sync/archive/sync-20261028-kits'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rows=[]
def write(src,dst):
    if dst.exists() and sha(src)==sha(dst):return False
    resolved=dst.resolve();resolved.relative_to((ROOT/'production').resolve())
    if dst.exists():
        backup=ARCHIVE/dst.relative_to(ROOT);backup.parent.mkdir(parents=True,exist_ok=True)
        if backup.exists():raise RuntimeError('Backup exists: '+str(backup))
        shutil.copy2(dst,backup)
    dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
    if sha(src)!=sha(dst):raise RuntimeError('Copy verification failed')
    return True
for kit,names in [('dev',['max-game','stela']),('startup-one-pc',['max-game','stela']),('startup-max',['max-game']),('startup-stela',['stela'])]:
    parent=ROOT/'production'/kit
    if kit=='dev':parent=parent/'apps'
    for name in names:
        src=ROOT/'apps'/name;dst=parent/name
        if not (dst/'app.json').exists():raise RuntimeError('Missing existing profile')
        pins={f:sha(dst/f) for f in ['app.json','settings/stand.json'] if (dst/f).exists()}
        inventory=json.loads((src/'package-manifest.json').read_text())['files'];changed=[]
        for rel,pin in inventory.items():
            top=rel.split('/')[0]
            if top not in ['launcher','www','source'] or (top=='source' and kit!='dev'):continue
            if sha(src/rel)!=pin['sha256']:raise RuntimeError('Canonical file changed: '+rel)
            if write(src/rel,dst/rel):changed.append(rel)
        for rel,h in pins.items():assert sha(dst/rel)==h
        manifest=dst/'package-manifest.json';old=json.loads(manifest.read_text());files={}
        for f in dst.rglob('*'):
            rel=f.relative_to(dst)
            if not f.is_file() or any(x in ['data','node_modules','package-manifest.json','.DS_Store','Thumbs.db'] for x in rel.parts):continue
            files[rel.as_posix()]={'bytes':f.stat().st_size,'sha256':sha(f)}
        old['files']=files
        backup=ARCHIVE/manifest.relative_to(ROOT);backup.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(manifest,backup);manifest.write_text(json.dumps(old,indent=2)+'\n',encoding='utf-8')
        rows.append({'kit':kit,'app':name,'changed':len(changed),'profilesPreserved':True,'paths':changed})
    if kit=='dev':
        for src in (ROOT/'apps/STARTUP').rglob('*'):
            if src.is_file() and not any(x in ['node_modules','data','runtime'] for x in src.relative_to(ROOT/'apps/STARTUP').parts):write(src,parent/'STARTUP'/src.relative_to(ROOT/'apps/STARTUP'))
    delivery=ROOT/'production'/kit/'delivery-manifest.json'
    if delivery.exists():
        old=json.loads(delivery.read_text());base=delivery.parent;files={}
        for f in base.rglob('*'):
            rel=f.relative_to(base)
            if not f.is_file() or any(x in ['data','node_modules','delivery-manifest.json','package-manifest.json','.DS_Store','Thumbs.db'] for x in rel.parts):continue
            files[rel.as_posix()]={'bytes':f.stat().st_size,'sha256':sha(f)}
        backup=ARCHIVE/delivery.relative_to(ROOT);backup.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(delivery,backup)
        old['files']=files;delivery.write_text(json.dumps(old,indent=2)+'\n',encoding='utf-8')
(ROOT/'docs/sync/SYNC-20261028/local-kits.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps([{'kit':r['kit'],'app':r['app'],'changed':r['changed']} for r in rows]))
