"""Prepare Figma ID exports for origin-clean CanvasTexture upload.

Keep paths/text as vectors. Replace HTML backdrop blur with native SVG filters;
only CSS conic-gradient paints become embedded 512px PNGs (never whole screens).
Original exports remain untouched. No external services or dependencies at runtime.
"""
from pathlib import Path
import base64
import copy
import hashlib
import io
import json
import math
import re
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT / "artifacts/max-game/public/assets/digital-id"
NS = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
ET.register_namespace("", NS)
ET.register_namespace("xlink", XLINK)


def tag(name):
    return f"{{{NS}}}{name}"


def conic_image(style, size=512):
    start = float(re.search(r"conic-gradient\(from ([\d.-]+)deg", style)[1])
    stops = [(float(angle), tuple(map(float, rgba.split(','))))
             for rgba, angle in re.findall(r"rgba\(([^)]+)\)\s*([\d.-]+)deg", style)]
    if len(stops) < 2 or stops[0][0] != 0 or stops[-1][0] != 360:
        raise ValueError("Unsupported conic gradient stops")
    # CSS gradients interpolate premultiplied sRGB, clockwise from twelve o'clock.
    colors = []
    for i in range(4096):
        angle = i * 360 / 4096
        j = next(j for j in range(1, len(stops)) if stops[j][0] >= angle)
        a, ca = stops[j-1]
        b, cb = stops[j]
        t = (angle-a)/(b-a)
        alpha = ca[3]*(1-t)+cb[3]*t
        rgb = [round((ca[k]*ca[3]*(1-t)+cb[k]*cb[3]*t)/alpha) if alpha else 0 for k in range(3)]
        colors.append(tuple(rgb+[round(alpha*255)]))
    pixels = []
    for y in range(size):
        for x in range(size):
            angle = (math.degrees(math.atan2(x+.5-size/2, -(y+.5-size/2)))-start) % 360
            pixels.append(colors[min(4095, int(angle*4096/360))])
    im = Image.new('RGBA', (size, size))
    im.putdata(pixels)
    out = io.BytesIO()
    im.save(out, format='PNG', optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(out.getvalue()).decode('ascii')


def prepare(source):
    root = ET.fromstring(source)
    foreign = list(root.iter(tag('foreignObject')))
    if not foreign:
        return source, {"nativeBlurs": 0, "conicPaints": 0}
    defs = ET.SubElement(root, tag('defs'))
    stats = {"nativeBlurs": 0, "conicPaints": 0}
    paints = {}
    for i, node in enumerate(foreign):
        parents = {child: parent for parent in root.iter() for child in parent}
        parent = parents[node]
        style = next(iter(node)).get('style', '')
        prefix = f'id_webgl_{i}'
        if 'conic-gradient' in style:
            if style not in paints:
                paints[style] = conic_image(style)
            replacement = ET.Element(tag('image'), dict(node.attrib))
            replacement.set('preserveAspectRatio', 'none')
            replacement.set(f'{{{XLINK}}}href', paints[style])
            stats['conicPaints'] += 1
        elif 'backdrop-filter' in style:
            sigma = float(re.search(r'backdrop-filter:blur\(([\d.]+)px\)', style)[1])
            if not sigma:
                parent.remove(node)
                continue
            # All supplied backdrop nodes use page coordinates within clip groups.
            # Snapshot preceding painted siblings as reusable groups, preserving z-order.
            chain = []
            child = node
            while child is not root:
                ancestor = parents[child]
                if ancestor.get('transform'):
                    raise ValueError('Transformed backdrop requires coordinate conversion')
                chain.append((ancestor, child))
                child = ancestor
            refs = []
            for level, (ancestor, child) in enumerate(reversed(chain)):
                siblings = [s for s in list(ancestor)[:list(ancestor).index(child)] if s.tag != tag('defs')]
                if not siblings:
                    continue
                group = ET.Element(tag('g'), {'id': f'{prefix}_backdrop_{level}'})
                index = list(ancestor).index(siblings[0])
                for sibling in siblings:
                    ancestor.remove(sibling)
                    group.append(sibling)
                ancestor.insert(index, group)
                refs.append(group.get('id'))
            clip_id = re.search(r'clip-path:url\(#([^)]+)\)', style)[1]
            original_clip = next(e for e in root.iter(tag('clipPath')) if e.get('id') == clip_id)
            clip = copy.deepcopy(original_clip)
            clip.set('id', prefix+'_clip')
            # Figma's HTML clip origin is local to foreignObject; SVG paths are global.
            transform = clip.attrib.pop('transform', '')
            xy = list(map(float, re.findall(r'-?\d+(?:\.\d+)?', transform)))
            if len(xy) != 2 or any(abs(xy[k]+float(node.get(('x','y')[k], '0'))) > .01 for k in range(2)):
                raise ValueError('Unexpected Figma backdrop clip transform')
            defs.append(clip)
            filt = ET.SubElement(defs, tag('filter'), {'id': prefix+'_blur', 'filterUnits': 'userSpaceOnUse',
                'x': '-100', 'y': '-100', 'width': '560', 'height': '1000', 'color-interpolation-filters': 'sRGB'})
            ET.SubElement(filt, tag('feGaussianBlur'), {'stdDeviation': str(sigma)})
            replacement = ET.Element(tag('g'), {'clip-path': f'url(#{prefix}_clip)'})
            blurred = ET.SubElement(replacement, tag('g'), {'filter': f'url(#{prefix}_blur)'})
            for ref in refs:
                ET.SubElement(blurred, tag('use'), {f'{{{XLINK}}}href': '#'+ref})
            stats['nativeBlurs'] += 1
        else:
            raise ValueError('Unknown foreignObject; refuse silent visual degradation')
        index = list(parent).index(node)
        parent.remove(node)
        parent.insert(index, replacement)
    return ET.tostring(root, encoding='utf-8'), stats


def main():
    registry = json.loads((ASSETS/'sources.json').read_text(encoding='utf-8-sig'))
    for record in registry:
        source = (ROOT/record['source']/'screen.svg').read_bytes()
        result, stats = prepare(source)
        (ASSETS/record['file']).write_bytes(result)
        record.update(format='svg', sourceSha256=hashlib.sha256(source).hexdigest(),
                      sha256=hashlib.sha256(result).hexdigest(), preparation=stats)
        print(record['file'], stats, len(result))
    (ASSETS/'sources.json').write_text(json.dumps(registry, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
