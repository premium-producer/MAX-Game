import concurrent.futures,json,pathlib,sys,argparse
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2];sys.path.insert(0,str(HERE.parent/'deploy-rc2'));import remote
REPORT=ROOT/'docs/verification-desktop-startup-20261027';REPORT.mkdir(parents=True,exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('mode',choices=['inventory','organize'],default='inventory',nargs='?');a=p.parse_args()
def work(device):
 try:
  if a.mode=='inventory':
   data=json.loads(remote.run(device,(HERE/'inventory.ps1').read_text(encoding='utf-8'),timeout=60));(REPORT/(device+'-before.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');return {'device':device,**data}
  before=json.loads((REPORT/(device+'-before.json')).read_text(encoding='utf-8'));moves=[]
  for item in before['items']:
   target=item.get('target','').replace('\\','/')
   if item['extension']!='.lnk' or not target.startswith('C:/KDW-Stand/releases/'):continue
   current=target.startswith(before['release']+'/');name=target.rsplit('/',1)[1].replace('.bat','.lnk') if current else 'old/'+item['name']
   moves.append({'source':item['path'],'target':item['target'],'destination':name,'current':current})
  plan={'desktop':before['desktop'],'moves':moves};(REPORT/(device+'-plan.json')).write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
  source="$plan='"+json.dumps(plan).replace("'","''")+"'|ConvertFrom-Json;\n"+(HERE/'organize.ps1').read_text(encoding='utf-8')
  data=json.loads(remote.run(device,source,timeout=60));(REPORT/(device+'-after.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');return {'device':device,**data}
 except Exception as e:return {'device':device,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for value in pool.map(work,['max_right','stella']):print(json.dumps(value,ensure_ascii=False))
