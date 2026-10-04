"""Extract supplied glyphs and shell geometry, without reference labels/effects.

Original release assets stay byte-identical. ElementTree handles XML; Chromium
SVG-as-image and Three CanvasTexture render the derived plain SVG at runtime.
"""
import copy
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / 'vendor/backend-figma-v2'
OUT = ROOT / 'public/webgl-v5/icon-glyphs'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
tag = lambda name: '{' + NS + '}' + name


def prepare():
    catalog = json.loads((RELEASE / 'catalog.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    result = {}
    for asset in catalog['assets'].values():
        if not asset['assetId'].startswith('max-icon.'):
            continue
        raw = (RELEASE / asset['path']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == asset['sha256']
        root = ET.fromstring(raw)
        radius = None
        if asset.get('hasEmbeddedLabel'):
            groups = [el for el in root if el.tag == tag('g') and el.get('clip-path', '').startswith('url(#clip0_')]
            assert len(groups) == 1, asset['assetId']
            group = groups[0]
            clip_id = group.get('clip-path')[5:-1]
            clip = root.find(f".//{tag('clipPath')}[@id='{clip_id}']")
            shell = clip.find(tag('rect'))
            assert shell.get('width') == shell.get('height') == '120'
            matrix = shell.get('transform')[7:-1].split()
            assert matrix[:4] == ['1', '0', '0', '-1'] and matrix[5] == '120'
            x = float(matrix[4])
            radius = float(shell.get('rx')) / 120
            plain = ET.Element(tag('svg'), {'width': '120', 'height': '120', 'viewBox': f'{x:g} 0 120 120', 'fill': 'none'})
            glyphs = [el for el in group if not any(el.get(a) for a in ('filter', 'data-figma-skip-parse', 'data-figma-bg-blur-radius', 'data-figma-gradient-fill')) and el.tag != tag('foreignObject')]
            assert glyphs and all(el.tag in (tag('path'), tag('g')) for el in glyphs)
            for el in glyphs:
                plain.append(copy.deepcopy(el))
            # Keep native clip geometry required by the hotel/age glyphs.
            defs = ET.SubElement(plain, tag('defs'))
            for el in root.findall(f'.//{tag("clipPath")}'):
                defs.append(copy.deepcopy(el))
            root = plain
        data = ET.tostring(root, encoding='utf-8', xml_declaration=True)
        assert b'foreignObject' not in data and b'<text' not in data
        name = asset['assetId'] + '.svg'
        (OUT / name).write_bytes(data)
        result[asset['assetId']] = {'path': 'webgl-v5/icon-glyphs/' + name, 'sha256': hashlib.sha256(data).hexdigest(), 'sourceSha256': asset['sha256'], 'radiusRatio': radius, 'hasEmbeddedLabel': False}
    (OUT / 'manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'glyphs': len(result), 'labels': 'excluded; catalog labels rendered by UI'}))


if __name__ == '__main__':
    prepare()
