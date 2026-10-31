import pathlib,json,hashlib,subprocess,shutil,re
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'releases/stand-final-20261031/public';OUT.mkdir(parents=True,exist_ok=True)
SCAN=ROOT/'.cache/stand-final-20261031/scan'
secret_values=[]
def collect(v):
    if isinstance(v,dict):
        for k,x in v.items():
            if re.search(r'api.?key|secret|password|access.?token',k,re.I) and isinstance(x,str) and len(x)>15:secret_values.append(x.encode())
            else:collect(x)
    elif isinstance(v,list):
        for x in v:collect(x)
for rel in ['apps/stela/data/omni.local.json','apps/stela/data/voice-profiles/vasilisa-omni.json']:
    p=ROOT/rel
    if p.exists():collect(json.loads(p.read_text(encoding='utf-8-sig')))
rows=[]
for name,prefix in [('MAX-Game','kdw-max/'),('VK_Stella','')]:
    repo=ROOT/'github'/name
    git=['git','-c','safe.directory='+repo.as_posix(),'-C',str(repo)]
    changed=subprocess.check_output([*git,'ls-files','--modified','--others','--exclude-standard','-z']).decode().split('\0')
    changed=sorted(set(x for x in changed if x))
    mf=prefix+'docs/kdw-max/SOURCE_MANIFEST.json';pins=json.loads((repo/mf).read_text())['files']
    tracked=set(subprocess.check_output([*git,'ls-files','-z']).decode().split('\0'))
    changed=sorted(set(changed)|{name for name in pins if name not in tracked})
    for rel in changed:
        if rel not in pins and rel!=mf:raise RuntimeError('Unreviewed publication path: '+rel)
        if re.search(r'(^|/)(data|private|secrets|node_modules|runtime|\.git)(/|$)|\.local\.json$|\.(pem|key|pfx|p12|db|jsonl|log)$',rel,re.I):raise RuntimeError('Private path: '+rel)
        data=(repo/rel).read_bytes()
        if rel in pins and hashlib.sha256(data).hexdigest()!=pins[rel]['sha256']:raise RuntimeError('Manifest drift: '+rel)
        if any(v in data for v in secret_values):raise RuntimeError('Private literal in publication: '+rel)
        if pathlib.Path(rel).suffix.lower() in ['.js','.cjs','.mjs','.ts','.tsx','.json','.md','.html','.css','.py','.ps1','.bat','.txt','.toml','.yaml','.yml','.cpp','.h','.hpp']:
            dest=SCAN/name/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    rows.append({'repository':name,'reviewedFiles':len(changed),'privateLiteralFindings':0,'paths':changed})
(OUT/'publication-review.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps([{'repository':r['repository'],'reviewedFiles':r['reviewedFiles']} for r in rows]))
