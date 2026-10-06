"""Launch v2 reuses existing DBOS queues/signals; v1 workflows retain their history."""
import copy
import hashlib
from dbos import DBOS, SetWorkflowID, SetEnqueueOptions
from app import clock_sample
import registry as business
import max_canonical_store as store
import max_launch_store as launch_store
import max_canonical_port as port
from max_store import confirm_enqueued_v1, admit_port_command_v1
from max_workflows import CONTROL_QUEUE, ASSIGNMENT_QUEUE, assignment_workflow_id, quiz_actions
from max_launch_models import quiz_tags, quiz_orbit_v3

# V3 snapshots preserve quiz tag identity and angular phase across confirm.
@DBOS.workflow()
def max_submit_v4(spec):
    accepted = store.create_intent_v4(spec)
    if not accepted['accepted']: return accepted
    state = accepted['state']
    with SetWorkflowID(assignment_workflow_id(state['assignmentId'])):
        with SetEnqueueOptions(priority=state['queueOrdinal']):
            DBOS.enqueue_workflow(ASSIGNMENT_QUEUE, max_assignment_v4, state['assignmentId'])
    return confirm_enqueued_v1(spec)

@DBOS.workflow()
def max_assignment_v4(aid):
    state = launch_store.activate_assignment_v2(aid, clock_sample())
    while state['phase'] not in store.TERMINAL:
        if state['phase'] == 'delivery' and not state.get('canonical'):
            request = state.get('canonicalRequest')
            if request is None:
                prepared = port.prepare_assignment(state['canonicalProfile'],aid,state['missionId'])
                if prepared['ok']:
                    request=prepared['request']; state=store.set_canonical_v4(aid,request,{'ok':False,'error':None})
                else: state=store.set_canonical_v4(aid,None,prepared)
            if request is not None:
                state=store.set_canonical_v4(aid,request,port.assign(state['canonicalProfile'],request))
        if state['phase'] == 'releasing':
            request=state.get('canonicalRequest')
            # A pending assignment might have committed with its response lost. Reconcile first.
            if request and not state.get('canonical'):
                state=store.set_canonical_v4(aid,request,port.assign(state['canonicalProfile'],request))
            if not request:
                state=store.finish_release_v4(aid,{'ok':True,'value':None})
            elif state.get('canonical'):
                kind='release' if state['pendingTerminal']=='completed' or state['canonical'].get('gameStatus')=='expired' else 'cancel'
                state=store.finish_release_v4(aid,port.terminate(state['canonicalProfile'],request,kind))
            if state['phase'] in store.TERMINAL: break
        launch_ticking=state['phase']=='launch' and state['launch']['phaseElapsedMs']<state['launchPlan']['timingsMs'][state['launch']['phase']]
        timed=(launch_ticking or state['phase'] in ('delivery','awaiting_touch','playing','releasing')) and not state['paused']
        message=DBOS.recv(topic='commands',timeout_seconds=.2 if timed else 3600)
        if message is None and not timed: continue
        observation=None
        if state.get('canonical') and state['phase'] in ('awaiting_touch','playing') and not state['paused']:
            observation=port.observe(state['canonicalProfile'],aid,state['canonical']['sessionId'])
        result=store.advance_assignment_v4(aid,message,clock_sample(),observation)
        state=result['state']
        if message is not None: DBOS.set_event('ack:'+message['commandId'],result['ack'])
    return state

@DBOS.workflow()
def max_port_command_v4(message):
    admission = admit_port_command_v1(message)
    if not admission['accepted']: return admission['ack']
    aid = message['assignmentId']
    target = assignment_workflow_id(aid)
    status = DBOS.get_workflow_status(target)
    if status and status.status in ('PENDING', 'ENQUEUED', 'DELAYED'):
        DBOS.send(target, message, topic='commands', idempotency_key=message['commandId'])
        while True:
            ack = DBOS.get_event(target, 'ack:' + message['commandId'], timeout_seconds=.5)
            if ack is not None: return ack
            status = DBOS.get_workflow_status(target)
            if status is None or status.status not in ('PENDING', 'ENQUEUED', 'DELAYED'): break
    return store.advance_assignment_v4(aid, message, clock_sample())['ack']

@DBOS.workflow()
def max_wall_select_v4(spec):
    with SetWorkflowID('max-submit:' + spec['assignmentId']):
        return DBOS.enqueue_workflow(CONTROL_QUEUE, max_submit_v4, spec).get_result()

