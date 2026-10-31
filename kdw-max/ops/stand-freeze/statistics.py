"""Retain readable private journals and export only aggregate counters."""
import collections,csv,hashlib,json,pathlib,re,shutil
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'releases/stand-final-20261031';PRIVATE=OUT/'private';DOC=ROOT/'docs/stand-final-20261031';DOC.mkdir(parents=True,exist_ok=True)
safe=lambda value:isinstance(value,str) and bool(re.fullmatch(r'[A-Za-z0-9_.:/-]{1,150}',value))
result={'scope':'All retained primary-application journals in all captured releases; duplicate JSON rows deduplicated. Includes tests and operator sessions, not unique visitors. MAX screen samples are observations, not a complete count of screen launches. Already pruned logs cannot be recovered.','applications':{}}
for device,app in [('max-game-pc','max-game'),('stela-pc','stela')]:
 m=json.loads((PRIVATE/device/'manifest.json').read_text(encoding='utf-8-sig'));events=collections.Counter();screens=collections.Counter();missions=collections.Counter();daily=collections.Counter();seen=set();file_seen=set();visits=set();sessions=set();games={};invalid=0;parsed=0;first=None;last=None;logfiles=0;logbytes=0
 for f in m['files']:
  n=f['path'];islog=('/data/logs/' in n or '/data/runtime-logs/' in n or n.endswith('/data/desktop.log'))
  isgame='/data/link/games/' in n and n.endswith('.json')
  if not (islog or isgame):continue
  src=PRIVATE/'objects'/f['sha256'];dest=PRIVATE/'readable'/device/n;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest)
  if '/apps/'+app+'/data/' not in n:continue
  if isgame:
   try:g=json.loads(src.read_text(encoding='utf-8-sig'))
   except (ValueError,UnicodeError):continue
   ident=g.get('gameId');prior=games.get(ident)
   if ident and (not prior or str(g.get('updatedAt',''))>str(prior.get('updatedAt',''))):games[ident]=g
   continue
  if f['sha256'] in file_seen:continue
  file_seen.add(f['sha256']);logfiles+=1;logbytes+=f['bytes']
  with src.open(encoding='utf-8-sig',errors='replace') as handle:
   for line in handle:
    if not line.strip():continue
    try:r=json.loads(line)
    except ValueError:invalid+=1;continue
    if not isinstance(r,dict):continue
    key=hashlib.sha256(line.strip().encode()).digest()
    if key in seen:continue
    seen.add(key);parsed+=1;e=r.get('event');ctx=r.get('context') or {};data=r.get('data') or {}
    if not isinstance(ctx,dict):ctx={}
    if not isinstance(data,dict):data={}
    timestamp=r.get('timestamp') or r.get('time')
    if isinstance(timestamp,str) and re.match(r'^\d{4}-\d{2}-\d{2}T',timestamp):
     first=min(first or timestamp,timestamp);last=max(last or timestamp,timestamp)
     if safe(e):daily[(timestamp[:10],e)]+=1
    if safe(e):events[e]+=1
    if e=='session.created' and ctx.get('sessionId'):sessions.add(ctx['sessionId'])
    if e=='mission.displayed' and safe(data.get('missionId')):missions[data['missionId']]+=1
    if e=='ui.screen_entered':
     stage=ctx.get('stage');visit=(ctx.get('sessionId') or r.get('runId'),ctx.get('revision'),stage)
     if safe(stage) and visit not in visits:visits.add(visit);screens[stage]+=1
    if app=='max-game' and safe(r.get('screen')):screens[r['screen']]+=1
 statuses=collections.Counter(g.get('status','unknown') for g in games.values() if safe(g.get('status','unknown')))
 game_missions=collections.Counter(g.get('missionId','unknown') for g in games.values() if safe(g.get('missionId','unknown')))
 result['applications'][app]={'capturedJournalFiles':logfiles,'journalBytes':logbytes,'parsedUniqueEvents':parsed,'unparseableLines':invalid,'firstRetainedEventUtc':first,'lastRetainedEventUtc':last,'recordedSessionIdsCount':len(sessions),'retainedGameRecords':len(games),'gameStatuses':dict(statuses),'gameMissions':dict(game_missions),'missionDisplayEvents':dict(missions),'screenCounts':dict(screens),'screenCountMeaning':'Deduplicated ui.screen_entered per session/revision/stage' if app=='stela' else 'Retained log observations, NOT visitor or screen-entry totals','events':dict(sorted(events.items()))}
 with (DOC/('events-daily-'+app+'.csv')).open('w',newline='',encoding='utf-8-sig') as handle:
  writer=csv.writer(handle);writer.writerow(['date_utc','event','count']);writer.writerows((date,event,count) for (date,event),count in sorted(daily.items()))
 with (DOC/('screens-'+app+'.csv')).open('w',newline='',encoding='utf-8-sig') as handle:
  writer=csv.writer(handle);writer.writerow(['screen_or_stage','count','metric']);writer.writerows((screen,count,'screen_entered' if app=='stela' else 'log_observation') for screen,count in sorted(screens.items()))
(DOC/'statistics.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({app:{k:v for k,v in d.items() if k not in ('events','screenCounts')} for app,d in result['applications'].items()},ensure_ascii=False))
