"""Explicit offline build of the gameplay water mask (requires Pillow).

Not part of build/sync-assets: changing Earth artwork must not change gameplay.
Run from any directory. Input and quantization are recorded in the manifest.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parents[1]
source = root / 'public/earth/Earth_Specular_4K.webp'
image = Image.open(source).convert('RGB')
width, height = image.size
assert (width, height) == (4096, 2048)
pixels = image.tobytes()
water = bytearray((width * height + 7) // 8)
water_count = 0
for index in range(width * height):
    if pixels[index * 3] >= 128:
        water[index >> 3] |= 1 << (index & 7)
        water_count += 1
target = root / 'public/earth/Earth_Surface_4K.bin'
target.write_bytes(water)
manifest = dict(schemaVersion=1, width=width, height=height,
                encoding='water-bitset-lsb', origin='north-west',
                data='Earth_Surface_4K.bin', byteLength=len(water),
                sha256=hashlib.sha256(water).hexdigest(),
                source=source.name, sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                rule='Source red >= 128 is water; otherwise land. No dilation. Nearest pixel.',
                waterPixels=water_count, landPixels=width * height - water_count)
(target.parent / 'Earth_Surface_4K.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
