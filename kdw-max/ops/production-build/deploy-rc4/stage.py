"""Get short-lived asset URLs locally; remote PCs download pinned GitHub overlays."""
import concurrent.futures,hashlib,json,pathlib,subprocess,sys,urllib.request,urllib.error
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2];REL=ROOT/'production/KDW-Stand-20261027-RC4-1';OUT=ROOT/'.cache/rc4-deploy';OUT.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(HERE.parent/'deploy-rc2'));import remote
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return None
token=subprocess.check_output(['gh','auth','token'],text=True).strip();opener=urllib.request.build_opener(NoRedirect);assets=[]
for repo,app in [('MAX-Game','max-game'),('VK_Stella','stela')]:
 release=json.loads(subprocess.check_output(['gh','api',f'repos/premium-producer/{repo}/releases/tags/stand-production-20261027-rc4-1']))
 asset=next(a for a in release['assets'] if a['name']==f'{app}-RC4-to-RC4-1.zip')
 try:opener.open(urllib.request.Request(asset['url'],headers={'Authorization':'Bearer '+token,'Accept':'application/octet-stream'}),timeout=30);raise RuntimeError('No redirect')
 except urllib.error.HTTPError as e:
  if e.code!=302:raise RuntimeError('Asset redirect failed') from None
  url=e.headers['Location']
 assert url.startswith('https://release-assets.githubusercontent.com/')
 f=REL/'archives'/asset['name'];assets.append({'name':f.name,'bytes':f.stat().st_size,'sha256':sha(f),'url':url})
def stage(device):
 folder=OUT/device;folder.mkdir(exist_ok=True)
 plan=folder/f'download-{device}.json';plan.write_text(json.dumps({'assets':assets}))
 pins=folder/'install-pins.json';pins.write_text(json.dumps({'tools':sha(REL/'archives/stand-tools-KDW-Stand-20261027-RC4-1.zip')}))
 remote.run(device,"New-Item -ItemType Directory -Force 'C:/KDW-Stand/deploy/RC4-1'|Out-Null")
 for local in [plan,pins,HERE/'download.ps1',REL/'archives/stand-tools-KDW-Stand-20261027-RC4-1.zip',REL/'delta.json',ROOT/'docs/OPERATOR_PANELS.md',HERE.parent/'Configure-LidarFirewall.ps1']:
  remote.upload(device,local,'C:/KDW-Stand/deploy/RC4-1/'+local.name)
 remote.run(device,"$name='KDW-RC4-1-Download';if(Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue){throw 'Task already exists'};$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File C:/KDW-Stand/deploy/RC4-1/download.ps1 -Device "+device+"';$principal=New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited;Register-ScheduledTask -TaskName $name -Action $action -Principal $principal|Out-Null;Start-ScheduledTask $name")
 return device,'downloads-started'
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for r in pool.map(stage,['chuwi','max_right','stella']):print(json.dumps(r))
