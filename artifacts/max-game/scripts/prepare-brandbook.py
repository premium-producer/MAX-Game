"""Prepare the complete official brandbook page from the preserved public sources."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

project = Path(__file__).resolve().parents[3]
sources = project / 'docs/Research/max-brandbook-site-20261001/sources'
target = project / 'artifacts/max-game/public/brandbook'
for name in ('styles', 'fonts', 'images', 'downloads'):
    (target / name).mkdir(parents=True, exist_ok=True)

style_names = {'site-base.css': 'base.css', 'footer.css': 'footer.css',
               'header.css': 'main.css', 'button.css': 'button.css',
               'brandbook-page.css': 'page.css'}
for original, local in style_names.items():
    css = (sources / original).read_text(encoding='utf-8')
    css = css.replace('../../../s/fonts/max-sans/', '../fonts/')
    # WOFF2 is supported by the local browser; avoid unsupported server MIME for WOFF.
    css = re.sub(r',url\([^)]*\.woff\) format\("woff"\)', '', css)
    (target / 'styles' / local).write_text(css, encoding='utf-8')
for weight in ('Light', 'Regular', 'Medium', 'DemiBold', 'Bold'):
    shutil.copyfile(sources / f'MaxSans-{weight}.woff2', target / 'fonts' / f'MaxSans-{weight}.woff2')
for name in ('brandbook-map.png', 'brandbook-contacts.png', 'icons-widgets.png',
             'light-gradient.png', 'dark-gradient.png', 'favicon.svg'):
    shutil.copyfile(sources / name, target / 'images' / name)

archive = sources / 'all-max-logo.zip'
shutil.copyfile(archive, target / 'downloads/all-max-logo.bin')
variant_names = {'Max full colored w': 'max-full-colored-w', 'Max full colored d': 'max-full-colored-d',
                 'Max full white': 'max-full-white', 'Max full dark': 'max-full-dark',
                 'Max colored': 'max-colored', 'Max white': 'max-white', 'Max dark': 'max-dark'}
with zipfile.ZipFile(archive) as original:
    assert original.testzip() is None
    for stem, local in variant_names.items():
        with zipfile.ZipFile(target / 'downloads' / f'{local}.bin', 'w', zipfile.ZIP_DEFLATED) as out:
            for suffix in ('svg', 'png', 'pdf'):
                name = f'{stem}.{suffix}'
                out.writestr(name, original.read(f'all-max-logo/{name}'))

html = (sources / 'brandbook.html').read_text(encoding='utf-8')
# The visible original markup is kept. Replace platform hydration and analytics
# with a local interaction layer; do not clone the marketing site's application.
html = re.sub(r'<script\b[^>]*>[\s\S]*?</script\s*>', '', html, flags=re.I)
html = re.sub(r'<noscript\b[^>]*>[\s\S]*?</noscript\s*>', '', html, flags=re.I)
html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
html = re.sub(r'<link\b[^>]*>', '', html, flags=re.I)
html = re.sub(r'<meta\b[^>]*(?:name="yandex-verification")[^>]*>', '', html, flags=re.I)
html = html.replace('/s/img/', './images/')
for local in ['all-max-logo', *variant_names.values()]:
    html = html.replace(f'href="https://st.max.ru/brandbook/{local}.zip"',
                        f'href="./downloads/{local}.bin" download="{local}.zip"')
html = html.replace('href="https://go.max.ru/brandbook"', 'href="./index.html"')
html = html.replace('<title>Брендбук MAX</title>', '<title>Брендбук MAX — локальная копия</title>')
links = '\n'.join(f'<link rel="stylesheet" href="./styles/{name}">' for name in style_names.values())
head = ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
        'img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; '
        'font-src \'self\'; script-src \'self\'; connect-src \'none\'; object-src \'none\'; base-uri \'self\'">'
        '<link rel="icon" href="./images/favicon.svg">'
        '<link rel="preload" href="./fonts/MaxSans-Regular.woff2" as="font" type="font/woff2" crossorigin>'
        '<link rel="preload" href="./fonts/MaxSans-Medium.woff2" as="font" type="font/woff2" crossorigin>'
        + links + '<link rel="stylesheet" href="./local.css">')
html = html.replace('</head>', head + '</head>')
html = html.replace('</body>', '<script type="module" src="./local.mjs"></script></body>')
assert 'mc.yandex.ru' not in html and 'top-fwz1.mail.ru' not in html
assert 'modulepreload' not in html and '/_app/' not in html
(target / 'index.html').write_text(html, encoding='utf-8')
manifest = {'sourceUrl': 'https://go.max.ru/brandbook', 'capturedAt': '2026-10-01',
            'scope': 'Complete brandbook page, not the other linked MAX websites or Figma',
            'changes': ['Local URLs for render dependencies and logo archives',
                        'Original Svelte hydration/analytics replaced by local interaction module',
                        'Reduced motion and accessible mobile menu handled locally'], 'files': {}}
for file in sorted(target.rglob('*')):
    if file.is_file() and file.name != 'source.json':
        manifest['files'][file.relative_to(target).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
(target / 'source.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared brandbook page: {len(manifest["files"])} local files')
