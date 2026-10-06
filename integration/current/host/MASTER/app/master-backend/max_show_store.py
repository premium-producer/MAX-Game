"""Additive show settings and receipts in the existing DBOS registry SQLite."""
import json
from sqlalchemy import text
from registry import registry, canonical

def initialize_tables(db):
    db.execute(text('CREATE TABLE IF NOT EXISTS max_show_mode (id INTEGER PRIMARY KEY CHECK(id=1), enabled INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, active_session TEXT) STRICT'))
    columns={r[1] for r in db.execute(text('PRAGMA table_info(max_show_mode)'))}
    if 'screen_delay_ms' not in columns:
        db.execute(text('ALTER TABLE max_show_mode ADD COLUMN screen_delay_ms INTEGER NOT NULL DEFAULT 1000 CHECK(screen_delay_ms BETWEEN 500 AND 10000 AND screen_delay_ms % 100 = 0)'))
    db.execute(text('INSERT OR IGNORE INTO max_show_mode(id) VALUES(1)'))
    db.execute(text('CREATE TABLE IF NOT EXISTS max_show_commands (command_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL, receipt_json TEXT NOT NULL) STRICT'))

def _mode(db):
    r=db.execute(text('SELECT enabled,revision,active_session,screen_delay_ms FROM max_show_mode WHERE id=1')).one()
    return {'enabled':bool(r[0]),'revision':r[1],'activeSessionId':r[2],'screenDelayMs':r[3]}

def mode():
    with registry.engine.connect() as db:return _mode(db)

@registry.transaction()
def configure(message):
    db=registry.sql_session();db.execute(text('UPDATE max_show_mode SET revision=revision WHERE id=1'))
    old=db.execute(text('SELECT payload_json,receipt_json FROM max_show_commands WHERE command_id=:id'),{'id':message['commandId']}).first()
    if old:
        if old[0]!=canonical(message):return {'accepted':False,'reason':'COMMAND_ID_REUSED'}
        return json.loads(old[1])
    current=_mode(db);reason=None
    if current['revision']!=message['expectedRevision']:reason='REVISION_CONFLICT'
    elif message['enabled']:
        from max_presentation_store import presentation_reason
        reason=presentation_reason(db)
    if reason is None and message['enabled'] and not current['enabled']:
        busy=db.execute(text('SELECT active_id FROM max_world WHERE id=1')).scalar_one_or_none()
        queued=db.execute(text("SELECT COUNT(*) FROM max_assignments WHERE json_extract(state_json,'$.phase')='queued'")).scalar_one()
        station=db.execute(text("SELECT session_id FROM stations WHERE station_id='stella-main'")).scalar_one_or_none()
        execution=db.execute(text("SELECT COUNT(*) FROM execution_states WHERE json_extract(state_json,'$.phase') NOT IN ('completed','cancelled')")).scalar_one()
        if busy or queued or station or execution or current['activeSessionId']:reason='STAND_BUSY'
    if reason is None:
        db.execute(text('UPDATE max_show_mode SET enabled=:enabled,screen_delay_ms=:delay,revision=revision+1 WHERE id=1'),{'enabled':int(message['enabled']),'delay':message.get('screenDelayMs',current['screenDelayMs'])})
    result={'accepted':reason is None,'reason':reason or 'APPLIED','mode':_mode(db)}
    db.execute(text('INSERT INTO max_show_commands VALUES(:id,:payload,:receipt)'),{'id':message['commandId'],'payload':canonical(message),'receipt':canonical(result)})
    return result

@registry.transaction()
def bind(session_id):
    db=registry.sql_session()
    db.execute(text('UPDATE max_world SET revision=revision WHERE id=1'))
    from max_presentation_store import presentation_reason
    if presentation_reason(db):return {'bound':False,'screenDelayMs':1000}
    busy=db.execute(text("SELECT COUNT(*) FROM execution_states WHERE json_extract(state_json,'$.phase') NOT IN ('completed','cancelled')")).scalar_one()
    if busy:return {'bound':False,'screenDelayMs':1000}
    changed=db.execute(text('UPDATE max_show_mode SET active_session=:sid WHERE id=1 AND enabled=1 AND (active_session IS NULL OR active_session=:sid)'),{'sid':session_id}).rowcount
    return {'bound':changed==1,'screenDelayMs':_mode(db)['screenDelayMs']}

@registry.transaction()
def release(session_id):
    registry.sql_session().execute(text('UPDATE max_show_mode SET active_session=NULL WHERE id=1 AND active_session=:sid'),{'sid':session_id})
