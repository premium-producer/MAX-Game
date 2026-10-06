"""Technical MAX persistence on existing DBOS SQLAlchemyDatasource."""
import copy
import json
from sqlalchemy import text
from registry import registry, canonical

TERMINAL = {'completed', 'cancelled', 'expired'}

def initialize_tables(db):
    for sql in [
        'CREATE TABLE IF NOT EXISTS max_world(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, active_id TEXT) STRICT',
        'INSERT OR IGNORE INTO max_world(id,revision,active_id) VALUES (1,0,NULL)',
        '''CREATE TABLE IF NOT EXISTS max_assignments(seq INTEGER PRIMARY KEY AUTOINCREMENT, assignment_id TEXT UNIQUE NOT NULL,
            spec_json TEXT NOT NULL CHECK(json_valid(spec_json)), state_json TEXT NOT NULL CHECK(json_valid(state_json))) STRICT''',
        '''CREATE TABLE IF NOT EXISTS max_command_receipts(command_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL,
            receipt_json TEXT NOT NULL CHECK(json_valid(receipt_json))) STRICT''',
    ]:
        db.execute(text(sql))

def _get(db, aid):
    row = db.execute(text('SELECT state_json FROM max_assignments WHERE assignment_id=:id'), {'id': aid}).first()
    return json.loads(row[0]) if row else None

def _save(db, state):
    db.execute(text('UPDATE max_assignments SET state_json=:state WHERE assignment_id=:id'),
               {'id': state['assignmentId'], 'state': canonical(state)})

def _snapshot(db, offset=0, limit=50):
    world = db.execute(text('SELECT revision,active_id FROM max_world WHERE id=1')).one()
    current = _get(db, world[1]) if world[1] else None
    where = "json_extract(state_json,'$.phase')='queued'"
    count = db.execute(text('SELECT count(*) FROM max_assignments WHERE ' + where)).scalar_one()
    rows = db.execute(text('SELECT state_json FROM max_assignments WHERE ' + where + ' ORDER BY seq LIMIT :limit OFFSET :offset'),
                      {'limit': limit, 'offset': offset})
    phase = ('paused' if current['paused'] else current['phase']) if current else 'idle'
    actions = []
    if current:
        actions = ['resume', 'cancel'] if current['paused'] else ['pause', 'cancel']
        if not current['paused']:
            if phase == 'selecting': actions += ['wall_start']
            elif phase == 'delivery': actions += ['presented'] if current['delivered'] else ['delivery']
            elif phase == 'awaiting_touch': actions += ['contact']
            elif phase == 'playing': actions += ['finish']
    elif not count:
        actions = ['wall_select']
    if current and not current['enqueued']: actions = []
    return {'protocol': 'technical-max-v1', 'fixtureOnly': True, 'revision': world[0], 'phase': phase,
            'current': current, 'queue': [json.loads(row[0]) for row in rows], 'queueCount': count,
            'queueOffset': offset, 'queueLimit': limit, 'actions': actions}

def snapshot(offset=0, limit=50):
    with registry.engine.connect() as db: return _snapshot(db, offset, limit)

def get_assignment(aid):
    with registry.engine.connect() as db: return _get(db, aid)

def get_receipt(command_id):
    with registry.engine.connect() as db:
        row = db.execute(text('SELECT payload_json,receipt_json FROM max_command_receipts WHERE command_id=:id'), {'id': command_id}).first()
        return {'command': json.loads(row[0]), 'ack': json.loads(row[1])} if row else None

def _release(db, state):
    binding = state.get('stationBinding')
    if binding is None or state.get('stationReleased'): return
    changed = db.execute(text('''UPDATE stations SET session_id=NULL,visit_id=NULL WHERE station_id=:stationId
        AND session_id=:sessionId AND visit_id=:visitId AND generation=:generation'''), binding).rowcount
    state['stationReleased'] = changed == 1

