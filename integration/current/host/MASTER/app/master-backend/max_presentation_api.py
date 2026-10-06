"""Presentation operator API; renderer evidence requires trusted local control."""

import hmac

import os

from typing import Literal

from dbos import DBOS, SetWorkflowID

from fastapi import APIRouter, Request

from fastapi.responses import JSONResponse

from pydantic import Field, StrictBool

from package_models import Strict, Id

from app import ADMISSION, fail, stored_status, workflow_argument

import max_presentation_store as store

from max_presentation_assets import AssetsSettings, load_catalog



router = APIRouter()



class ModeCommand(Strict):

    commandId: Id

    expectedRevision: int = Field(strict=True, ge=0)

    mode: Literal['standard','background','assets']



class SettingsCommand(Strict):

    commandId: Id

    expectedRevision: int = Field(strict=True, ge=0)

    assetsSettings: AssetsSettings



class AttachCommand(Strict):

    rendererBootId: Id

    expectedEpoch: int = Field(strict=True, ge=0)



class AckCommand(Strict):

    revision: int = Field(strict=True, ge=0)

    modeEpoch: int = Field(strict=True, ge=0)

    mode: Literal['standard','background','assets']

    rendererBootId: Id





def trusted(request):

    token = os.environ.get('LOCAL_MASTER_MAX_CONTROL_TOKEN','')

    if not token or not hmac.compare_digest(request.headers.get('x-local-control',''),token):

        fail(403,'CANONICAL_CONTROL_REQUIRED')



@DBOS.workflow()

def configure_max_presentation_v1(message):

    return store.configure(message)



@DBOS.workflow()

def configure_max_presentation_settings_v1(message):

    return store.configure_settings(message)



@router.get('/max/presentation')

def presentation():

    return store.state()



@router.get('/max/presentation/catalog')

def catalog():

    try:return load_catalog()

    except (OSError,ValueError,TypeError):fail(503,'ASSET_CATALOG_UNAVAILABLE')



@router.post('/max/presentation')

def configure(payload: ModeCommand):

    # Same loopback/operator gateway boundary as /max/show-mode.

    message = payload.model_dump()

    wid = 'max-presentation:'+message['commandId']

    with ADMISSION:

        old = stored_status(wid)

        if old and workflow_argument(old) != message:

            fail(409,'COMMAND_ID_REUSED')

        with SetWorkflowID(wid):

            result = DBOS.start_workflow(configure_max_presentation_v1,message).get_result()

    return JSONResponse(result,status_code=200 if result['accepted'] else 409)



@router.post('/max/presentation/settings')

def configure_settings(payload: SettingsCommand):
    # Old retry payloads must not acquire newly introduced default fields.
    message=payload.model_dump(exclude_unset=True)
    wid='max-presentation-settings:'+message['commandId']

    with ADMISSION:

        old=stored_status(wid)

        if old and workflow_argument(old)!=message:

            fail(409,'COMMAND_ID_REUSED')

        with SetWorkflowID(wid):

            result=DBOS.start_workflow(configure_max_presentation_settings_v1,message).get_result()

    return JSONResponse(result,status_code=200 if result['accepted'] else 409)



@router.post('/max/presentation/attach')

def attach(payload: AttachCommand, request: Request):

    trusted(request)

    result = store.attach(payload.model_dump())

    return JSONResponse(result,status_code=200 if result['accepted'] else 409)



@router.post('/max/presentation/ack')

def acknowledge(payload: AckCommand, request: Request):

    trusted(request)

    result = store.acknowledge(payload.model_dump())

    return JSONResponse(result,status_code=200 if result['accepted'] else 409)



class SelectedAutoplayCommand(Strict):
    commandId: Id
    expectedRevision: int = Field(strict=True, ge=0)
    enabled: StrictBool
    screenDelayMs: int = Field(default=1000, strict=True, ge=500, le=10000, multiple_of=100)


@DBOS.workflow()
def configure_max_selected_autoplay_v1(message):
    return store.configure_selected_autoplay(message)


@router.get('/max/presentation/autoplay')
def selected_autoplay():
    return store.selected_autoplay()


@router.post('/max/presentation/autoplay')
def configure_selected_autoplay(payload: SelectedAutoplayCommand):
    # Same authenticated production operator boundary as presentation settings.
    # Keep omitted delay omitted so exact retries remain exact and a toggle
    # preserves the separately configured speed.
    message=payload.model_dump(exclude_unset=True)
    wid='max-selected-autoplay:'+message['commandId']
    with ADMISSION:
        old=stored_status(wid)
        if old and workflow_argument(old)!=message:
            fail(409,'COMMAND_ID_REUSED')
        with SetWorkflowID(wid):
            result=DBOS.start_workflow(configure_max_selected_autoplay_v1,message).get_result()
    return JSONResponse(result,status_code=200 if result['accepted'] else 409)
