"""Versioned launch transactions; legacy v1 source is intentionally unchanged."""
import copy
import json
from sqlalchemy import text
from registry import registry, canonical
from max_store import TERMINAL, _get, _save, _release, get_assignment, get_receipt, confirm_enqueued_v1, admit_port_command_v1
import max_store as legacy
from max_launch_models import build_plan, initial_launch, build_plan_v3


def is_direct_stella(state):
    # Never reinterpret legacy assignments or launches started directly at the wall.
    return (state.get('schemaVersion') == 4 and state.get('source') == 'stella'
            and state.get('settings', {}).get('stellaLaunchPolicy') == 'direct')

def _snapshot(db, offset=0, limit=50):
    result = legacy._snapshot(db, offset, limit)
    current = result['current']
    if current and current.get('schemaVersion') in (2,3,4) and current['phase'] == 'launch' and not current['paused'] and current['enqueued']:
        result['actions'] = ['pause', 'cancel', 'launch_marker']
    if current and current.get('schemaVersion') == 4:
        result['protocol']='canonical-max-local-v1'
        result['actions']=[a for a in result['actions'] if a not in ('presented','contact','finish')]
    return result

def snapshot(offset=0, limit=50):
    with registry.engine.connect() as db: return _snapshot(db, offset, limit)

def _receipt(db, message, reason):
    ack = {'accepted': reason is None, 'reason': reason or 'APPLIED', 'command': copy.deepcopy(message), 'state': _snapshot(db)}
    db.execute(text('INSERT INTO max_command_receipts(command_id,payload_json,receipt_json) VALUES (:id,:payload,:receipt)'),
               {'id': message['commandId'], 'payload': canonical(message), 'receipt': canonical(ack)})
    return ack

@registry.transaction()
def create_intent_v2(spec):
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
        'schemaVersion': 2, 'launchDefinition': spec['launchDefinition'], 'launchPlan': None, 'launch': None, 'sourceSessionId': spec.get('sourceSessionId'), 'stationBinding': spec.get('stationBinding'),
        'settings': spec['settings'], 'phase': 'queued' if busy else 'selecting' if spec['missionId'] is None else 'delivery',
        'paused': False, 'revision': 0, 'remainingMs': spec['settings']['touchWaitMs'],
        'delivered': spec['source'] == 'wall', 'presented': False, 'enqueued': False,
        'stationReleased': False, 'releaseOnEnqueue': bool(busy), 'clock': None}
    if spec['missionId'] is not None:
        state['launchPlan'] = build_plan(spec['launchDefinition'], spec['missionId'], spec['assignmentId'])
        state['launch'] = initial_launch(state['launchPlan'])
        if not busy: state['phase'] = 'launch'
    state['delivered'] = False
    result = db.execute(text('INSERT INTO max_assignments(assignment_id,spec_json,state_json) VALUES (:id,:spec,:state)'),
                        {'id': spec['assignmentId'], 'spec': canonical(spec), 'state': canonical(state)})
    state['queueOrdinal'] = result.lastrowid
    if state['queueOrdinal'] > 2147483647: raise ValueError('DBOS_PRIORITY_RANGE_EXHAUSTED')
    _save(db, state)
    db.execute(text('UPDATE max_world SET revision=revision+1,active_id=CASE WHEN :busy THEN active_id ELSE :id END WHERE id=1'),
               {'busy': busy, 'id': spec['assignmentId']})
    return {'accepted': True, 'state': state}

@registry.transaction()
def activate_assignment_v2(aid, now):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, aid)
    if state['phase'] in TERMINAL:
        db.execute(text('UPDATE max_world SET active_id=NULL WHERE id=1 AND active_id=:id'), {'id': aid})
        return state
    from max_presentation_store import assert_activation_allowed
    assert_activation_allowed(db)
    active = db.execute(text('SELECT active_id FROM max_world WHERE id=1')).scalar_one_or_none()
    if active not in (None, aid): raise ValueError('MAX_ACTIVE_ASSIGNMENT_CONFLICT')
    changed = active != aid or state['phase'] == 'queued'
    if state['phase'] == 'queued':
        state['phase'] = 'delivery' if is_direct_stella(state) else 'launch'
        state['revision'] += 1
    state['clock'] = now
    _save(db, state)
    db.execute(text('UPDATE max_world SET active_id=:id,revision=revision+:changed WHERE id=1'), {'id': aid, 'changed': int(changed)})
    return state

