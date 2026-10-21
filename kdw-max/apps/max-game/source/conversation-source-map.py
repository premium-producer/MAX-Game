"""Read provided SVGs; extract only foreground controls and photo-mask geometry."""
import json, sys
from pathlib import Path
from xml.etree import ElementTree as ET
ET.register_namespace('', 'http://www.w3.org/2000/svg')
folder = Path(sys.argv[1])
ns = '{http://www.w3.org/2000/svg}'
def serialize(node):
    return ET.tostring(node, encoding='unicode')
screens = []
for number in range(1, 8):
    tree = ET.parse(folder / f'screen_{number}.svg').getroot()
    parents = {child: parent for parent in tree.iter() for child in parent}
    pattern = {1: 1, 2: 1, 3: 3, 4: 3, 5: 2, 6: 11, 7: 1}[number]
    photo = next(n for n in tree.iter() if n.get('fill', '').startswith(f'url(#pattern{pattern}_'))
    parent = parents[photo]
    overlays, extra_defs = [], []
    if number in (1, 2, 5):
        overlays = list(parent)[list(parent).index(photo) + 1:]
    if number in (3, 4):
        overlays = [list(parent)[list(parent).index(photo) + 1]]
        ref = overlays[0].get('filter')[5:-1]
        extra_defs = [next(n for n in tree.iter() if n.get('id') == ref)]
    shape = (
        '<rect x="212" y="460" width="132" height="200" rx="20"/>' if number == 1 else
        '<rect x="212" y="424" width="132" height="200" rx="20"/>' if number == 2 else
        '<circle cx="180" cy="352" r="164"/>' if number in (3, 4) else
        '<circle cx="240" cy="588" r="114"/>' if number == 5 else
        '<circle cx="39" cy="147" r="26"/>' if number == 6 else
        '<circle cx="32" cy="96" r="20"/>'
    )
    occlusion = ''
    if number == 6:
        # The plus button cuts into the avatar; retain its original exclusion.
        mask = next(n for n in tree.iter() if n.get('id', '').startswith('mask7_'))
        occlusion = serialize(mask[0])
    bounds = {1:[212,460,132,200],2:[212,424,132,200],3:[16,188,328,328],4:[16,188,328,328],5:[126,474,228,228],6:[13,121,52,52],7:[12,76,40,40]}[number]
    screens.append(dict(number=number,width=360,height=int(tree.get('height')),bounds=bounds,shape=shape,occlusion=occlusion,overlays=''.join(map(serialize,overlays)),defs=''.join(map(serialize,extra_defs))))
tree = ET.parse(folder / 'screen_1.svg').getroot()
image = next(n for n in tree.iter() if n.get('id', '').startswith('image1_'))
uri = image.get('{http://www.w3.org/1999/xlink}href')
print(json.dumps(dict(screens=screens,portrait=uri,portraitImageId=image.get('id')), ensure_ascii=False))