def _receipt(db, message, reason):
    ack = {'accepted': reason is None, 'reason': reason or 'APPLIED', 'command': copy.deepcopy(message), 'state': _snapshot(db)}
    db.execute(text('INSERT INTO max_command_receipts(command_id,payload_json,receipt_json) VALUES (:id,:payload,:receipt)'),
               {'id': message['commandId'], 'payload': canonical(message), 'receipt': canonical(ack)})
    return ack

@registry.transaction()
def create_intent_v1(spec):
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
        'sourceSessionId': spec.get('sourceSessionId'), 'stationBinding': spec.get('stationBinding'),
        'settings': spec['settings'], 'phase': 'queued' if busy else 'selecting' if spec['missionId'] is None else 'delivery',
        'paused': False, 'revision': 0, 'remainingMs': spec['settings']['touchWaitMs'],
        'delivered': spec['source'] == 'wall', 'presented': False, 'enqueued': False,
        'stationReleased': False, 'releaseOnEnqueue': bool(busy), 'clock': None}
    result = db.execute(text('INSERT INTO max_assignments(assignment_id,spec_json,state_json) VALUES (:id,:spec,:state)'),
                        {'id': spec['assignmentId'], 'spec': canonical(spec), 'state': canonical(state)})
    state['queueOrdinal'] = result.lastrowid
    if state['queueOrdinal'] > 2147483647: raise ValueError('DBOS_PRIORITY_RANGE_EXHAUSTED')
    _save(db, state)
    db.execute(text('UPDATE max_world SET revision=revision+1,active_id=CASE WHEN :busy THEN active_id ELSE :id END WHERE id=1'),
               {'busy': busy, 'id': spec['assignmentId']})
    return {'accepted': True, 'state': state}

@registry.transaction()
def confirm_enqueued_v1(spec):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, spec['assignmentId'])
    state['enqueued'] = True
    if state['releaseOnEnqueue']: _release(db, state)
    if state['sourceSessionId']:
        db.execute(text("UPDATE sessions SET status='completed' WHERE session_id=:id AND status='active'"), {'id': state['sourceSessionId']})
    _save(db, state)
    if spec.get('wallCommand'):
        return {'accepted': True, 'state': state, 'ack': _receipt(db, spec['wallCommand'], None)}
    return {'accepted': True, 'state': state}

@registry.transaction()
def activate_assignment_v1(aid, now):
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
        state['phase'] = 'delivery'
        state['revision'] += 1
    state['clock'] = now
    _save(db, state)
    db.execute(text('UPDATE max_world SET active_id=:id,revision=revision+:changed WHERE id=1'), {'id': aid, 'changed': int(changed)})
    return state

@registry.transaction()
def advance_assignment_v1(aid, message, now):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, aid)
    semantic_change = False
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
            state.update(missionId=message['missionId'], phase='delivery')
        elif kind == 'delivery' and state['phase'] == 'delivery' and not state['delivered']: state['delivered'] = True
        elif kind == 'presented' and state['phase'] == 'delivery' and state['delivered']:
            state.update(presented=True, phase='awaiting_touch', remainingMs=state['settings']['touchWaitMs'])
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

@registry.transaction()
def admit_port_command_v1(message):
    db = registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    state = _get(db, message['assignmentId'])
    prior = db.execute(text('SELECT payload_json,receipt_json FROM max_command_receipts WHERE command_id=:id'), {'id': message['commandId']}).first()
    if prior:
        if prior[0] != canonical(message): raise ValueError('COMMAND_ID_REUSED')
        return {'accepted': False, 'ack': json.loads(prior[1])}
    active = db.execute(text('SELECT active_id FROM max_world WHERE id=1')).scalar_one_or_none()
    reason = ('ASSIGNMENT_STARTING' if state and not state['enqueued'] else
              'QUEUED_ASSIGNMENT_NOT_ACTIVE' if state and state['phase'] == 'queued' else
              'STALE_ASSIGNMENT' if active != message['assignmentId'] else None)
    return {'accepted': True} if reason is None else {'accepted': False, 'ack': _receipt(db, message, reason)}