@registry.transaction()
def advance_assignment_v2(aid, message, now):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, aid)
    semantic_change = False
    if state['phase'] == 'launch' and not state['paused'] and state['clock'] and state['clock']['bootId'] == now['bootId']:
        launch = state['launch']
        launch['phaseElapsedMs'] = min(state['launchPlan']['timingsMs'][launch['phase']], launch['phaseElapsedMs'] + max(0, now['checkpointMs'] - state['clock']['checkpointMs']))
    if state['phase'] == 'awaiting_touch' and not state['paused'] and state['clock'] and state['clock']['bootId'] == now['bootId']:
        state['remainingMs'] = max(0, state['remainingMs'] - (now['checkpointMs'] - state['clock']['checkpointMs']))
        if state['remainingMs'] == 0: state['phase'] = 'expired'; semantic_change = True
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
        elif state['phase'] in TERMINAL: reason = 'ASSIGNMENT_TERMINAL'
        elif kind == 'cancel': state['phase'] = 'cancelled'
        elif kind == 'pause' and not state['paused']: state['paused'] = True
        elif kind == 'resume' and state['paused']: state['paused'] = False
        elif state['paused']: reason = 'ASSIGNMENT_PAUSED'
        elif kind == 'wall_start' and state['phase'] == 'selecting':
            state.update(missionId=message['missionId'], phase='launch')
            state['launchPlan'] = build_plan(state['launchDefinition'], state['missionId'], aid)
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

        elif kind == 'presented' and state['phase'] == 'delivery' and state['delivered']:
            state.update(presented=True, phase='awaiting_touch', remainingMs=state['settings']['touchWaitMs'])
            state['launch']['phase'] = 'presented'
            _release(db, state)
        elif kind == 'contact' and state['phase'] == 'awaiting_touch': state['phase'] = 'playing'
        elif kind == 'finish' and state['phase'] == 'playing': state['phase'] = 'completed'
        else: reason = 'INVALID_STATE'
        semantic_change = semantic_change or reason is None
    if state['phase'] in TERMINAL:
        _release(db, state)
        db.execute(text('UPDATE max_world SET active_id=NULL WHERE id=1 AND active_id=:id'), {'id': aid})
    if semantic_change:
        state['revision'] += 1
        db.execute(text('UPDATE max_world SET revision=revision+1 WHERE id=1'))
    _save(db, state)
    return {'state': state, 'ack': _receipt(db, message, reason) if message else None}


# New durable functions only; v2 bodies above stay unchanged.
@registry.transaction()
def create_intent_v3(spec):
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
        'schemaVersion': 3, 'launchDefinition': spec['launchDefinition'], 'launchPlan': None, 'launch': None, 'sourceSessionId': spec.get('sourceSessionId'), 'stationBinding': spec.get('stationBinding'),
        'settings': spec['settings'], 'phase': 'queued' if busy else 'selecting' if spec['missionId'] is None else 'delivery',
        'paused': False, 'revision': 0, 'remainingMs': spec['settings']['touchWaitMs'],
        'delivered': spec['source'] == 'wall', 'presented': False, 'enqueued': False,
        'stationReleased': False, 'releaseOnEnqueue': bool(busy), 'clock': None}
    if spec['missionId'] is not None:
        state['launchPlan'] = build_plan_v3(spec['launchDefinition'], spec['missionId'], spec['assignmentId'], spec.get('quizHandoff'))
        state['launch'] = initial_launch(state['launchPlan'])
        if not busy: state['phase'] = 'launch'
    state['delivered'] = False
    result = db.execute(text('INSERT INTO max_assignments(assignment_id,spec_json,state_json) VALUES (:id,:spec,:state)'),
                        {'id': spec['assignmentId'], 'spec': canonical(spec), 'state': canonical(state)})
    state['queueOrdinal'] = result.lastrowid
    if state['queueOrdinal'] > 2147483647: raise ValueError('DBOS_PRIORITY_RANGE_EXHAUSTED')
    _save(db, state)
    db.execute(text('UPDATE max_world SET revision=revision+1,active_id=CASE WHEN :busy THEN active_id ELSE :id END WHERE id=1'),
               {'busy': busy, 'id': spec['assignmentId']})
    return {'accepted': True, 'state': state}

@registry.transaction()
def advance_assignment_v3(aid, message, now):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, aid)
    semantic_change = False
    if state['phase'] == 'launch' and not state['paused'] and state['clock'] and state['clock']['bootId'] == now['bootId']:
        launch = state['launch']
        launch['phaseElapsedMs'] = min(state['launchPlan']['timingsMs'][launch['phase']], launch['phaseElapsedMs'] + max(0, now['checkpointMs'] - state['clock']['checkpointMs']))
    if state['phase'] == 'awaiting_touch' and not state['paused'] and state['clock'] and state['clock']['bootId'] == now['bootId']:
        state['remainingMs'] = max(0, state['remainingMs'] - (now['checkpointMs'] - state['clock']['checkpointMs']))
        if state['remainingMs'] == 0: state['phase'] = 'expired'; semantic_change = True
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
        elif state['phase'] in TERMINAL: reason = 'ASSIGNMENT_TERMINAL'
        elif kind == 'cancel': state['phase'] = 'cancelled'
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

        elif kind == 'presented' and state['phase'] == 'delivery' and state['delivered']:
            state.update(presented=True, phase='awaiting_touch', remainingMs=state['settings']['touchWaitMs'])
            state['launch']['phase'] = 'presented'
            _release(db, state)
        elif kind == 'contact' and state['phase'] == 'awaiting_touch': state['phase'] = 'playing'
        elif kind == 'finish' and state['phase'] == 'playing': state['phase'] = 'completed'
        else: reason = 'INVALID_STATE'
        semantic_change = semantic_change or reason is None
    if state['phase'] in TERMINAL:
        _release(db, state)
        db.execute(text('UPDATE max_world SET active_id=NULL WHERE id=1 AND active_id=:id'), {'id': aid})
    if semantic_change:
        state['revision'] += 1
        db.execute(text('UPDATE max_world SET revision=revision+1 WHERE id=1'))
    _save(db, state)
    return {'state': state, 'ack': _receipt(db, message, reason) if message else None}
