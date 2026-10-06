"""Additive schema4. Prior launch transactions remain unchanged."""
import copy, json
from sqlalchemy import text
from registry import registry, canonical
from max_store import TERMINAL, _get, _save, _release, get_assignment
from max_launch_store import _snapshot, _receipt, is_direct_stella
from max_launch_models import build_plan_v3, initial_launch
from max_stage_watchdog_store import cancel_fence_reason, record_cancel

@registry.transaction()
def create_intent_v4(spec):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    old = db.execute(text('SELECT spec_json,state_json FROM max_assignments WHERE assignment_id=:id'), {'id': spec['assignmentId']}).first()
    if old:
        if old[0] != canonical(spec): raise ValueError('MAX_ASSIGNMENT_ID_REUSED')
        return {'accepted': True, 'state': json.loads(old[1])}
    world = _snapshot(db)
    message = spec.get('wallCommand')
    reason = None
    if message:
        prior = db.execute(text('SELECT payload_json,receipt_json FROM max_command_receipts WHERE command_id=:id'), {'id': message['commandId']}).first()
        if prior:
            if prior[0] != canonical(message): raise ValueError('COMMAND_ID_REUSED')
            return {'accepted': False, 'ack': json.loads(prior[1])}
        if message['expectedRevision'] != world['revision']: reason = 'REVISION_CONFLICT'
        elif world['current'] is not None or world['queueCount']: reason = 'MAX_BUSY'
    else:
        binding = spec['stationBinding']
        current = db.execute(text('SELECT 1 FROM stations WHERE station_id=:stationId AND session_id=:sessionId AND generation=:generation AND visit_id=:visitId'), binding).first()
        session = db.execute(text('SELECT status FROM sessions WHERE session_id=:sessionId'), binding).first()
        if not current or not session or session[0] != 'active': reason = 'SESSION_NOT_CURRENT'
    from max_presentation_store import admission_reason
    reason = reason or admission_reason(db)
    if reason:
        return {'accepted': False, 'ack': _receipt(db, message, reason)} if message else {'accepted': False, 'reason': reason}
    busy = world['current'] is not None or world['queueCount'] > 0
    state = {'assignmentId': spec['assignmentId'], 'missionId': spec['missionId'], 'source': spec['source'],
        'schemaVersion': 4, 'canonicalProfile': spec['canonicalProfile'], 'canonical': None, 'canonicalError': None, 'launchDefinition': spec['launchDefinition'], 'launchPlan': None, 'launch': None, 'sourceSessionId': spec.get('sourceSessionId'), 'stationBinding': spec.get('stationBinding'),
        'settings': spec['settings'], 'phase': 'queued' if busy else 'selecting' if spec['missionId'] is None else 'delivery',
        'paused': False, 'revision': 0, 'remainingMs': spec['settings']['touchWaitMs'],
        'delivered': spec['source'] == 'wall', 'presented': False, 'enqueued': False,
        'stationReleased': False, 'releaseOnEnqueue': bool(busy), 'clock': None}
    direct = is_direct_stella(state) and spec['missionId'] is not None
    if spec['missionId'] is not None and not direct:
        state['launchPlan'] = build_plan_v3(spec['launchDefinition'], spec['missionId'], spec['assignmentId'], spec.get('quizHandoff'))
        state['launch'] = initial_launch(state['launchPlan'])
        if not busy: state['phase'] = 'launch'
    # Direct delivery is routing, not an assertion that any GPU frame was presented.
    # The canonical assignment/presented handshake still gates station release.
    state['delivered'] = direct
    result = db.execute(text('INSERT INTO max_assignments(assignment_id,spec_json,state_json) VALUES (:id,:spec,:state)'),
                        {'id': spec['assignmentId'], 'spec': canonical(spec), 'state': canonical(state)})
    state['queueOrdinal'] = result.lastrowid
    if state['queueOrdinal'] > 2147483647: raise ValueError('DBOS_PRIORITY_RANGE_EXHAUSTED')
    _save(db, state)
    db.execute(text('UPDATE max_world SET revision=revision+1,active_id=CASE WHEN :busy THEN active_id ELSE :id END WHERE id=1'),
               {'busy': busy, 'id': spec['assignmentId']})
    return {'accepted': True, 'state': state}

