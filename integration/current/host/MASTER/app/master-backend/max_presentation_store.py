"""Durable MAX presentation authority on the existing registry datasource.



Standard/background and independently configured assets presentation. No queue cancellation or gameplay

mutation. Every writer shares SQLite's transaction lock with admissions.

"""

import json

import time

from sqlalchemy import text

from registry import registry, canonical

from max_presentation_assets import DEFAULT_SETTINGS, settings_reason, normalize_settings



PROTOCOL = 'max-presentation-control-v1'

MODES = ('standard', 'background', 'assets')





def _create_presentation_table(db, name):

    # name is selected only by this migration, never from an API payload.

    if name not in ('max_presentation','max_presentation_upgrade'):

        raise ValueError('Unexpected migration table')

    db.execute(text(f'''CREATE TABLE IF NOT EXISTS {name} (

        id INTEGER PRIMARY KEY CHECK(id=1),

        desired_mode TEXT NOT NULL CHECK(desired_mode IN ('standard','background','assets')),

        effective_mode TEXT CHECK(effective_mode IN ('standard','background','assets')),

        revision INTEGER NOT NULL CHECK(revision>=0),

        mode_epoch INTEGER NOT NULL CHECK(mode_epoch>=0),

        phase TEXT NOT NULL CHECK(phase IN ('pending','active')),

        renderer_boot_id TEXT, last_ack_at INTEGER, master_boot_id TEXT,

        assets_settings_json TEXT NOT NULL CHECK(json_valid(assets_settings_json)),

        settings_revision INTEGER NOT NULL CHECK(settings_revision>=0)) STRICT'''))





def initialize_tables(db):
    # Independent manual-mission playback policy. The startup transaction owns
    # this additive migration; presentation/show/visitor tables are untouched.
    db.execute(text('''CREATE TABLE IF NOT EXISTS max_selected_autoplay (
        id INTEGER PRIMARY KEY CHECK(id=1),
        enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
        screen_delay_ms INTEGER NOT NULL DEFAULT 1000
            CHECK(screen_delay_ms BETWEEN 500 AND 10000 AND screen_delay_ms % 100=0),
        revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0)) STRICT'''))
    db.execute(text('INSERT OR IGNORE INTO max_selected_autoplay(id) VALUES(1)'))
    db.execute(text('''CREATE TABLE IF NOT EXISTS max_selected_autoplay_commands (
        command_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL,
        receipt_json TEXT NOT NULL) STRICT'''))

    # Startup caller owns the same explicit SQLite BEGIN IMMEDIATE used by all

    # registry migrations. Rebuild only our singleton table to widen its CHECK;

    # no foreign keys point to it and all command receipts stay in place.

    definition=db.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='max_presentation'")).scalar_one_or_none()

    if definition and "'assets'" not in definition:

        if db.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='max_presentation_upgrade'")).scalar_one_or_none():

            raise RuntimeError('PRESENTATION_MIGRATION_CONFLICT')

        columns={row[1] for row in db.execute(text('PRAGMA table_info(max_presentation)'))}

        if 'master_boot_id' not in columns:

            db.execute(text('ALTER TABLE max_presentation ADD COLUMN master_boot_id TEXT'))

        _create_presentation_table(db,'max_presentation_upgrade')

        db.execute(text('''INSERT INTO max_presentation_upgrade

            SELECT id,desired_mode,effective_mode,revision,mode_epoch,phase,

                   renderer_boot_id,last_ack_at,master_boot_id,:settings,0

            FROM max_presentation'''), {'settings':canonical(DEFAULT_SETTINGS)})

        db.execute(text('DROP TABLE max_presentation'))

        db.execute(text('ALTER TABLE max_presentation_upgrade RENAME TO max_presentation'))

    else:

        _create_presentation_table(db,'max_presentation')

    db.execute(text("INSERT OR IGNORE INTO max_presentation VALUES(1,'standard',NULL,0,0,'pending',NULL,NULL,NULL,:settings,0)"), {'settings':canonical(DEFAULT_SETTINGS)})

    db.execute(text('''CREATE TABLE IF NOT EXISTS max_presentation_commands (

        command_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL,

        receipt_json TEXT NOT NULL) STRICT'''))





def begin_boot(boot_id):

    # Runs once before DBOS recovery/admissions start. A persisted ACK belongs

    # to the previous MASTER lifetime, even when MAX has not reattached yet.

    with registry.engine.begin() as db:

        db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))

        previous=db.execute(text('SELECT master_boot_id FROM max_presentation WHERE id=1')).scalar_one_or_none()

        if previous != boot_id:

            db.execute(text("UPDATE max_presentation SET master_boot_id=:boot,mode_epoch=mode_epoch+1,effective_mode=NULL,renderer_boot_id=NULL,phase='pending',last_ack_at=NULL WHERE id=1"), {'boot':boot_id})

        return _state(db)





