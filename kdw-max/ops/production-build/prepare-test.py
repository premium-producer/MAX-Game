from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[2]
out=root/'.cache/stand-integration'
out.mkdir(parents=True,exist_ok=True)
app=out/'apps/max-game'
app.mkdir(parents=True,exist_ok=True)
for name in ['launcher','settings']:
 shutil.copytree(root/'apps/max-game'/name,app/name,dirs_exist_ok=True)
shutil.copy2(root/'apps/STARTUP/tools/Launch.ps1',app/'launcher/Launch.ps1')
shutil.copy2(root/'.cache/spout-prototype/build/Release/kdw_spout.node',app/'launcher/kdw_spout.node')
if not (app/'www').exists():shutil.copytree(root/'apps/max-game/www',app/'www')
else:
 for name in ['app.js','stand-background.js','stand-background.html']:
  shutil.copy2(root/'apps/max-game/www/webgl-v5'/name,app/'www/webgl-v5'/name)
config=json.loads((root/'apps/max-game/app.json').read_text(encoding='utf-8'))
config.update(output='spout-dual',port=18852)
(app/'app.json').write_text(json.dumps(config),encoding='utf-8')
settings=json.loads((app/'settings/stand.json').read_text(encoding='utf-8'))
settings['max']['entryMode']='manual'
(app/'settings/stand.json').write_text(json.dumps(settings),encoding='utf-8')
(app/'data').mkdir(exist_ok=True)
(app/'data/lidar.local.json').write_text(json.dumps({'enabled':True,'bindAddress':'127.0.0.1','sourceAddress':'127.0.0.1','port':19001,'timeoutMs':350,'width':3072,'height':1536,'rawPoints':[[0,0],[1,0],[1,1],[0,1]],'targetPoints':[[0,0],[3072,0],[3072,1536],[0,1536]]}),encoding='utf-8')
print(app)