@DBOS.workflow()
def max_quiz_v4(spec):
    business.persist_phase(spec, 'active')
    previous = clock_sample()
    state = {'protocol': 'stella-max-v1', 'sessionId': spec['sessionId'], 'phase': 'active', 'screen': 'audience',
        'answers': {}, 'missionId': None, 'assignmentId': None, 'revision': 0,
        'remainingMs': spec['settings']['quizIdleMs'], 'settings': spec['settings'], 'definition': spec['definition']}
    state['tagsMax'] = quiz_tags(spec['launchDefinition'], state['answers'])
    state['orbitMax'] = quiz_orbit_v3(spec['launchDefinition'], state['tagsMax'])
    state['actions'] = quiz_actions(state)
    DBOS.set_event('state', copy.deepcopy(state))
    while state['phase'] not in store.TERMINAL:
        interactive = state['phase'] == 'active'
        message = DBOS.recv(topic='commands', timeout_seconds=.2 if interactive else 3600)
        if message is None and not interactive: continue
        now = clock_sample()
        prior_phase = state['phase']
        if interactive and now['bootId'] == previous['bootId']:
            state['remainingMs'] = max(0, state['remainingMs'] - (now['checkpointMs'] - previous['checkpointMs']))
            if state['remainingMs'] == 0: state['phase'] = 'expired'; state['revision'] += 1
        if interactive and now['bootId'] == previous['bootId']:
            state['orbitMax'] = quiz_orbit_v3(spec['launchDefinition'], state['tagsMax'], state['orbitMax'], now['checkpointMs'] - previous['checkpointMs'])
        previous = now
        reason = None
        if message:
            kind = message['kind']
            if message['sessionId'] != state['sessionId']: reason = 'WRONG_SESSION'
            elif message['expectedRevision'] != state['revision']: reason = 'REVISION_CONFLICT'
            elif state['phase'] in store.TERMINAL: reason = 'SESSION_TERMINAL'
            elif kind == 'cancel': state['phase'] = 'cancelled'
            elif kind == 'pause' and state['phase'] == 'active': state['phase'] = 'paused'
            elif kind == 'resume' and state['phase'] == 'paused': state['phase'] = 'active'
            elif state['phase'] != 'active': reason = 'INVALID_STATE'
            elif kind == 'answer' and state['screen'] in ('audience', 'goal'):
                question = next(q for q in spec['definition']['questions'] if q['id'] == state['screen'])
                if message['questionId'] != question['id'] or message['answerId'] not in [o['id'] for o in question['options']]:
                    reason = 'STALE_OR_INVALID_ANSWER'
                else:
                    state['answers'][question['id']] = message['answerId']
                    state['screen'] = 'goal' if question['id'] == 'audience' else 'missionselected'
                    if state['screen'] == 'missionselected': state['missionId'] = spec['definition']['routing'][state['answers']['audience']][state['answers']['goal']]
            elif kind == 'back' and state['screen'] in ('goal', 'missionselected'):
                state['screen'] = 'audience' if state['screen'] == 'goal' else 'goal'
                state['answers'].pop(state['screen'], None)
                state['missionId'] = None
            elif kind == 'confirm' and state['screen'] == 'missionselected':
                aid = 'max:' + hashlib.sha256(state['sessionId'].encode()).hexdigest()[:32]
                assignment = {'assignmentId': aid, 'missionId': state['missionId'], 'source': 'stella',
                    'sourceSessionId': spec['sessionId'], 'settings': spec['settings'], 'launchDefinition':spec['launchDefinition'],
                    'canonicalProfile':spec['canonicalProfile'], 'quizHandoff':{'tags':copy.deepcopy(state['tagsMax']), 'orbit':copy.deepcopy(state['orbitMax'])},
                    'stationBinding': {k: spec[k] for k in ('sessionId', 'visitId', 'stationId', 'generation')}}
                with SetWorkflowID('max-submit:' + aid):
                    result = DBOS.enqueue_workflow(CONTROL_QUEUE, max_submit_v4, assignment).get_result()
                if result['accepted']:
                    state.update(phase='completed', screen='queued' if result['state']['releaseOnEnqueue'] else 'delivery', assignmentId=aid)
                else: reason = result.get('reason', 'MAX_ASSIGNMENT_REJECTED')
            else: reason = 'INVALID_STATE'
            if reason is None:
                state['revision'] += 1
                if kind not in ('pause', 'resume', 'cancel'):
                    state['remainingMs'] = spec['settings']['quizIdleMs']
                    # The thin UI presents accepted tags in groups of four while
                    # the server already owns the next question. Reserve that
                    # bounded presentation time in addition to the thinking time.
                    # No new durable operations: absent historical setting is zero.
                    group_ms = spec['settings'].get('quizAnswerRevealGroupMs', 0)
                    if kind == 'answer' and group_ms:
                        before = {t['id'] for t in state['tagsMax'] if t['visible']}
                        revealed = sum(t['visible'] and t['id'] not in before
                            for t in quiz_tags(spec['launchDefinition'], state['answers']))
                        state['remainingMs'] += ((revealed + 3) // 4) * group_ms
        if state['phase'] != prior_phase: business.persist_phase(spec, state['phase'])
        state['tagsMax'] = quiz_tags(spec['launchDefinition'], state['answers'])
        state['orbitMax'] = quiz_orbit_v3(spec['launchDefinition'], state['tagsMax'], state['orbitMax'])
        state['actions'] = quiz_actions(state)
        DBOS.set_event('state', copy.deepcopy(state))
        if message:
            DBOS.set_event('ack:' + message['commandId'], {'accepted': reason is None, 'reason': reason or 'APPLIED',
                'command': message, 'state': copy.deepcopy(state)})
    return state

@DBOS.workflow()
def admit_max_v4(envelope):
    spec = {**envelope['request'], 'durationMs': envelope['settings']['quizIdleMs']}
    receipt = business.claim(spec, max_presentation=True)
    if receipt['accepted']:
        with SetWorkflowID(receipt['workflowId']):
            DBOS.start_workflow(max_quiz_v4, {**spec, 'generation': receipt['generation'], 'settings': envelope['settings'], 'definition': envelope['definition'], 'launchDefinition':envelope['launchDefinition'],'canonicalProfile':envelope['canonicalProfile']}).get_result()
    return receipt
