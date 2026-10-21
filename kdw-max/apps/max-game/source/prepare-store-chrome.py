"""Extract the supplied MAX mini-app header without its outlined shop title."""
import copy, hashlib, json, pathlib, re, xml.etree.ElementTree as E
source=pathlib.Path(__file__).resolve().parent
original=source.parents[2]/'UI/new_screens/busines_game_screen/телефон.svg'
E.register_namespace('', 'http://www.w3.org/2000/svg')
ns='{http://www.w3.org/2000/svg}'
root=E.parse(original).getroot()
header=root[1][1]
svg=E.Element(ns+'svg',{'viewBox':'303.535 135.028 248.736 89.3664','width':'390','height':'140','fill':'none'})
for i,node in enumerate(header):
    if i!=15: svg.append(copy.deepcopy(node))
defs=E.SubElement(svg,ns+'defs')
definitions={e.get('id'):e for e in root.iter() if e.get('id')}
used={e.get('id') for e in svg.iter() if e.get('id')}
while True:
    refs=set(re.findall(r'url\(#([^)]*)\)',E.tostring(svg,encoding='unicode')))-used
    if not refs: break
    for key in refs:defs.append(copy.deepcopy(definitions[key]))
    used|=refs
output=source/'client/public/assets/kdw-native'
assets={}
def save(name,filename,data,w,h):
    (output/filename).write_bytes(data)
    assets[name]={'assetId':name,'path':'assets/kdw-native/'+filename,'width':w,'height':h,'mimeType':'image/svg+xml','sha256':hashlib.sha256(data).hexdigest()}
save('kdw.native.store-header','store-header.svg',E.tostring(svg,encoding='utf-8'),390,140)
save('kdw.native.store-phone','store-phone.svg',b'<svg xmlns="http://www.w3.org/2000/svg" width="390" height="851" viewBox="0 0 390 851"><rect width="390" height="851" rx="35" fill="#000"/></svg>',390,851)
(source/'client/src/kdw-store-chrome.json').write_text(json.dumps(assets,indent=2)+'\n',encoding='utf-8')
(output/'store-chrome-source.json').write_text(json.dumps({'source':'UI/new_screens/busines_game_screen/телефон.svg','sha256':hashlib.sha256(original.read_bytes()).hexdigest(),'headerTitleExcluded':15},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Extracted MAX store header and screen proportions')
