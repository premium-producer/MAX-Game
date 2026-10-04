"""Build isolated public-site previews from archived, hash-verified sources."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from html.parser import HTMLParser
import hashlib
import json
import re

project = Path(__file__).resolve().parents[3]
origins = {'authors': 'https://go.max.ru/authors', 'career': 'https://team.vk.company/career-max/'}

for name, origin in origins.items():
    sources = project / f'docs/Research/max-{name}-site-20261001/sources'
    target = project / f'artifacts/max-game/public/{name}'
    target.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((sources / 'asset-manifest.json').read_text(encoding='utf-8'))
    assert not manifest['errors'], manifest['errors']
    mapping = {}
    for asset in manifest['assets']:
        local = asset['file'].removeprefix('assets/')
        if local.endswith(('.js', '.ico', '.woff')):
            continue
        mapping[asset['address']] = local
        mapping[urlsplit(asset['address']).path] = local
    def rewrite_url(value, base=origin):
        if value.startswith(('data:', '#')):
            return value
        absolute = urljoin(base, value)
        return './' + mapping[absolute] if absolute in mapping else absolute
    for asset in manifest['assets']:
        source = sources / asset['file']
        assert hashlib.sha256(source.read_bytes()).hexdigest() == asset['sha256']
        local = asset['file'].removeprefix('assets/')
        # Only reviewed animation libraries execute; original application bundles remain research inputs.
        if local.endswith('.js') and not (name == 'career' and '/libs/gsap/' in local):
            continue
        if local.endswith('.ico'):
            continue
        dest = target / local
        if local.endswith('.woff'):
            # Local server supports the original WOFF2 fonts; omit unused WOFF fallback.
            if dest.exists():
                assert hashlib.sha256(dest.read_bytes()).hexdigest() == asset['sha256']
                dest.unlink()
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if local.endswith('.css'):
            css = source.read_text(encoding='utf-8')
            css = re.sub(r',\s*url\([^)]*\.woff\)\s*format\([\'\"]woff[\'\"]\)', '', css)
            def css_url(match):
                value = match[2]
                if value.startswith(('data:', '#')):
                    return match[0]
                absolute = urljoin(asset['address'], value)
                assert absolute in mapping, absolute
                import os
                relative = os.path.relpath(target / mapping[absolute], dest.parent).replace('\\', '/')
                return f'url("{relative}")'
            css = re.sub(r'url\(\s*([\'\"]?)([^)\'\"]+)\1\s*\)', css_url, css)
            dest.write_text(css, encoding='utf-8')
        else:
            dest.write_bytes(source.read_bytes())
    html = (sources / 'page.html').read_text(encoding='utf-8')
    styles = []
    class Links(HTMLParser):
        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if tag == 'link' and attrs.get('rel') == 'stylesheet':
                styles.append(rewrite_url(attrs['href']))
    Links().feed(html)
    html = re.sub(r'<(?:script|noscript)\b[^>]*>[\s\S]*?</(?:script|noscript)\s*>', '', html, flags=re.I)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = re.sub(r'<link\b[^>]*>', '', html, flags=re.I)
    html = re.sub(r'\b(src|poster|href|action)="([^\"]*)"',
                  lambda m: f'{m[1]}="{rewrite_url(m[2])}"' if m[2] else m[0], html)
    html = re.sub(r'url\(\s*([\'\"]?)([^)\'\"]+)\1\s*\)',
                  lambda m: f'url({rewrite_url(m[2])})', html)
    html = html.replace('МАКС', 'MAX')
    html = re.sub(r'\s+on(?:click|submit|load)="[^\"]*"', '', html)
    if name == 'authors':
        node = (sources / 'assets/_app/immutable/nodes/14.BBKA1UV2.js').read_text(encoding='utf-8')
        templates = {m[1]: m[3].replace("\\'", "'") for m in
                     re.finditer(r'(\w+)=s\(([\'\"`])([\s\S]*?)\2(?:,1)?\)', node)}
        guide_names = ['Ve', 'Be', 'Ue']
        guides = []
        for key, kind in zip(guide_names, ['public', 'private', 'business']):
            markup = templates[key]
            if key != 'Ue':
                markup = markup.replace('<div>', '<div class="create-guide svelte-nllo4u">', 1)
            preview = (f'<div class="wrapper svelte-3mhi6p"><img src="./s/img/phone-body-2.png" '
                       f'alt="" class="phone svelte-3mhi6p"><video width="972" height="2160" '
                       f'src="./s/video/create-{kind}-channel.mp4" poster="./s/img/create-{kind}-channel-poster.png" '
                       'class="video svelte-3mhi6p" loop playsinline muted preload="metadata"></video></div>')
            if kind == 'business':
                markup = markup.replace('<!>', '<a class="button button--secondary svelte-aaums6" href="https://business.max.ru/">Открыть платформу</a>', 1)
            markup = markup.replace('<!>', preview, 1)
            guides.append(markup)
        faq_pairs = [('ot','ct'),('vt','dt'),('pt','bt'),('ut','_t'),('ht','mt'),('ft','gt'),('kt','xt'),
                     ('wt','Ct'),('qt','Pt'),('It','At'),('yt','Mt'),('St','Tt'),('Lt','zt')]
        data = {'guides': guides, 'faq': [[templates[a], templates[b]] for a,b in faq_pairs]}
        (sources / 'hidden-content.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        (target / 'content.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    else:
        html = html.replace('<body data-scroll-lock>', '<body>')
        # The public API determines which authored vacancy cards are open on capture day.
        ids = {str(v['id']) for v in json.loads((sources / 'vacancies.json').read_text(encoding='utf-8'))['results']}
        html = re.sub(r'<a\b[^>]*data-vacancy-id="([^\"]+)"[^>]*>',
                      lambda m: m[0] if m[1] in ids else m[0][:-1] + ' hidden>', html)
        html = re.sub(r'<form\b[^>]*>', '<form class="popup__body form">', html)
        raw = (sources / 'assets/media/landing_pages/career-max-65/js/script.js').read_text(encoding='utf-8')
        ui = raw[raw.index("document.addEventListener('DOMContentLoaded'"):raw.index('\t// input-file')]
        ui = re.sub(r'\t// hide closed vacancies[\s\S]*?\t// menu', '\t// menu', ui)
        ui = re.sub(r'\t// fancybox defaults[\s\S]*?\t// accordion', '\t// accordion', ui)
        ui = ui.replace("e.target.href.split('#')", "e.currentTarget.href.split('#')")
        ui = ui.replace('\t// sections anim', "\tgsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {\n\t// sections anim")
        ui = ui.replace('\t// tab', '\t});\n\t// tab')
        ui = 'const {gsap,ScrollTrigger}=window;\ngsap.registerPlugin(ScrollTrigger);\n' + ui + '\n});\n'
        ui += "document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));\n"
        ui += """
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const videos=[...document.querySelectorAll('video')];const visible=new Set();
function playback(){for(const video of videos){if(!document.hidden&&!reduced.matches&&visible.has(video))video.play().catch(()=>{});else video.pause();}}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}playback();});
for(const video of videos){video.autoplay=false;video.muted=true;video.preload='metadata';observer.observe(video);}
document.addEventListener('visibilitychange',playback);reduced.addEventListener('change',playback);
for(const link of document.querySelectorAll('a[href^="https://"]')){link.target='_blank';link.rel='noopener noreferrer';}
"""
        (target / 'local.mjs').write_text(ui, encoding='utf-8')
    head = ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
            'img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; '
            'script-src \'self\'; connect-src \'self\'; media-src \'self\'; object-src \'none\'; '
            'base-uri \'self\'; form-action \'none\'">')
    head += ''.join(f'<link rel="stylesheet" href="{link}">' for link in styles)
    head += '<link rel="icon" href="' + ('./favicon.svg' if name == 'authors' else './media/landing_pages/career-max-65/img/favicon.png') + '">'
    html = html.replace('</head>', head + '<link rel="stylesheet" href="./local.css"></head>')
    scripts = ''
    if name == 'career':
        base = './media/landing_pages/career-max-65/libs/gsap/'
        scripts = f'<script src="{base}gsap.js"></script><script src="{base}gsap-scroll-trigger.js"></script>'
    html = html.replace('</body>', scripts + '<script type="module" src="./local.mjs"></script></body>')
    (target / 'index.html').write_text(html, encoding='utf-8')
    provenance = {'sourceUrl': origin, 'capturedAt': '2026-10-01',
                  'scope': 'Public landing only; external application, vacancy detail and submission services remain external',
                  'changes': ['Local assets; trackers/hydration removed', 'Local interaction adaptation; reduced motion support'],
                  'files': {}}
    for file in sorted(target.rglob('*')):
        if file.is_file() and file.name != 'source.json':
            provenance['files'][file.relative_to(target).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
    (target / 'source.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(name, len(provenance['files']), 'files')
