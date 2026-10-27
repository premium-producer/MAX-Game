import pathlib,sys,json,concurrent.futures,argparse
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(HERE.parent/'deploy-rc2'));import remote
out=ROOT/'docs/verification-operator-rc4-20261027'
SNAPSHOT="""
$base='C:/KDW-Stand/deploy/RC4-1';$reports=@{}
foreach($name in @('install-status','integrity','verify-status','start-status','probe-status')){
 $reports[$name]=Get-Content "$base/$name.json" -Raw|ConvertFrom-Json
}
$m=Invoke-RestMethod http://127.0.0.1:18752/__kdw/health
$s=Invoke-RestMethod http://127.0.0.1:18751/__kdw/health
$p=Invoke-RestMethod http://127.0.0.1:18751/__kdw/settings
$command=(Get-CimInstance Win32_Process -Filter "ProcessId=$($s.pid)").CommandLine
$health=@{computer=$env:COMPUTERNAME;maxVersion=$m.version;stellaVersion=$s.version;pairedSettingsOnline=(-not $p.offline -and -not $p.error);revision=$p.revision;entryMode=$p.value.max.entryMode;stellaServeOnly=($command -match '--serve-only')}
@{reports=$reports;health=$health}|ConvertTo-Json -Depth 20
"""
def collect(device,metrics=False,output=out):
 try:
  snapshot=json.loads(remote.run(device,SNAPSHOT));output.mkdir(parents=True,exist_ok=True)
  for name,value in snapshot['reports'].items():
   if name not in ['install-status','integrity','verify-status','start-status','probe-status']:raise ValueError('Unknown report')
   (output/(device+'-'+name+'.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  health=snapshot['health']
  (output/(device+'-health.json')).write_text(json.dumps(health,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  if metrics and device!='stella':
   folder=output/device/'receiver';folder.mkdir(parents=True,exist_ok=True)
   for name in ['receiver.csv','receiver-summary.json']:remote.download(device,folder/name,'C:/KDW-Stand/deploy/RC4-1/receiver/'+name)
  return {'device':device,'collected':True,'health':health}
 except Exception as e:return {'device':device,'error':str(e)}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('devices',nargs='+',choices=['max_right','stella']);parser.add_argument('--metrics',action='store_true',help='Download receiver CSV only when measuring Spout performance')
 args=parser.parse_args()
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as p:
  for r in p.map(lambda d:collect(d,args.metrics),args.devices):print(json.dumps(r,ensure_ascii=False))