def _state(db):

    r = db.execute(text('SELECT desired_mode,effective_mode,revision,mode_epoch,phase,renderer_boot_id,last_ack_at,assets_settings_json,settings_revision FROM max_presentation WHERE id=1')).one()

    return {'protocol':PROTOCOL, 'desiredMode':r[0], 'effectiveMode':r[1],

        'revision':r[2], 'modeEpoch':r[3], 'phase':r[4], 'rendererBootId':r[5], 'lastAckAt':r[6], 'assetsSettings':json.loads(r[7]), 'settingsRevision':r[8]}





def state():

    with registry.engine.connect() as db:

        return _state(db)





def presentation_reason(db):

    """Call after first DML, in the SAME transaction as the admission commit."""

    s = _state(db)

    if s['desiredMode'] != 'standard':

        return 'MAX_PRESENTATION_ASSETS' if s['desiredMode']=='assets' else 'MAX_PRESENTATION_BACKGROUND'

    if s['phase'] != 'active' or s['effectiveMode'] != 'standard':

        return 'MAX_PRESENTATION_PENDING'

    return None





def admission_reason(db):

    reason = presentation_reason(db)

    if reason:

        return reason

    show = db.execute(text('SELECT enabled,active_session FROM max_show_mode WHERE id=1')).one()

    return 'MAX_SHOW_MODE_ACTIVE' if show[0] or show[1] else None





def assert_activation_allowed(db):

    # Already committed work may continue across renderer reattachment while

    # standard stays selected. A background switch rejects ALL live intents,

    # so background + queued activation would mean corrupt/incompatible data.

    if _state(db)['desiredMode'] != 'standard':

        raise RuntimeError('MAX_PRESENTATION_ACTIVATION_BLOCKED')





def _busy_reason(db):

    show = db.execute(text('SELECT enabled,active_session FROM max_show_mode WHERE id=1')).one()

    if show[0] or show[1]:

        return 'MAX_SHOW_MODE_ACTIVE'

    if db.execute(text('SELECT active_id FROM max_world WHERE id=1')).scalar_one_or_none():

        return 'MAX_BUSY'

    if db.execute(text("SELECT COUNT(*) FROM max_assignments WHERE json_extract(state_json,'$.phase') NOT IN ('completed','cancelled','expired')")).scalar_one():

        return 'MAX_BUSY'

    if db.execute(text("SELECT COUNT(*) FROM execution_states WHERE json_extract(state_json,'$.phase') NOT IN ('completed','cancelled')")).scalar_one():

        return 'EXECUTION_BUSY'

    # Preserve shared admission. The current schema does not encode service in

    # this row, so conservative rejection includes a live VK Stella visit.

    if db.execute(text("SELECT session_id FROM stations WHERE station_id='stella-main'")).scalar_one_or_none():

        return 'STATION_BUSY'

    return None





@registry.transaction()

def configure(message):

    db = registry.sql_session()

    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))

    old = db.execute(text('SELECT payload_json,receipt_json FROM max_presentation_commands WHERE command_id=:id'), {'id':message['commandId']}).first()

    if old:

        if old[0] != canonical(message):

            return {'accepted':False, 'reason':'COMMAND_ID_REUSED', 'state':_state(db)}

        return json.loads(old[1])

    current = _state(db)

    reason = None

    if message['mode'] not in MODES:

        reason = 'MODE_NOT_SUPPORTED'

    elif current['revision'] != message['expectedRevision']:

        reason = 'REVISION_CONFLICT'

    elif message['mode'] != current['desiredMode']:

        reason = _busy_reason(db)

    else:

        # Even a no-op cannot claim control over a concurrently enabled legacy

        # show. Existing show is disabled through its existing operator API.

        show = db.execute(text('SELECT enabled,active_session FROM max_show_mode WHERE id=1')).one()

        if show[0] or show[1]:

            reason = 'MAX_SHOW_MODE_ACTIVE'

    if reason is None and message['mode'] == 'assets':

        reason = settings_reason(current['assetsSettings'])

    if reason is None and message['mode'] != current['desiredMode']:

        db.execute(text('''UPDATE max_presentation SET desired_mode=:mode,

            effective_mode=NULL, revision=revision+1, mode_epoch=mode_epoch+1,

            phase='pending',last_ack_at=NULL WHERE id=1'''), {'mode':message['mode']})

    receipt = {'accepted':reason is None, 'reason':reason or 'APPLIED', 'state':_state(db)}

    db.execute(text('INSERT INTO max_presentation_commands VALUES(:id,:payload,:receipt)'),

        {'id':message['commandId'], 'payload':canonical(message), 'receipt':canonical(receipt)})

    return receipt





@registry.transaction()

