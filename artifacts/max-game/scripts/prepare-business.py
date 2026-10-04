"""Reproduce the complete public MAX business landing using archived sources."""
from pathlib import Path
import hashlib
import json
import re
import shutil

project = Path(__file__).resolve().parents[3]
sources = project / 'docs/Research/max-business-site-20261001/sources'
target = project / 'artifacts/max-game/public/business'
target.mkdir(parents=True, exist_ok=True)
manifest = json.loads((sources / 'asset-manifest.json').read_text(encoding='utf-8'))
assert not manifest['errors']
for asset in manifest['assets']:
    source = sources / asset['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == asset['sha256']
    local = asset['file'].removeprefix('assets/')
    dest = target / local
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, dest)

styles = {'style-base.css': 'base.css', 'style-page.css': 'page.css'}
(target / 'styles').mkdir(exist_ok=True)
for source, local in styles.items():
    css = (sources / source).read_text(encoding='utf-8').replace('url(/fonts/', 'url(../fonts/')
    (target / 'styles' / local).write_text(css, encoding='utf-8')

html = (sources / 'business.html').read_text(encoding='utf-8')
html = re.sub(r'<script\b[^>]*>[\s\S]*?</script\s*>', '', html, flags=re.I)
html = re.sub(r'<noscript\b[^>]*>[\s\S]*?</noscript\s*>', '', html, flags=re.I)
html = re.sub(r'<link\b[^>]*>', '', html, flags=re.I)
html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
# WebP and PNG provide all authored resolutions without changing server MIME rules.
html = re.sub(r'<source\b[^>]*type="image/avif"[^>]*>', '', html, flags=re.I)
html = html.replace('/static/image/', './static/image/')
html = re.sub(r'href="(/(?:self|static/docs)[^"]*)"', r'href="https://business.max.ru\1"', html)
html = html.replace('МАКС ©', 'MAX ©')
html = re.sub(r'<title>[^<]*</title>', '<title>MAX для бизнеса — локальная копия</title>', html)
head = ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
        'img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; '
        'script-src \'self\'; connect-src \'none\'; object-src \'none\'; base-uri \'self\'">'
        '<link rel="icon" href="./static/image/favicon.svg">'
        '<link rel="preload" href="./fonts/Max_Sans_Regular.woff2" as="font" type="font/woff2" crossorigin>'
        '<link rel="preload" href="./fonts/Max_Sans_Medium.woff2" as="font" type="font/woff2" crossorigin>'
        '<link rel="stylesheet" href="./styles/base.css">'
        '<link rel="stylesheet" href="./styles/page.css">'
        '<link rel="stylesheet" href="./local.css">')
html = html.replace('</head>', head + '</head>')
html = html.replace('</body>', '<script type="module" src="./local.mjs"></script></body>')
assert 'mc.yandex.ru' not in html and '__next_f' not in html and '/_next/' not in html
(target / 'index.html').write_text(html, encoding='utf-8')
provenance = {'sourceUrl': 'https://business.max.ru/', 'capturedAt': '2026-10-01',
              'scope': 'Complete public business landing; account platform and linked documentation remain external',
              'changes': ['Local render assets and original styles', 'Next hydration and analytics replaced by local UI module',
                          'Original PNG/WebP with srcset retained; AVIF source omitted for existing local server MIME',
                          'MAX spelling normalized in visible footer; original HTML archived unchanged'], 'files': {}}
for file in sorted(target.rglob('*')):
    if file.is_file() and file.name != 'source.json':
        provenance['files'][file.relative_to(target).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
(target / 'source.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared business landing: {len(provenance["files"])} local files')