@registry.transaction()
def advance_assignment_v4(aid, message, now, observation=None):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, aid)
    semantic_change = False
    if state['phase'] == 'launch' and not state['paused'] and state['clock'] and state['clock']['bootId'] == now['bootId']:
        launch = state['launch']
        launch['phaseElapsedMs'] = min(state['launchPlan']['timingsMs'][launch['phase']], launch['phaseElapsedMs'] + max(0, now['checkpointMs'] - state['clock']['checkpointMs']))
    if state['phase'] == 'awaiting_touch' and not (observation and observation.get('ok') and observation['snapshot']['state'].get('scanned')) and not state['paused'] and state['clock'] and state['clock']['bootId'] == now['bootId']:
        state['remainingMs'] = max(0, state['remainingMs'] - (now['checkpointMs'] - state['clock']['checkpointMs']))
        if state['remainingMs'] == 0: state['phase'] = 'releasing'; state['pendingTerminal'] = 'expired'; semantic_change = True
    state['clock'] = now
    reason = None
    if message:
        old = db.execute(text('SELECT payload_json,receipt_json FROM max_command_receipts WHERE command_id=:id'), {'id': message['commandId']}).first()
        if old:
            if old[0] != canonical(message): raise ValueError('COMMAND_ID_REUSED')
            return {'state': state, 'ack': json.loads(old[1])}
        world = db.execute(text('SELECT revision,active_id FROM max_world WHERE id=1')).one()
        kind = message['kind']
        if message['assignmentId'] != aid or world[1] != aid: reason = 'STALE_ASSIGNMENT'
        elif message['expectedRevision'] != world[0]: reason = 'REVISION_CONFLICT'
        elif state['phase'] in TERMINAL or state['phase'] == 'releasing': reason = 'ASSIGNMENT_TERMINAL'
        elif kind == 'cancel':
            reason = cancel_fence_reason(db, state, message)
            if reason is None:
                record_cancel(state, message)
                state['phase'] = 'releasing'; state['pendingTerminal'] = 'cancelled'
        elif kind == 'pause' and not state['paused']: state['paused'] = True
        elif kind == 'resume' and state['paused']: state['paused'] = False
        elif state['paused']: reason = 'ASSIGNMENT_PAUSED'
        elif kind == 'wall_start' and state['phase'] == 'selecting':
            state.update(missionId=message['missionId'], phase='launch')
            state['launchPlan'] = build_plan_v3(state['launchDefinition'], state['missionId'], aid)
            state['launch'] = initial_launch(state['launchPlan'])
        elif kind == 'launch_marker' and state['phase'] == 'launch':
            launch = state['launch']; plan = state['launchPlan']
            expected = {'tags':'tags_complete', 'ribbon':'ribbon_complete', 'wall':'wall_arrived'}[launch['phase']]
            if message.get('planId') != plan['planId']: reason = 'LAUNCH_PLAN_MISMATCH'
            elif message.get('marker') != expected: reason = 'LAUNCH_MARKER_OUT_OF_ORDER'
            elif launch['phaseElapsedMs'] < plan['timingsMs'][launch['phase']]: reason = 'LAUNCH_TOO_EARLY'
            else:
                launch['completedMarkers'].append(expected)
                if expected == 'wall_arrived': state['phase'] = 'delivery'; state['delivered'] = True
                else:
                    launch['phaseElapsedMs'] = 0
                    launch['phase'] = 'ribbon' if expected == 'tags_complete' else 'wall'

        elif kind == 'presented' and not message.get('_canonical'): reason = 'CANONICAL_PRESENTED_REQUIRED'
        elif kind == 'presented' and state['phase'] == 'delivery' and state['delivered'] and state['canonical'] and message.get('sessionId') == state['canonical']['sessionId'] and message.get('contentRevision') == state['canonicalProfile']['contentRevision']:
            state.update(presented=True, phase='awaiting_touch', remainingMs=state['settings']['touchWaitMs'])
            if state['launch'] is not None: state['launch']['phase'] = 'presented'
            _release(db, state)
        elif kind in ('contact', 'finish'): reason = 'CANONICAL_GAME_REQUIRED'
        else: reason = 'INVALID_STATE'
        semantic_change = semantic_change or reason is None
    if observation is not None: state['canonicalError'] = None if observation.get('ok') else observation.get('error')
    if observation and observation.get('ok') and state['phase'] in ('awaiting_touch','playing') and not state['paused']:
        game = observation['snapshot']['state']
        state['canonical']['gameStatus'] = game['status']
        state['canonical']['gameRevision'] = game['revision']
        if game['status'] in ('completed','incomplete','expired'):
            state['phase'] = 'releasing'
            state['pendingTerminal'] = {'completed': 'completed', 'incomplete': 'cancelled', 'expired': 'expired'}[game['status']]
            semantic_change = True
        elif game.get('scanned') and state['phase'] == 'awaiting_touch':
            state['phase'] = 'playing'; semantic_change = True
    if state['phase'] in TERMINAL:
        _release(db, state)
        db.execute(text('UPDATE max_world SET active_id=NULL WHERE id=1 AND active_id=:id'), {'id': aid})
    if semantic_change:
        state['revision'] += 1
        db.execute(text('UPDATE max_world SET revision=revision+1 WHERE id=1'))
    _save(db, state)
    return {'state': state, 'ack': _receipt(db, message, reason) if message else None}

@registry.transaction()
def set_canonical_v4(aid, request, result):
    db=registry.sql_session(); state=_get(db,aid)
    if request is not None:
        if state.get('canonicalRequest') not in (None,request): raise ValueError('CANONICAL_REQUEST_CHANGED')
        state['canonicalRequest']=request
    if result.get('ok') and result.get('value'):
        receipt=result['value']['receipt']
        sid=receipt['sessionId']
        state['canonical']={'mode':'canonical-local-v1','assignmentId':aid,'sessionId':sid,'contentRevision':receipt['contentRevision'], 'generation':receipt['generation'], 'source':state['source'], 'receipt':receipt,
            'viewUrl':state['canonicalProfile']['hostUrl']+'/max-game/webgl-v5/index.html?backend=server&assignment='+aid+'&session='+sid}
        state['canonicalError']=None
    else: state['canonicalError']=result.get('error')
    _save(db,state); return state

@registry.transaction()
def finish_release_v4(aid, result):
    db=registry.sql_session(); state=_get(db,aid)
    if state['phase']!='releasing': return state
    if not result.get('ok'):
        state['canonicalError']=result.get('error'); _save(db,state); return state
    state['canonicalRelease']=result.get('value'); state['canonicalError']=None
    state['phase']=state['pendingTerminal']; state['revision']+=1
    _release(db,state); _save(db,state)
    db.execute(text('UPDATE max_world SET active_id=NULL,revision=revision+1 WHERE id=1 AND active_id=:id'),{'id':aid})
    return state
