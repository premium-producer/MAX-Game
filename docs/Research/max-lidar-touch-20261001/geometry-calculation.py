"""Offline installation estimate from current WEB geometry; not a hardware calibration."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
source = ROOT / 'artifacts/service/public/surface-geometry.json'
model = json.loads(source.read_text(encoding='utf-8-sig'))
surface = model['surfaces']['SCREEN_RIGHT']
points = [(p, uv) for p, uv in zip(surface['positions'], surface['uv'])
          if uv[0] * 4096 >= 2192.025 - 1]
assert points and max(p[0] for p, _ in points) - min(p[0] for p, _ in points) < 1e-5
left = min(uv[0] for _, uv in points) * 4096
right = max(uv[0] for _, uv in points) * 4096
flat_width = max(p[2] for p, _ in points) - min(p[2] for p, _ in points)
bottom = min(p[1] for p, _ in points)
top = max(p[1] for p, _ in points)
height = top - bottom
zone = {'left': 2264, 'top': 192, 'width': 1760, 'height': 1024}
assert left < zone['left'] and zone['left'] + zone['width'] < right
zone_width = zone['width'] * flat_width / (right - left)
zone_height = zone['height'] * height / 1280
zone_top = top - zone['top'] * height / 1280
zone_bottom = top - (zone['top'] + zone['height']) * height / 1280
cases = []
for name, mounting_y in [('100mm-above-game', zone_top + .1), ('100mm-above-screen', top + .1)]:
    down = mounting_y - zone_bottom
    distance = math.hypot(zone_width / 2, down)
    cases.append({'case': name, 'sensorHeightMetres': mounting_y,
                  'farthestCornerMetres': distance,
                  'raySpacingAtCornerMm': distance * math.radians(.25) * 1000,
                  'angleToUpperCornerDegrees': math.degrees(math.atan2(zone_width / 2, mounting_y-zone_top)),
                  'assumption': 'Optical origin centered horizontally; clearance is illustrative, not approved.'})
result = {'status': 'model-estimate-not-as-built',
          'geometrySha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'modelSha256': model['modelSha256'],
          'logicalRightSize': [4096, 1280], 'gameZone': zone,
          'flatLocalX': [left, right], 'flatWidthMetres': flat_width,
          'screenHeightMetres': height, 'gameWidthMetres': zone_width,
          'gameHeightMetres': zone_height, 'gameTopHeightMetres': zone_top,
          'gameBottomHeightMetres': zone_bottom,
          'gameCentreRightX': 3144, 'gameCentreRearX': 6216,
          'millimetresPerPixelX': flat_width / (right-left) * 1000,
          'millimetresPerPixelY': height / 1280 * 1000,
          'mountingEstimates': cases,
          'planeTiltDriftAt2mMm': {str(degrees): math.tan(math.radians(degrees))*2000 for degrees in [1, .2]},
          'distanceSamplesPerSecond': 1081*40,
          'distancePayloadBytesPerSecond': 1081*40*3}
out = Path(__file__).with_name('geometry.json')
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
