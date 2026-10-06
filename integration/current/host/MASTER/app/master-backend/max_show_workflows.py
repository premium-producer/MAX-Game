"""Exhibition route: existing DBOS durable workflow and canonical MAX port."""
import copy,hashlib,time
from dbos import DBOS,SetWorkflowID
from app import clock_sample
import registry as business
import max_show_store as store
import max_canonical_port as port
from max_show_domain import project,transition

@DBOS.step()
def read_mode():return store.mode()

@DBOS.step()
def wall_clock_ms():return int(time.time()*1000)

@DBOS.workflow()
def configure_max_show_v1(message):return store.configure(message)

@DBOS.workflow()
def admit_max_show_v1(envelope):
    spec={**envelope['request'],'durationMs':envelope['settings']['quizIdleMs']}
    receipt=business.claim(spec, max_presentation='show')
    if receipt['accepted']:
        with SetWorkflowID(receipt['workflowId']):
            DBOS.start_workflow(max_show_session_v1,{**spec,'generation':receipt['generation'],'settings':envelope['settings'],'definition':envelope['definition'],'launchDefinition':envelope['launchDefinition'],'canonicalProfile':envelope['canonicalProfile']}).get_result()
    return receipt

@DBOS.workflow()
def max_show_session_v1(spec):
    business.persist_phase(spec,'active')
    binding=store.bind(spec['sessionId'])
    # Historical DBOS transaction results were bool. Keep replay step order intact.
    bound=binding.get('bound',False) if isinstance(binding,dict) else binding
    screen_delay_ms=binding.get('screenDelayMs',1000) if isinstance(binding,dict) else 1000
    aid='max-show:'+hashlib.sha256(spec['sessionId'].encode()).hexdigest()[:32]
    previous=clock_sample()
    launch=spec['launchDefinition'];tags=[{'id':t['id'],'label':t['label']} for t in launch['tagBindings']]
    timings=launch['timingsMs']
    state={'protocol':'stella-max-v1','sessionId':spec['sessionId'],'phase':'active' if bound else 'cancelled','screen':'audience','answers':{},'missionId':'digital-id','assignmentId':None,'revision':0,'remainingMs':spec['settings']['quizIdleMs'],'settings':spec['settings'],'definition':spec['definition'],
      'show':{'protocol':'max-show-v1','runId':aid,'sessionId':spec['sessionId'],'phase':'tags','gamePhase':'id','screenDelayMs':screen_delay_ms,'elapsedMs':0,'startedAtMs':wall_clock_ms(),'missionId':'digital-id','tags':tags,'route':{'tagsDurationMs':timings['tags'],'ribbonDurationMs':timings['ribbon']},'cancelAllowed':True,'canonical':None,'canonicalError':None}}
    request=None; assigned=False
    while True:
        state['show']=project(state)
        state['actions']=(['cancel'] if state['screen']=='final' else ['confirm','back','cancel'] if state['screen']=='missionselected' else ['answer','cancel'] if state['screen']=='audience' else ['answer','back','cancel']) if state['phase']=='active' else []
        DBOS.set_event('state',copy.deepcopy(state))
        if state['phase']=='cancelled':break
        message=DBOS.recv(topic='commands',timeout_seconds=.2)
        now=clock_sample()
        if now['bootId']==previous['bootId']:state['show']['elapsedMs']+=max(0,now['checkpointMs']-previous['checkpointMs'])
        previous=now
        setting=read_mode()
        reason=None
        if not setting['enabled'] or setting['activeSessionId']!=spec['sessionId']:
            state['phase']='cancelled';state['revision']+=1
            if message:reason='SHOW_DISABLED'
        elif message:reason=transition(state,message,spec['definition'])
        # Publish cancellation before network cleanup. No fabricated mission completion.
        if state['phase']!='cancelled':
            if request is None:
                result=port.prepare_assignment(spec['canonicalProfile'],aid,'digital-id')
                if result['ok']:request=result['request']
                else:state['show']['canonicalError']=result.get('error')
            if request is not None and not assigned:
                result=port.assign(spec['canonicalProfile'],request)
                if result['ok']:
                    receipt=result['value']['receipt'];assigned=True
                    state['show']['canonical']={'mode':'canonical-local-v1','assignmentId':aid,'sessionId':receipt['sessionId'],'contentRevision':receipt['contentRevision'],'generation':receipt['generation'],'source':'stella','receipt':receipt}
                    state['show']['canonicalError']=None
                else:state['show']['canonicalError']=result.get('error')
            if assigned and state['show']['gamePhase']=='id':
                result=port.observe(spec['canonicalProfile'],aid,request['sessionId'])
                if result['ok']:
                    game=result['snapshot']['state'];state['show']['canonical'].update(gameStatus=game['status'],gameRevision=game['revision']);state['show']['canonicalError']=None
                    if game['status']=='completed':state['show']['gamePhase']='videos'
                else:state['show']['canonicalError']=result.get('error')
        state['show']=project(state)
        if message:
            DBOS.set_event('ack:'+message['commandId'],{'accepted':reason is None,'reason':reason or 'APPLIED','command':message,'state':copy.deepcopy(state)})
    # Lost assign ACK must be reconciled with the same request before cancellation.
    if request:
        while not assigned:
            result=port.assign(spec['canonicalProfile'],request)
            if result['ok']:assigned=True
            elif result.get('status') in (400,409,422):break
            else:DBOS.sleep(.5)
        if assigned:
            while True:
                result=port.terminate(spec['canonicalProfile'],request,'cancel')
                if result['ok']:break
                DBOS.sleep(.5)
    business.persist_phase(spec,'cancelled');store.release(spec['sessionId'])
    return copy.deepcopy(state)
