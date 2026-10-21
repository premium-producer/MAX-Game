"""Extract immutable comments reply surfaces from reviewed SVG. UI originals stay read-only."""
from pathlib import Path
import xml.etree.ElementTree as E
import re,json,hashlib,copy,base64
root=Path(__file__).resolve().parents[3]
source=root/'UI/new_screens/personal_channel/svg/screen_14.svg'
out=root/'apps/max-game/source/client/public/assets/kdw-native/personal-channel/reply'
out.mkdir(parents=True,exist_ok=True)
E.register_namespace('', 'http://www.w3.org/2000/svg')
ns='{http://www.w3.org/2000/svg}'
r=E.parse(source).getroot(); main=r[0]; chat=next(e for e in main if e.get('clip-path')=='url(#clip2_4198_69704)')
ids={e.get('id'):e for e in r.iter() if e.get('id')}
assets={}
def svg(name,box,nodes):
 s=E.Element(ns+'svg',{'width':str(box[2]),'height':str(box[3]),'viewBox':' '.join(map(str,box))})
 defs=E.SubElement(s,ns+'defs');seen=set()
 def deps(e):
  for ref in re.findall(r'(?:url\(#|(?:href=")[#])([^\)" ]+)',E.tostring(e,encoding='unicode')):
   if ref in seen:continue
   seen.add(ref)
   if ref in ids:defs.append(copy.deepcopy(ids[ref]));deps(ids[ref])
 for n in nodes:s.append(copy.deepcopy(n));deps(n)
 b=E.tostring(s,encoding='utf-8');(out/(name+'.svg')).write_bytes(b)
 assets[name]={'path':'assets/kdw-native/personal-channel/reply/'+name+'.svg','mimeType':'image/svg+xml','width':box[2],'height':box[3],'sha256':hashlib.sha256(b).hexdigest()}
 return s
surface=next(e for e in chat if e.get('clip-path')=='url(#clip12_4198_69704)')
skin=copy.deepcopy(ids['mask1_4198_69704'][0]);skin.set('fill','#E9FDFF')
svg('skin',[63,606,291,114],[skin])
children=list(chat);start=children.index(surface)
svg('meta',[297,703,48,10],children[start+1:start+4])
svg('quote',[73,614,200,32],children[start+5:start+8])
# The source PNG remains exact outside the scrolling conversation region.
image=E.Element(ns+'image',{'width':'360','height':'800','href':'data:image/png;base64,'+base64.b64encode((root/'UI/new_screens/personal_channel/png/screen_14.png').read_bytes()).decode()})
wall=E.Element(ns+'svg',{'x':'0','y':'164','width':'360','height':'564','viewBox':'0 164 360 564'});wall.append(copy.deepcopy(main[1]))
svg('background',[0,0,360,800],[image,wall])
svg('wallpaper',[0,164,360,564],[main[1]])
manifest={'source':'UI/new_screens/personal_channel/svg/screen_14.svg','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'parts':assets}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'parts':len(assets),'sourceSha256':manifest['sourceSha256']}))
