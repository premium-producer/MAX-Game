import pathlib,sys,json,concurrent.futures
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(HERE.parent/'deploy-rc2'));import remote
out=ROOT/'docs/verification-operator-rc4-20261027';out.mkdir(exist_ok=True)
def collect(device):
 try:
  for name in ['install-status','integrity','verify-status','start-status','probe-status']:
   raw=remote.run(device,f"Get-Content 'C:/KDW-Stand/deploy/RC4-1/{name}.json' -Raw")
   value=json.loads(raw);(out/(device+'-'+name+'.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  health=json.loads(remote.run(device,"$m=Invoke-RestMethod http://127.0.0.1:18752/__kdw/health;$s=Invoke-RestMethod http://127.0.0.1:18751/__kdw/health;$p=Invoke-RestMethod http://127.0.0.1:18751/__kdw/settings;@{computer=$env:COMPUTERNAME;maxVersion=$m.version;stellaVersion=$s.version;pairedSettingsOnline=(-not $p.offline -and -not $p.error);revision=$p.revision;entryMode=$p.value.max.entryMode;stellaCommand=(Get-CimInstance Win32_Process -Filter \"ProcessId=$($s.pid)\").CommandLine}|ConvertTo-Json"))
  health['stellaServeOnly']='--serve-only' in health.pop('stellaCommand','')
  (out/(device+'-health.json')).write_text(json.dumps(health,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  if device!='stella':
   folder=out/device/'receiver';folder.mkdir(parents=True,exist_ok=True)
   for name in ['receiver.csv','receiver-summary.json']:remote.download(device,folder/name,'C:/KDW-Stand/deploy/RC4-1/receiver/'+name)
  return {'device':device,'collected':True,'health':health}
 except Exception as e:return {'device':device,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as p:
 for r in p.map(collect,sys.argv[1:] or ['chuwi','max_right','stella']):print(json.dumps(r,ensure_ascii=False))
