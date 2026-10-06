"""Launch v2 reuses existing DBOS queues/signals; v1 workflows retain their history."""
import copy
import hashlib
from dbos import DBOS, SetWorkflowID, SetEnqueueOptions
from app import clock_sample
import registry as business
import max_launch_store as store
from max_workflows import CONTROL_QUEUE, ASSIGNMENT_QUEUE, assignment_workflow_id, quiz_actions
from max_launch_models import quiz_tags, quiz_orbit_v3

@DBOS.workflow()
def max_submit_v2(spec):
    accepted = store.create_intent_v2(spec)
    if not accepted['accepted']: return accepted
    state = accepted['state']
    with SetWorkflowID(assignment_workflow_id(state['assignmentId'])):
        with SetEnqueueOptions(priority=state['queueOrdinal']):
            DBOS.enqueue_workflow(ASSIGNMENT_QUEUE, max_assignment_v2, state['assignmentId'])
    return store.confirm_enqueued_v1(spec)

@DBOS.workflow()
def max_assignment_v2(aid):
    state = store.activate_assignment_v2(aid, clock_sample())
    while state['phase'] not in store.TERMINAL:
        launch_ticking = state['phase'] == 'launch' and state['launch']['phaseElapsedMs'] < state['launchPlan']['timingsMs'][state['launch']['phase']]
        timed = (state['phase'] == 'awaiting_touch' or launch_ticking) and not state['paused']
        message = DBOS.recv(topic='commands', timeout_seconds=.2 if timed else 3600)
        if message is None and not timed: continue
        result = store.advance_assignment_v2(aid, message, clock_sample())
        state = result['state']
        if message is not None: DBOS.set_event('ack:' + message['commandId'], result['ack'])
    return state

@DBOS.workflow()
def max_port_command_v2(message):
    admission = store.admit_port_command_v1(message)
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
    return store.advance_assignment_v2(aid, message, clock_sample())['ack']

@DBOS.workflow()
def max_wall_select_v2(spec):
    with SetWorkflowID('max-submit:' + spec['assignmentId']):
        return DBOS.enqueue_workflow(CONTROL_QUEUE, max_submit_v2, spec).get_result()

@DBOS.workflow()
def max_quiz_v2(spec):
    business.persist_phase(spec, 'active')
    previous = clock_sample()
    state = {'protocol': 'stella-max-v1', 'sessionId': spec['sessionId'], 'phase': 'active', 'screen': 'audience',
        'answers': {}, 'missionId': None, 'assignmentId': None, 'revision': 0,
        'remainingMs': spec['settings']['quizIdleMs'], 'settings': spec['settings'], 'definition': spec['definition']}
    state['tagsMax'] = quiz_tags(spec['launchDefinition'], state['answers'])
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
                    'stationBinding': {k: spec[k] for k in ('sessionId', 'visitId', 'stationId', 'generation')}}
                with SetWorkflowID('max-submit:' + aid):
                    result = DBOS.enqueue_workflow(CONTROL_QUEUE, max_submit_v2, assignment).get_result()
                if result['accepted']:
                    state.update(phase='completed', screen='queued' if result['state']['releaseOnEnqueue'] else 'delivery', assignmentId=aid)
                else: reason = result.get('reason', 'MAX_ASSIGNMENT_REJECTED')
            else: reason = 'INVALID_STATE'
            if reason is None:
                state['revision'] += 1
                if kind not in ('pause', 'resume', 'cancel'): state['remainingMs'] = spec['settings']['quizIdleMs']
        if state['phase'] != prior_phase: business.persist_phase(spec, state['phase'])
        state['tagsMax'] = quiz_tags(spec['launchDefinition'], state['answers'])
        state['actions'] = quiz_actions(state)
        DBOS.set_event('state', copy.deepcopy(state))
        if message:
            DBOS.set_event('ack:' + message['commandId'], {'accepted': reason is None, 'reason': reason or 'APPLIED',
                'command': message, 'state': copy.deepcopy(state)})
    return state

