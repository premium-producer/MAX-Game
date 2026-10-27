"""Prepare independent Windows kits. Never overwrite an existing delivery."""
import argparse, hashlib, json, os, shutil, subprocess, uuid, re
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parents[2])
parser.add_argument('--output',type=Path)
parser.add_argument('--openssl',type=Path,default=Path('C:/Program Files/Git/usr/bin/openssl.exe'))
args=parser.parse_args(); source=args.source_root.resolve(); output=(args.output or source/'production').resolve()
if output.exists(): raise SystemExit('Output already exists; choose a new --output. Existing settings will not be overwritten.')
if not args.openssl.is_file(): raise SystemExit('OpenSSL is required only on the build machine to create the private pair certificate.')
for name in ['stela','max-game']:
 if not (source/'apps'/name/'package-manifest.json').is_file(): raise SystemExit('Missing sealed app '+name)
stela_bundle=(source/'apps/stela/www/stella/assets/app.js').read_bytes()
if b'/__kdw/link/submit' not in stela_bundle or b'gameId' not in stela_bundle: raise SystemExit('Stella bundle is stale: rebuild from source before packaging.')
output.mkdir(parents=True)
helpers=source/'ops/production-build'; pair_id=str(uuid.uuid4()); pair_key=os.urandom(32).hex()
def write(file,value):
 file.parent.mkdir(parents=True,exist_ok=True)
 file.write_text(value,encoding='utf-8')
