import argparse, concurrent.futures, importlib.util, json, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('remote',ROOT/'ops/production-build/deploy-rc2/remote.py');remote=importlib.util.module_from_spec(spec);spec.loader.exec_module(remote)
OUT=ROOT/'releases/stand-final-20261031/private'
p=argparse.ArgumentParser();p.add_argument('device',choices=['stela-pc','max-game-pc']);p.add_argument('--download-only',action='store_true');a=p.parse_args()
device=a.device;ident='final-20261031-v2-'+device;destination=OUT/device;destination.mkdir(parents=True,exist_ok=True)
remote_dir='C:/KDW-Stand/final-snapshots/'+ident
if not a.download_only:
 remote.run(device,"New-Item -ItemType Directory -Path '"+remote_dir+"' -Force|Out-Null")
 remote.upload(device,OUT/'known.json',remote_dir+'/known.json')
 print('Capturing '+device,flush=True)
 source=(ROOT/'ops/stand-freeze/snapshot.ps1').read_text(encoding='utf-8')
 result=remote.run(device,'& {\n'+source+'\n} -Id '+ident,timeout=600)
 (destination/'capture.json').write_text(result,encoding='utf-8')
 print(result,flush=True)
remote.download(device,destination/'manifest.json',remote_dir+'/manifest.json')
m=json.loads((destination/'manifest.json').read_text(encoding='utf-8-sig'))
def download(part):
 target=destination/part['name']
 if target.exists() and target.stat().st_size==part['bytes']:return
 remote.download(device,target,remote_dir+'/'+part['name'])
 print(device+' downloaded '+part['name']+' '+str(part['bytes']),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(download,m['archives']))
print('Downloaded '+device,flush=True)
