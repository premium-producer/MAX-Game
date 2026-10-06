"""Loopback backend routes. Production gateway owns operator authentication."""
from dbos import DBOS,SetWorkflowID
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import Field, StrictBool
from package_models import Strict,Id
from app import ADMISSION,fail,stored_status,workflow_argument
import max_show_store as store
from max_show_workflows import configure_max_show_v1

router=APIRouter()
class ModeCommand(Strict):
    commandId:Id
    expectedRevision:int=Field(ge=0)
    enabled:StrictBool
    screenDelayMs:int=Field(default=1000,strict=True,ge=500,le=10000,multiple_of=100)

@router.get('/max/show-mode')
def get_mode():return store.mode()

@router.post('/max/show-mode')
def configure(payload:ModeCommand):
    # Preserve the exact legacy command envelope for durable command-ID retries.
    message=payload.model_dump(exclude_unset=True);wid='max-show-mode:'+message['commandId']
    with ADMISSION:
        old=stored_status(wid)
        if old and workflow_argument(old)!=message:fail(409,'COMMAND_ID_REUSED')
        with SetWorkflowID(wid):result=DBOS.start_workflow(configure_max_show_v1,message).get_result()
    return JSONResponse(result,status_code=200 if result['accepted'] else 409)

@router.get('/max/show/state')
def snapshot():
    mode=store.mode();sid=mode['activeSessionId']
    state=DBOS.get_event('session:'+sid,'state',timeout_seconds=0) if sid else None
    return {'protocol':'max-show-v1',**mode,'run':state.get('show') if state else None}
