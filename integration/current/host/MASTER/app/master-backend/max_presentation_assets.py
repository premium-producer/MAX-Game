"""Independent MAX scene schema and immutable local catalog allowlist."""
import json
from pathlib import Path
from typing import Literal
from pydantic import Field, model_validator, ValidationError
from package_models import Strict, Id

DEFAULT_SETTINGS={'deviceAssetId':None,'deviceVisible':False,'iconsVisible':False,'icons':[]}
DEFAULT_CYCLE_IDS=['device.custom.home-photo-no-benefits','device.custom.tv-first-30s']
CATALOG_PATH=Path(__file__).resolve().parent/'configs/max-presentation-assets.json'

class IconInstance(Strict):
    instanceId:Id
    assetId:Id
    side:Literal['left','right']
    enabled:bool

class AssetsSettings(Strict):
    deviceAssetId:Id|None
    deviceVisible:bool
    iconsVisible:bool
    icons:list[IconInstance]=Field(max_length=8)
    iconSizePx:int=Field(default=256,strict=True,ge=64,le=1024)
    cycleEnabled:bool=False
    cycleAssetIds:list[Id]=Field(default_factory=lambda:list(DEFAULT_CYCLE_IDS),min_length=2,max_length=2)
    staticWaitSeconds:float=Field(default=5,strict=True,ge=0.5,le=3600,allow_inf_nan=False)

    @model_validator(mode='after')
    def consistent(self):
        if len({icon.instanceId for icon in self.icons})!=len(self.icons):
            raise ValueError('Duplicate icon instance ID')
        if len(set(self.cycleAssetIds))!=2:
            raise ValueError('Select two distinct cycle assets')
        if (self.deviceVisible or self.iconsVisible) and self.deviceAssetId is None and not self.cycleEnabled:
            raise ValueError('Select a device asset before showing device or icons')
        return self


def normalize_settings(value):
    # Preserve omitted optional fields in old stored commands and receipts.
    # Consumers apply schema defaults; explicit values are persisted.
    return AssetsSettings.model_validate(value).model_dump(exclude_unset=True)


def load_catalog():
    """No network, filesystem input or URL supplied by an operator command."""
    raw=CATALOG_PATH.read_bytes()
    if len(raw)>2_000_000:
        raise ValueError('Catalog exceeds size limit')
    catalog=json.loads(raw)
    if not isinstance(catalog,dict) or catalog.get('schemaVersion')!=1:
        raise ValueError('Invalid catalog version')
    result=[]
    for group in ('devices','icons'):
        rows=catalog.get(group)
        if not isinstance(rows,list):raise ValueError('Invalid catalog collection')
        ids=[]
        for row in rows:
            if not isinstance(row,dict) or not isinstance(row.get('id'),str) or not row['id']:
                raise ValueError('Invalid catalog asset ID')
            ids.append(row['id'])
        if len(set(ids))!=len(ids):raise ValueError('Duplicate catalog asset ID')
        result.append(set(ids))
    return catalog


def catalog_ids():
    catalog=load_catalog()
    return {row['id'] for row in catalog['devices']},{row['id'] for row in catalog['icons']}


def settings_reason(value):
    try:settings=normalize_settings(value)
    except (ValidationError,ValueError,TypeError):return 'ASSETS_SETTINGS_INVALID'
    # The empty scene remains available even if an optional catalog is absent.
    if settings['deviceAssetId'] is None and not settings['icons'] and not settings.get('cycleEnabled',False):
        return None
    try:devices,icons=catalog_ids()
    except (OSError,ValueError,TypeError):return 'ASSET_CATALOG_UNAVAILABLE'
    if settings['deviceAssetId'] is not None and settings['deviceAssetId'] not in devices:
        return 'DEVICE_ASSET_UNKNOWN'
    if settings.get('cycleEnabled',False) and any(asset not in devices for asset in settings.get('cycleAssetIds',DEFAULT_CYCLE_IDS)):
        return 'DEVICE_ASSET_UNKNOWN'
    if any(icon['assetId'] not in icons for icon in settings['icons']):
        return 'ICON_ASSET_UNKNOWN'
    return None