def save(file,value): write(file,json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def copy_app(name,parent,dev=False):
 src=source/'apps'/name; dst=parent/name
 pins=json.loads((src/'package-manifest.json').read_text(encoding='utf-8'))['files']
 def ignore(folder,names):
  omitted=({'data','node_modules'} if dev else {'data','node_modules','package-manifest.json'})|{'.DS_Store','Thumbs.db'}
  if Path(folder)==src and not dev: omitted.add('source')
  return [n for n in names if n in omitted or not dev and '(2)' in n and n in {'app (2).json','package-manifest (2).json','app (2).js','kdw-business-native-model (2).mjs'}]
 shutil.copytree(src,dst,ignore=ignore)
 for f in dst.rglob('*'):
  if f.is_file() and f.name!='package-manifest.json':
   relative=f.relative_to(dst).as_posix()
   if relative not in pins or hashlib.sha256(f.read_bytes()).hexdigest()!=pins[relative]['sha256']: raise SystemExit('Source changed during packaging: '+name+'/'+relative)
 # The explicit packaging command selects a profile only in the new output.
 config=json.loads((dst/'app.json').read_text(encoding='utf-8'))
 config['production']=not dev
 if name=='stela' and not dev: config['entry']='/stella/pixels/'
 if name=='max-game' and not dev: config['entry']='/webgl-v5/client.html?backend=local&view=pixel-map'
 if dev and not config['version'].endswith('-DEV'): config['version']+='-DEV'
 save(dst/'app.json',config)
 if not (dst/'runtime').exists(): shutil.copytree(source/'runtime/electron',dst/'runtime')
 # Local sound libraries are operator data, separate from immutable application assets.
 for n in ['sound-events.local.json','soundtrack.local.json']:
  if (src/'data'/n).exists(): (dst/'data').mkdir(exist_ok=True); shutil.copy2(src/'data'/n,dst/'data'/n)
 if (src/'data/audio').exists(): shutil.copytree(src/'data/audio',dst/'data/audio',ignore=shutil.ignore_patterns('.upload-*'))
 if name=='stela':
  for n in ['omni.local.json','audio.local.json','audio-profile.json']:
   if (src/'data'/n).exists(): (dst/'data').mkdir(exist_ok=True); shutil.copy2(src/'data'/n,dst/'data'/n)
  for n in ['voice-profiles','audio-presets']:
   if (src/'data'/n).exists(): shutil.copytree(src/'data'/n,dst/'data'/n)
 return dst
def control(kit,names):
 for action in ['Start','Stop','Check']:
  lines=['@echo off','setlocal DisableDelayedExpansion','set "KDW_STATUS=0"']
  for name in names:
   lines += [f'call "%~dp0{name}/{action}.bat" %*','if errorlevel 1 set "KDW_STATUS=1"']
  lines += ['exit /b %KDW_STATUS%']
  write(kit/(action+'.bat'),'\r\n'.join(lines)+'\r\n')
def helper_bat(kit,name,script,extra=''):
 write(kit/(name+'.bat'),'@echo off\r\nsetlocal DisableDelayedExpansion\r\npowershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools/'+script+'" '+extra+' %*\r\nif errorlevel 1 pause\r\n')
one=output/'startup-one-pc'; max_kit=output/'startup-max'; stela_kit=output/'startup-stela'
for kit,names in [(one,['max-game','stela']),(max_kit,['max-game']),(stela_kit,['stela'])]:
 kit.mkdir();
 for name in names: copy_app(name,kit)
 control(kit,names)
 if 'max-game' in names:
  for mode in ['Start-Pixel-Map','Calibrate-Pixel-Map']:
   lines=['@echo off','setlocal DisableDelayedExpansion',f'call "%~dp0max-game/{mode}.bat" %*','if errorlevel 1 exit /b 1']
   if mode=='Start-Pixel-Map' and 'stela' in names:lines+=['call "%~dp0stela/Start.bat" %*']
   lines+=['exit /b %errorlevel%'];write(kit/(mode+'.bat'),'\r\n'.join(lines)+'\r\n')
max_data=max_kit/'max-game/data'; (max_data/'link').mkdir(parents=True)
save(max_data/'link/key.json',{'key':pair_key})
save(max_data/'game-link-network.local.json',{'enabled':True,'host':'0.0.0.0','port':18753,'pairId':pair_id})
cert=max_data/'link/server-cert.pem'; key=max_data/'link/server-key.pem'
result=subprocess.run([str(args.openssl),'req','-x509','-newkey','rsa:3072','-nodes','-keyout',str(key),'-out',str(cert),'-days','1825','-subj','/CN=KDW-MAX-'+pair_id],capture_output=True)
if result.returncode: raise SystemExit('Certificate generation failed; delivery is incomplete.')
save(stela_kit/'settings/pairing.json',{'pairId':pair_id,'port':18753,'key':pair_key,'certificatePem':cert.read_text()})
# A standalone Stella kit requires explicit address selection; never silently pair with an unrelated sibling.
save(stela_kit/'stela/data/game-link.local.json',{'gameOrigin':'https://configure-max-address.invalid:18753','key':pair_key,'certificatePem':cert.read_text(),'pairId':pair_id})
for kit,files in [(max_kit,['Network.ps1']),(stela_kit,['Configure-Link.ps1','Start-Stela.ps1','check-link.cjs'])]:
 (kit/'tools').mkdir()
 for name in files: shutil.copy2(helpers/name,kit/'tools'/name)
helper_bat(stela_kit,'Configure-Link','Configure-Link.ps1')
helper_bat(stela_kit,'Start','Start-Stela.ps1')
helper_bat(max_kit,'Show-Address','Network.ps1','-Action Show')
helper_bat(max_kit,'Enable-Network','Network.ps1','-Action Enable')
helper_bat(max_kit,'Disable-Network','Network.ps1','-Action Disable')
write(stela_kit/'Check-Link.bat','@echo off\r\nsetlocal DisableDelayedExpansion\r\nset "ELECTRON_RUN_AS_NODE=1"\r\n"%~dp0stela/runtime/electron.exe" "%~dp0tools/check-link.cjs"\r\nif errorlevel 1 pause\r\n')
dev=output/'dev'; (dev/'apps').mkdir(parents=True)
for name in ['stela','max-game']: copy_app(name,dev/'apps',dev=True)
shutil.copytree(source/'apps/STARTUP',dev/'apps/STARTUP')
def docs_ignore(folder,names):
 return [n for n in names if (Path(folder)/n).is_dir() and (re.fullmatch(r'(?:(?:test|browser)-)?profile(?:-\d+)?',n,re.I) or n in {'test-runtime','extract-runtime','Cache','cache','cache2','GPUCache','ShaderCache','GrShaderCache','DawnGraphiteCache','DawnWebGPUCache','Code Cache','startupCache'} or re.fullmatch(r'stela-session-\d+',n))]
for name in ['docs','UI']: shutil.copytree(source/name,dev/name,ignore=docs_ignore if name=='docs' else None)
for name in ['AGENTS.md','WORKLOG.md']: shutil.copy2(source/name,dev/name)
shutil.copytree(helpers,dev/'ops/production-build',ignore=shutil.ignore_patterns('test-data','setup-test','__pycache__'))
write(dev/'README.md','# Разработка\n\nИсходники и готовые dev-приложения — apps/stela и apps/max-game; общий запуск apps/STARTUP/Start.bat. Runtime, VST и текущие настройки включены. Для пересборки используются source/build.mjs и существующий Node toolchain (передать путь node_modules). Сборка новых комплектов: python ops/production-build/build.py --output НОВАЯ_ПАПКА. Папки доставки независимы от dev.\n')
write(one/'README.md','# Один ПК\n\nЗапустите Start.bat. MAX и Стелла открываются в отдельных окнах, находят друг друга автоматически. Check.bat проверяет сервисы, Stop.bat закрывает их. Другие варианты комплекта одновременно на этом же ПК запускать не нужно: порты приложений общие.\n')
write(max_kit/'README.md','# Компьютер MAX\n\n1. Скопируйте всю startup-max на игровой ПК.\n2. Подключите оба ПК к одной доверенной сети Windows с профилем «Частная».\n3. Один раз запустите Enable-Network.bat от имени администратора. Правило открывает только TLS-порт18753 приложения для LocalSubnet в Private-профиле.\n4. Show-Address.bat показывает IPv4 — введите его на Стелле.\n5. Start.bat запускает игру и зашифрованный приёмник.\n\nВ этой папке лежит сертификат/закрытый ключ именно данной пары. Disable-Network.bat от администратора выключает правило. Stop.bat закрывает приложение и сетевой приёмник. Локальный UI/администрирование остаются на127.0.0.1:18752.\n')
write(stela_kit/'README.md','# Компьютер Стеллы\n\n1. Скопируйте всю startup-stela на ПК Стеллы.\n2. Запустите Configure-Link.bat и введите IPv4 игрового ПК, показанный Show-Address.bat.\n3. На MAX должны быть запущены Start.bat и однократно настроено Private/LocalSubnet-правило.\n4. Check-Link.bat проверяет TLS-сертификат и ключ пары.\n5. Start.bat запускает Стеллу с Qwen и VST.\n\nПосле смены адреса MAX снова выполните Configure-Link.bat. Глобальный Node/Python и установка сертификата в Windows не нужны. Неотправленные миссии/фото сохраняются до восстановления связи.\n')
write(output/'README.md','# KDW MAX — production\n\n- dev — исходники и dev-приложения.\n- startup-one-pc — оба приложения на одном Windows-ПК, Start.bat.\n- startup-stela — комплект ПК Стеллы с Configure-Link.bat.\n- startup-max — комплект игрового ПК с Show-Address/Enable-Network.bat.\n\nПереносите каждый startup-каталог целиком; они не зависят от dev или исходного проекта. Для двух ПК каталоги startup-stela и startup-max образуют одну подготовленную пару. Включены действующие приватные Qwen-настройки, голосовой профиль и полные VST-пресеты. Логи, браузерные профили, фотографии и прежние игры в поставку не включены. Настройки и новые игры сохраняются внутри data.\n')
for kit in [one,max_kit]:
 p=kit/'README.md';write(p,p.read_text(encoding='utf-8')+'\nПиксельная карта3072×1536: Start-Pixel-Map.bat; границы: Calibrate-Pixel-Map.bat. Центр1760px, safe7% с каждого края, боковые скругления без тача.\n')
for kit in [one,max_kit,stela_kit,dev]:
 files={}
 for f in sorted(kit.rglob('*')):
  if f.is_file(): files[f.relative_to(kit).as_posix()]={'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
 save(kit/'delivery-manifest.json',{'schemaVersion':1,'kit':kit.name,'files':files})
save(output/'delivery.json',{'schemaVersion':1,'createdKits':['dev','startup-one-pc','startup-stela','startup-max'],'pairId':pair_id,'networkPort':18753,'encrypted':True,'containsPrivateSettings':True})
update_env={**os.environ,'ELECTRON_RUN_AS_NODE':'1'}
subprocess.run([str(source/'runtime/electron/electron.exe') if (source/'runtime/electron/electron.exe').exists() else str(source/'apps/max-game/runtime/electron.exe'),str(helpers/'update.cjs'),str(output)],env=update_env,check=True)
print(json.dumps({'output':output.as_posix(),'kits':4,'pairId':pair_id},ensure_ascii=False))
