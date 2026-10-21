"""Extract authored MAX chrome, keeping only referenced SVG definitions."""
import copy, hashlib, json, pathlib, re, xml.etree.ElementTree as E
source = pathlib.Path(__file__).resolve().parent
original = source.parents[2] / 'UI/new_screens/busines_game_screen/channel.svg'
E.register_namespace('', 'http://www.w3.org/2000/svg')
E.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
root = E.parse(original).getroot()
ns = '{http://www.w3.org/2000/svg}'
screen = root[2]
definitions = {e.get('id'): e for e in root.iter() if e.get('id')}
output = source / 'client/public/assets/kdw-native/posts-chrome'
output.mkdir(parents=True, exist_ok=True)
assets = {}
def save(name, bounds, nodes, width=None, height=None):
    x,y,w,h = bounds
    width,height = round(width or w),round(height or h)
    svg = E.Element(ns+'svg', {'viewBox':f'{x} {y} {w} {h}', 'width':str(width),'height':str(height),'fill':'none'})
    defs = E.SubElement(svg,ns+'defs')
    for n in nodes: svg.append(copy.deepcopy(n))
    used = set()
    while True:
        text = E.tostring(svg,encoding='unicode')
        refs = set(re.findall(r'url\(#([^)]*)\)',text)) | set(re.findall(r'href="#([^"]+)"',text))
        new = refs-used
        if not new: break
        for key in sorted(new): defs.append(copy.deepcopy(definitions[key]))
        used |= new
    data = E.tostring(svg,encoding='utf-8')
    (output/(name+'.svg')).write_bytes(data)
    aid='kdw.posts.'+name
    assets[aid]={'assetId':aid,'path':'assets/kdw-native/posts-chrome/'+name+'.svg','width':width,'height':height,'mimeType':'image/svg+xml','sha256':hashlib.sha256(data).hexdigest()}
# The business avatar is a live field. Do not leave the original cafe avatar
# underneath it; retain every other immutable header element verbatim.
save('header',(324.363,143.371,264.643,82.3332),[screen[i] for i in [2,3,4,5,6,7,10,11,12]],390,390*82.3332/264.643)
save('composer',(324.363,678.535,264.643,52.9285),list(screen[14][0]),390,390*52.9285/264.643)
save('fire',(342.006,402.332,17.6428,17.6428),[screen[13][7]])
save('heart',(399.762,402.332,17.6428,17.6428),[screen[13][10]])
save('views',(478.936,415.444,12,12),[screen[13][2]])
badge=next(e for e in screen[9].iter() if e.get('clip-path')=='url(#clip21_2032_16594)')
save('verified',(450.613,189.892,11.7619,11.7619),[badge])
save('phone',(0,0,390,390*580.938/264.643),[E.Element(ns+'rect',{'width':'390','height':str(390*580.938/264.643),'fill':'#17181C'})])
(source/'client/src/kdw-posts-chrome.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(output/'source.json').write_text(json.dumps({'source':'UI/new_screens/busines_game_screen/channel.svg','sha256':hashlib.sha256(original.read_bytes()).hexdigest()},indent=2)+'\n')
print('Extracted',len(assets),'MAX channel assets')
