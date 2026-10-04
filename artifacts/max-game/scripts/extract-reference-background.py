"""Extract only the background of the supplied Figma frame, retaining its dependencies."""
import copy
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
ET.register_namespace('html', 'http://www.w3.org/1999/xhtml')
source = Path(sys.argv[1])
raw = source.read_bytes()
tree = ET.fromstring(raw)
assert tree.get('viewBox') == '0 0 3591 1113', 'Unexpected reference frame'
group = tree.find(f'{{{SVG}}}g')
layers = list(group)[:9]
assert [x.tag.split('}')[-1] for x in layers] == ['rect', 'rect', 'g'] + ['rect'] * 6
assert layers[-1].get('fill') == 'url(#paint7_radial_2426_24994)'
assert not any(x.tag.endswith(('script', 'animate')) for x in tree.iter())
defs = {x.get('id'): x for x in tree.find(f'{{{SVG}}}defs')}

def refs(node):
    found = set()
    for child in node.iter():
        for key, value in child.attrib.items():
            found.update(re.findall(r'url\(#([^)]*)\)', value))
            if key.endswith('href') and value.startswith('#'):
                found.add(value[1:])
    return found

result = ET.Element(f'{{{SVG}}}svg', {'width': '100%', 'height': '100%',
    'viewBox': tree.get('viewBox'), 'preserveAspectRatio': 'xMidYMid slice',
    'fill': 'none', 'style': 'background:#0D001A;isolation:isolate'})
background = ET.SubElement(result, f'{{{SVG}}}g', group.attrib)
for layer in layers:
    background.append(copy.deepcopy(layer))
needed = refs(background)
pending = list(needed)
while pending:
    dependency = pending.pop()
    assert dependency in defs, f'Missing definition {dependency}'
    for child in refs(defs[dependency]) - needed:
        needed.add(child)
        pending.append(child)
output_defs = ET.SubElement(result, f'{{{SVG}}}defs')
for key, value in defs.items():
    if key in needed:
        output_defs.append(copy.deepcopy(value))
assert refs(result) <= needed
target = ROOT / 'artifacts/max-game/public/assets/backgrounds/figma-game-background.svg'
target.parent.mkdir(parents=True, exist_ok=True)
ET.ElementTree(result).write(target, encoding='utf-8', xml_declaration=True)
report = {
    'source': source.name, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
    'viewBox': tree.get('viewBox'), 'layerCount': len(layers),
    'dependencies': sorted(needed), 'baseColor': '#0D001A',
    'patternOpacity': 0.2,
    'angularGradients': [x.get('style') for x in background.iter() if x.tag.endswith('div')],
    'radialGradients': [{'id': x.get('id'), 'transform': x.get('gradientTransform'),
        'stops': [s.attrib for s in x]} for x in output_defs if x.tag.endswith('radialGradient')],
    'blurSigma': [x.get('stdDeviation') for x in output_defs.iter() if x.tag.endswith('feGaussianBlur')],
    'outputSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'rendering': 'standalone SVG document; foreignObject conic gradients require document context, not img',
    'scope': 'local Guided Reveal background only; no logos, tasks or phone UI',
}
target.with_suffix('.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'layers': len(layers), 'definitions': len(needed), 'bytes': target.stat().st_size}))
