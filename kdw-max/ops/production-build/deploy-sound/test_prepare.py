import importlib.util,pathlib,uuid,json,hashlib,unittest,zipfile
here=pathlib.Path(__file__).parent;s=importlib.util.spec_from_file_location('prepare_patch',here/'prepare-patch.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class PrepareTest(unittest.TestCase):
 def test_native_dependencies_are_automatic_pinned_and_incremental(self):
  root=(pathlib.Path('.cache/patch-prepare-tests')/uuid.uuid4().hex).resolve();root.mkdir(parents=True)
  prefix='apps/max-game/www/';asset='assets/kdw-native/conversation/hq-call.svg';body='<svg/>'
  sha=lambda v:hashlib.sha256(v.encode()).hexdigest()
  manifest={'bundleSha256':sha('js'),'cssSha256':sha('css'),'requiredAssets':{asset:sha(body)}}
  contents={'webgl-v5/app.js':'js','webgl-v5/kdw-interactions.css':'css','webgl-v5/build.json':json.dumps({'files':{'app.js':sha('js'),'kdw-interactions.css':sha('css')}}),'webgl-v5/r9-build.json':json.dumps(manifest),asset:body}
  for name,value in contents.items():
   p=root/(prefix+name);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(value,encoding='utf-8')
  spec={'id':'TEST-HQ-DEPS','release':'C:/KDW-Stand/releases/RC4-1','base':'base','files':[prefix+n for n in contents if n.startswith('webgl-v5/')]}
  self.assertEqual(m.prepare(root,spec,root/'first')['files'],5)
  with zipfile.ZipFile(root/'first/patch.zip') as z:self.assertIn('payload/'+prefix+asset,z.namelist())
  base=root/'base'/prefix/asset;base.parent.mkdir(parents=True);base.write_text(body)
  self.assertEqual(m.prepare(root,spec,root/'incremental')['files'],4)
  (root/(prefix+asset)).write_text('broken')
  with self.assertRaisesRegex(ValueError,'Missing or changed required MAX asset'):m.prepare(root,spec,root/'bad')
  (root/(prefix+asset)).unlink()
  with self.assertRaisesRegex(ValueError,'Missing or changed required MAX asset'):m.prepare(root,spec,root/'missing')
  manifest['requiredAssets']={'assets/kdw-native/../private.svg':sha(body)}
  (root/(prefix+'webgl-v5/r9-build.json')).write_text(json.dumps(manifest))
  with self.assertRaisesRegex(ValueError,'Invalid MAX asset path'):m.prepare(root,spec,root/'traversal')
 def test_max_bundle_requires_matching_css_and_manifests(self):
  root=(pathlib.Path('.cache/patch-prepare-tests')/uuid.uuid4().hex).resolve();root.mkdir(parents=True)
  prefix='apps/max-game/www/webgl-v5/'
  sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
  for folder in ('base/',''):
   for name,body in {'app.js':'new-js' if not folder else 'old-js','kdw-interactions.css':'new-css' if not folder else 'old-css','build.json':json.dumps({'files':{'app.js':sha('new-js'),'kdw-interactions.css':sha('new-css')}}),'r9-build.json':json.dumps({'bundleSha256':sha('new-js'),'cssSha256':sha('new-css')})}.items():
    p=root/(folder+prefix+name);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body,encoding='utf-8')
  spec={'id':'TEST-MAX-ASSETS','release':'C:/KDW-Stand/releases/RC4-1','base':'base','files':[prefix+n for n in ('app.js','build.json','r9-build.json')]}
  with self.assertRaisesRegex(ValueError,'Incomplete MAX asset set.*kdw-interactions.css'):m.prepare(root,spec,root/'missing-css')
  self.assertFalse((root/'missing-css').exists())
  spec['files'].append(prefix+'kdw-interactions.css')
  self.assertEqual(m.prepare(root,spec,root/'complete')['files'],2)
  # A matching stylesheet already installed by a previous patch needs no upload.
  previous={'release':spec['release'],'files':[{'path':prefix+'kdw-interactions.css','before':sha('old-css'),'sha256':sha('new-css')}]}
  (root/'previous.json').write_text(json.dumps(previous),encoding='utf-8');spec['previousPlans']=['previous.json'];spec['files'].remove(prefix+'kdw-interactions.css')
  self.assertEqual(m.prepare(root,spec,root/'already-installed')['files'],1)
 def test_chain_filters_unchanged_and_targets_one_app(self):
  cache=pathlib.Path('.cache/patch-prepare-tests');cache.mkdir(parents=True,exist_ok=True)
  root=(cache/uuid.uuid4().hex).resolve();root.mkdir();relative='apps/max-game/www/admin/index.html';old=root/'base'/relative;old.parent.mkdir(parents=True);old.write_text('original');current=root/relative;current.parent.mkdir(parents=True);current.write_text('installed')
  hash=lambda text:hashlib.sha256(text.encode()).hexdigest()
  previous={'release':'C:/KDW-Stand/releases/RC4-1','files':[{'path':relative,'before':hash('original'),'sha256':hash('installed')}]};(root/'previous.json').write_text(json.dumps(previous))
  spec={'id':'TEST-PATCH-2','release':previous['release'],'base':'base','previousPlans':['previous.json'],'files':[relative]}
  with self.assertRaisesRegex(ValueError,'No changes'):m.prepare(root,spec,root/'unchanged')
  current.write_text('new');result=m.prepare(root,spec,root/'package');plan=json.loads((root/'package/plan.json').read_text());self.assertTrue(plan['interruptVisitors']);self.assertEqual(plan['applications'],['max-game']);self.assertEqual(plan['files'][0]['before'],hash('installed'));self.assertEqual(result['files'],1)
  with zipfile.ZipFile(root/'package/patch.zip') as z:self.assertEqual(set(z.namelist()),{'plan.json','install.ps1','payload/'+relative})
  with self.assertRaisesRegex(ValueError,'already exists'):m.prepare(root,spec,root/'package')
  spec['files']=['apps/max-game/data/secret.json']
  with self.assertRaisesRegex(ValueError,'Only application'):m.prepare(root,spec,root/'forbidden')
 def test_only_named_stella_launchers_are_allowed_at_app_root(self):
  root=(pathlib.Path('.cache/patch-prepare-tests')/uuid.uuid4().hex).resolve();root.mkdir(parents=True)
  files=['apps/stela/Start-Recorded.bat','apps/stela/Start-Generated.bat','apps/stela/Start-Touch-Recorded.bat','apps/stela/Start-Touch-Only-Recorded.bat','apps/stela/Start-Display-Only.bat']
  for name in files:
   p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('@echo off')
  spec={'id':'TEST-VOICE-MODE','release':'C:/KDW-Stand/releases/RC4-1','base':'base','files':files}
  self.assertEqual(m.prepare(root,spec,root/'allowed')['files'],len(files))
  for i,name in enumerate(['apps/stela/Unknown.bat','apps/max-game/Start-Recorded.bat','apps/stela/data/narration-mode.local.json','apps/stela/launcher/../../secret']):
   spec['files']=[name]
   with self.assertRaisesRegex(ValueError,'Only application'):m.prepare(root,spec,root/('denied'+str(i)))
if __name__=='__main__':unittest.main()
