"""Prepare the full public Digital ID page and its hidden FAQ/QR content."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import shutil

project = Path(__file__).resolve().parents[3]
sources = project / 'docs/Research/max-digital-id-site-20261001/sources'
target = project / 'artifacts/max-game/public/digital-id'
target.mkdir(parents=True, exist_ok=True)
manifest = json.loads((sources / 'asset-manifest.json').read_text(encoding='utf-8'))
assert all(e['address'] == 'https://go.max.ru/s/img/digitalId-page-create.png' for e in manifest['errors'])
assert (sources / 'create-poster-from-video.png').is_file()
for asset in manifest['assets']:
    source = sources / asset['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == asset['sha256']
    local = asset['file'].removeprefix('assets/')
    if local.endswith('.css'):
        dest = target / 'styles' / Path(local).name
        css = source.read_text(encoding='utf-8').replace('../../../s/fonts/', '../s/fonts/')
        css = re.sub(r',url\([^)]*\.woff\) format\("woff"\)', '', css)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(css, encoding='utf-8')
    else:
        dest = target / local
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, dest)
shutil.copyfile(sources / 'create-poster-from-video.png', target / 's/img/digitalId-page-create.png')
shutil.copyfile(sources / 'digital-id-qr.svg', target / 's/img/digital-id-qr.svg')
(target / 'faq.json').write_bytes((sources / 'faq-source.json').read_bytes())

html = (sources / 'digital-id.html').read_text(encoding='utf-8')
styles = []
class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'stylesheet':
            styles.append(Path(a['href']).name)
Links().feed(html)
html = re.sub(r'<script\b[^>]*>[\s\S]*?</script\s*>', '', html, flags=re.I)
html = re.sub(r'<noscript\b[^>]*>[\s\S]*?</noscript\s*>', '', html, flags=re.I)
html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
html = re.sub(r'<link\b[^>]*>', '', html, flags=re.I)
html = re.sub(r'<meta\b[^>]*name="yandex-verification"[^>]*>', '', html, flags=re.I)
html = html.replace('/s/img/', './s/img/').replace('/s/video/', './s/video/')
html = re.sub(r'(<video\b[^>]*?)\s+src=""', r'\1', html)
html = re.sub(r'<title>[^<]*</title>', '<title>Цифровой ID MAX — локальная копия</title>', html)
head = ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
        'img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; '
        'script-src \'self\'; connect-src \'self\'; media-src \'self\'; object-src \'none\'; base-uri \'self\'">'
        '<link rel="icon" href="./favicon.svg">'
        '<link rel="preload" href="./s/fonts/max-sans/MaxSans-Regular.woff2" as="font" type="font/woff2" crossorigin>'
        '<link rel="preload" href="./s/fonts/max-sans/MaxSans-Medium.woff2" as="font" type="font/woff2" crossorigin>')
head += ''.join(f'<link rel="stylesheet" href="./styles/{name}">' for name in styles)
html = html.replace('</head>', head + '<link rel="stylesheet" href="./local.css"></head>')
modal = (sources / 'modal-source.html').read_text(encoding='utf-8').strip()
modal = modal.replace('./images/digital-id-qr.svg', './s/img/digital-id-qr.svg')
modal = modal.replace('class="digitalIdModal svelte-tosp5t"', 'class="digitalIdModal svelte-tosp5t" hidden')
html = html.replace('</body>', modal + '<script type="module" src="./local.mjs"></script></body>')
assert 'mc.yandex.ru' not in html and '/_app/' not in html
(target / 'index.html').write_text(html, encoding='utf-8')
provenance = {'sourceUrl': 'https://go.max.ru/digitalId', 'capturedAt': '2026-10-01',
              'scope': 'Complete public page including FAQ and original QR modal; external MAX application remains external',
              'changes': ['Local resources and interaction module, no Svelte hydration or analytics',
                          'Missing original creation poster HTTP404 replaced by first frame from original creation MP4',
                          'Original src-empty video represented by its original static poster'], 'files': {}}
for file in sorted(target.rglob('*')):
    if file.is_file() and file.name != 'source.json':
        provenance['files'][file.relative_to(target).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
(target / 'source.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared Digital ID page: {len(provenance["files"])} local files')
