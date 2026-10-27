import importlib.util,pathlib,uuid,json,hashlib,unittest,zipfile
here=pathlib.Path(__file__).parent;s=importlib.util.spec_from_file_location('prepare_patch',here/'prepare-patch.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class PrepareTest(unittest.TestCase):
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
 def test_only_two_named_stella_launchers_are_allowed_at_app_root(self):
  root=(pathlib.Path('.cache/patch-prepare-tests')/uuid.uuid4().hex).resolve();root.mkdir(parents=True)
  files=['apps/stela/Start-Recorded.bat','apps/stela/Start-Generated.bat']
  for name in files:
   p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('@echo off')
  spec={'id':'TEST-VOICE-MODE','release':'C:/KDW-Stand/releases/RC4-1','base':'base','files':files}
  self.assertEqual(m.prepare(root,spec,root/'allowed')['files'],2)
  for i,name in enumerate(['apps/stela/Unknown.bat','apps/max-game/Start-Recorded.bat','apps/stela/data/narration-mode.local.json','apps/stela/launcher/../../secret']):
   spec['files']=[name]
   with self.assertRaisesRegex(ValueError,'Only application'):m.prepare(root,spec,root/('denied'+str(i)))
if __name__=='__main__':unittest.main()
