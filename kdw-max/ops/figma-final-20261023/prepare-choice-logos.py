"""Export original emblem nodes, preserving vectors and embedded source pixels."""
import copy,hashlib,json,pathlib,re,xml.etree.ElementTree as E
root=pathlib.Path(__file__).resolve().parents[2]
src=root/'apps/max-game/source/client';out=src/'public/assets/kdw-native/business-ui'
ns='http://www.w3.org/2000/svg';E.register_namespace('',ns);E.register_namespace('xlink','http://www.w3.org/1999/xlink')
registry=json.loads((src/'src/kdw-business-ui-assets.json').read_text(encoding='utf-8'))
origins=[]
for business,group in [('cafe','coffe'),('flowers','flower'),('auto','auto')]:
 p=next((root/('docs/review-business-screens-20261022/unpacked/'+group+'-screens')).glob('*17*.svg'))
 tree=E.fromstring(p.read_bytes());ids={n.attrib['id']:n for n in tree.iter() if 'id' in n.attrib}
 svg=E.Element('{'+ns+'}svg',{'width':'140','height':'140','viewBox':'45.6719 56.7207 39.2495 39.2495','fill':'none'})
 if business!='auto':
  node=next(n for n in tree.iter() if n.tag.endswith('}g') and n.attrib.get('clip-path','').startswith('url(#clip32_'))
  svg.append(copy.deepcopy(node))
 else:
  # Original 216px emblem has transparency; export it directly, without the phone background.
  svg.set('viewBox','1 1 214 214')
  original=next(n for n in tree.iter() if n.tag.endswith('}image') and n.attrib.get('id','').startswith('image1_'))
  node=copy.deepcopy(original);node.attrib.pop('id');svg.append(node)
 defs=E.SubElement(svg,'{'+ns+'}defs');seen=set()
 while True:
  text=E.tostring(svg,encoding='unicode');refs=set(re.findall(r'url\(#([^)]*)\)',text)+re.findall(r'href="#([^"]+)"',text))-seen
  if not refs:break
  for ref in sorted(refs):defs.append(copy.deepcopy(ids[ref]));seen.add(ref)
 name='choice-'+business+'.svg';data=E.tostring(svg,encoding='utf-8');(out/name).write_bytes(data)
 aid='kdw.business-ui.choice-'+business
 registry[aid]={'assetId':aid,'path':'assets/kdw-native/business-ui/'+name,'width':140,'height':140,'mimeType':'image/svg+xml','sha256':hashlib.sha256(data).hexdigest()}
 origins.append({'business':business,'source':p.relative_to(root).as_posix(),'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'output':name})
choice=b'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800"></svg>'
(out/'choice.svg').write_bytes(choice);registry['kdw.business-ui.choice']['sha256']=hashlib.sha256(choice).hexdigest()
(src/'src/kdw-business-ui-assets.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(out/'choice-provenance.json').write_text(json.dumps(origins,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'logos':len(origins),'transparentCanvas':True}))