def configure_settings(message):

    db=registry.sql_session()

    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))

    old=db.execute(text('SELECT payload_json,receipt_json FROM max_presentation_commands WHERE command_id=:id'), {'id':message['commandId']}).first()

    if old:

        if old[0]!=canonical(message):

            return {'accepted':False,'reason':'COMMAND_ID_REUSED','state':_state(db)}

        return json.loads(old[1])

    current=_state(db)

    reason='REVISION_CONFLICT' if current['revision']!=message['expectedRevision'] else settings_reason(message['assetsSettings'])

    if reason is None:

        settings=normalize_settings(message['assetsSettings'])

        if settings!=current['assetsSettings']:

            db.execute(text('''UPDATE max_presentation SET assets_settings_json=:settings,

                settings_revision=settings_revision+1,revision=revision+1,

                mode_epoch=mode_epoch+CASE WHEN desired_mode='assets' THEN 1 ELSE 0 END,

                effective_mode=CASE WHEN desired_mode='assets' THEN NULL ELSE effective_mode END,

                phase=CASE WHEN desired_mode='assets' THEN 'pending' ELSE phase END,

                last_ack_at=CASE WHEN desired_mode='assets' THEN NULL ELSE last_ack_at END

                WHERE id=1'''), {'settings':canonical(settings)})

    receipt={'accepted':reason is None,'reason':reason or 'APPLIED','state':_state(db)}

    db.execute(text('INSERT INTO max_presentation_commands VALUES(:id,:payload,:receipt)'),

        {'id':message['commandId'],'payload':canonical(message),'receipt':canonical(receipt)})

    return receipt





@registry.transaction()

def attach(message):

    db = registry.sql_session()

    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))

    current = _state(db)

    if current['rendererBootId'] == message['rendererBootId']:

        return {'accepted':True, 'reason':'ALREADY_ATTACHED', 'state':current}

    if current['modeEpoch'] != message['expectedEpoch']:

        return {'accepted':False, 'reason':'EPOCH_CONFLICT', 'state':current}

    db.execute(text("UPDATE max_presentation SET renderer_boot_id=:boot,mode_epoch=mode_epoch+1,effective_mode=NULL,phase='pending',last_ack_at=NULL WHERE id=1"), {'boot':message['rendererBootId']})

    return {'accepted':True, 'reason':'ATTACHED', 'state':_state(db)}





@registry.transaction()

def acknowledge(message):

    db = registry.sql_session()

    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))

    current = _state(db)

    expected = (current['revision'], current['modeEpoch'], current['desiredMode'], current['rendererBootId'])

    actual = (message['revision'], message['modeEpoch'], message['mode'], message['rendererBootId'])

    if current['rendererBootId'] is None or actual != expected:

        return {'accepted':False, 'reason':'STALE_PRESENTATION_ACK', 'state':current}

    duplicate = current['phase'] == 'active'

    if not duplicate:

        db.execute(text("UPDATE max_presentation SET effective_mode=desired_mode,phase='active',last_ack_at=:at WHERE id=1"), {'at':int(time.time()*1000)})

    return {'accepted':True, 'reason':'ALREADY_APPLIED' if duplicate else 'APPLIED', 'state':_state(db)}



SELECTED_AUTOPLAY_PROTOCOL = 'max-selected-autoplay-v1'


def _selected_autoplay(db):
    row=db.execute(text('SELECT enabled,screen_delay_ms,revision FROM max_selected_autoplay WHERE id=1')).one()
    return {'protocol':SELECTED_AUTOPLAY_PROTOCOL, 'enabled':bool(row[0]),
        'screenDelayMs':row[1], 'revision':row[2]}


def selected_autoplay():
    with registry.engine.connect() as db:
        return _selected_autoplay(db)


@registry.transaction()
def configure_selected_autoplay(message):
    # Live policy changes may happen during an assignment. They never mutate
    # mission progress, admission, leases or presentation ACK epochs.
    db=registry.sql_session()
    db.execute(text('UPDATE max_selected_autoplay SET revision=revision WHERE id=1'))
    old=db.execute(text('SELECT payload_json,receipt_json FROM max_selected_autoplay_commands WHERE command_id=:id'), {'id':message['commandId']}).first()
    if old:
        if old[0]!=canonical(message):
            return {'accepted':False, 'reason':'COMMAND_ID_REUSED', 'state':_selected_autoplay(db)}
        return json.loads(old[1])
    current=_selected_autoplay(db)
    reason='REVISION_CONFLICT' if current['revision']!=message['expectedRevision'] else None
    if reason is None:
        db.execute(text('UPDATE max_selected_autoplay SET enabled=:enabled,screen_delay_ms=:delay,revision=revision+1 WHERE id=1'),
            {'enabled':int(message['enabled']), 'delay':message.get('screenDelayMs',current['screenDelayMs'])})
    receipt={'accepted':reason is None, 'reason':reason or 'APPLIED', 'state':_selected_autoplay(db)}
    db.execute(text('INSERT INTO max_selected_autoplay_commands VALUES(:id,:payload,:receipt)'),
        {'id':message['commandId'], 'payload':canonical(message), 'receipt':canonical(receipt)})
    return receipt