@DBOS.workflow()
def admit_max_v2(envelope):
    spec = {**envelope['request'], 'durationMs': envelope['settings']['quizIdleMs']}
    receipt = business.claim(spec, max_presentation=True)
    if receipt['accepted']:
        with SetWorkflowID(receipt['workflowId']):
            DBOS.start_workflow(max_quiz_v2, {**spec, 'generation': receipt['generation'], 'settings': envelope['settings'], 'definition': envelope['definition'], 'launchDefinition':envelope['launchDefinition']}).get_result()
    return receipt


# V3 snapshots preserve quiz tag identity and angular phase across confirm.
@DBOS.workflow()
def max_submit_v3(spec):
    accepted = store.create_intent_v3(spec)
    if not accepted['accepted']: return accepted
    state = accepted['state']
    with SetWorkflowID(assignment_workflow_id(state['assignmentId'])):
        with SetEnqueueOptions(priority=state['queueOrdinal']):
            DBOS.enqueue_workflow(ASSIGNMENT_QUEUE, max_assignment_v3, state['assignmentId'])
    return store.confirm_enqueued_v1(spec)

@DBOS.workflow()
def max_assignment_v3(aid):
    state = store.activate_assignment_v2(aid, clock_sample())
    while state['phase'] not in store.TERMINAL:
        launch_ticking = state['phase'] == 'launch' and state['launch']['phaseElapsedMs'] < state['launchPlan']['timingsMs'][state['launch']['phase']]
        timed = (state['phase'] == 'awaiting_touch' or launch_ticking) and not state['paused']
        message = DBOS.recv(topic='commands', timeout_seconds=.2 if timed else 3600)
        if message is None and not timed: continue
        result = store.advance_assignment_v3(aid, message, clock_sample())
        state = result['state']
        if message is not None: DBOS.set_event('ack:' + message['commandId'], result['ack'])
    return state

@DBOS.workflow()
def max_port_command_v3(message):
    admission = store.admit_port_command_v1(message)
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
    return store.advance_assignment_v3(aid, message, clock_sample())['ack']

@DBOS.workflow()
def max_wall_select_v3(spec):
    with SetWorkflowID('max-submit:' + spec['assignmentId']):
        return DBOS.enqueue_workflow(CONTROL_QUEUE, max_submit_v3, spec).get_result()

@DBOS.workflow()
def max_quiz_v3(spec):
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
                    'quizHandoff':{'tags':copy.deepcopy(state['tagsMax']), 'orbit':copy.deepcopy(state['orbitMax'])},
                    'stationBinding': {k: spec[k] for k in ('sessionId', 'visitId', 'stationId', 'generation')}}
                with SetWorkflowID('max-submit:' + aid):
                    result = DBOS.enqueue_workflow(CONTROL_QUEUE, max_submit_v3, assignment).get_result()
                if result['accepted']:
                    state.update(phase='completed', screen='queued' if result['state']['releaseOnEnqueue'] else 'delivery', assignmentId=aid)
                else: reason = result.get('reason', 'MAX_ASSIGNMENT_REJECTED')
            else: reason = 'INVALID_STATE'
            if reason is None:
                state['revision'] += 1
                if kind not in ('pause', 'resume', 'cancel'): state['remainingMs'] = spec['settings']['quizIdleMs']
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
def admit_max_v3(envelope):
    spec = {**envelope['request'], 'durationMs': envelope['settings']['quizIdleMs']}
    receipt = business.claim(spec, max_presentation=True)
    if receipt['accepted']:
        with SetWorkflowID(receipt['workflowId']):
            DBOS.start_workflow(max_quiz_v3, {**spec, 'generation': receipt['generation'], 'settings': envelope['settings'], 'definition': envelope['definition'], 'launchDefinition':envelope['launchDefinition']}).get_result()
    return receipt
