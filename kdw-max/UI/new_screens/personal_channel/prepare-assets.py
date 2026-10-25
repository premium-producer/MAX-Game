"""Prepare a staged, deduplicated asset pack. Never modifies the supplied screens."""
import base64
import hashlib
import io
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'prepared'
NS = {'s': 'http://www.w3.org/2000/svg'}
sha = lambda data: hashlib.sha256(data).hexdigest()
ROLES = {
    '1608763d94b0': ('channel-avatar-cinema', 'channel-avatar', 256),
    'db5db05c027b': ('chat-wallpaper-dark', 'wallpaper', 720),
    '10449f2f1a2c': ('chat-wallpaper-light', 'wallpaper', 720),
    'b9e67d45ee63': ('post-photo-cat-reference', 'post-photo', 960),
    'cec581dfd9b4': ('post-photo-series', 'post-photo', 960),
    '3e9140fb0d68': ('channel-avatar-timecode-reference', 'reference-avatar', 128),
    '192dd971f9b6': ('post-symbol-spiral', 'post-symbol', 64),
    'bdedb6197212': ('post-symbol-eyes', 'post-symbol', 64),
    'e4dacc4815e4': ('creation-confetti', 'decoration', 160),
}
SCREEN_IDS = [
    'blogger.channel.chats', 'blogger.channel.menu', 'blogger.channel.name',
    'blogger.channel.filled', 'blogger.channel.privacy', 'blogger.channel.public-confirm',
    'blogger.channel.public-link', 'blogger.channel.public-filled',
    'blogger.channel.subscribers', 'blogger.channel.created', 'blogger.comments.post',
    'blogger.comments.input', 'blogger.comments.reply', 'blogger.comments.result',
    'blogger.comments.returned-post',
]

def dump(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def main():
    (OUT / 'images').mkdir(parents=True, exist_ok=True)
    previous = json.loads((OUT / 'manifest.json').read_text(encoding='utf-8')) if (OUT / 'manifest.json').exists() else {}
    assets, sources, screens = {}, [], []
    for number, screen_id in enumerate(SCREEN_IDS, 1):
        file = ROOT / f'svg/screen_{number}.svg'
        raw = file.read_bytes()
        tree = ET.fromstring(raw)
        refs = []
        for node in tree.findall('.//s:image', NS):
            href = node.get('{http://www.w3.org/1999/xlink}href', node.get('href', ''))
            if not href.startswith('data:image/') or ';base64,' not in href:
                raise ValueError(f'Unsupported image reference in {file.name}')
            data = base64.b64decode(href.split(',', 1)[1], validate=True)
            digest = sha(data)
            if digest not in assets:
                name, role, max_size = ROLES.get(digest[:12], ('source-' + digest[:12], 'contact-or-reference', 128))
                with Image.open(io.BytesIO(data)) as image:
                    image.load()
                    original_size = image.size
                    image = ImageOps.exif_transpose(image).convert('RGBA')
                    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    target = OUT / 'images' / (name + '.webp')
                    # Alpha and detailed UI symbols use lossless encoding.
                    lossless = role in ('channel-avatar', 'reference-avatar', 'post-symbol', 'decoration')
                    image.save(target, 'WEBP', quality=88, method=6, lossless=lossless, exact=True)
                    payload = target.read_bytes()
                    assets[digest] = {'id': name, 'kind': role, 'path': 'images/' + target.name,
                        'mimeType': 'image/webp', 'width': image.width, 'height': image.height,
                        'bytes': len(payload), 'sha256': sha(payload), 'sourceImageSha256': digest,
                        'sourceDimensions': list(original_size), 'sourceBytes': len(data),
                        'losslessEncodingAfterResize': lossless, 'sources': []}
            assets[digest]['sources'].append({'screen': number, 'imageId': node.get('id')})
            refs.append(assets[digest]['id'])
        sources.append({'screen': number, 'path': f'../svg/screen_{number}.svg', 'bytes': len(raw), 'sha256': sha(raw)})
        screens.append({'screen': number, 'screenId': screen_id,
            'screenIdStatus': 'proposed-new' if number == 15 else 'existing',
            'theme': 'dark' if number <= 10 else 'light', 'viewBox': [0, 0, 360, 800],
            'reference': f'../png/screen_{number}.png', 'rasterAssets': sorted(set(refs)),
            'dynamicBindings': (['channel.name', 'channel.description', 'channel.avatarId', 'channel.visibility', 'channel.slug']
                if number <= 10 else ['channel.name', 'channel.avatarId', 'channel.audience', 'post', 'comments', 'replyDraft', 'commentCount'])})
    manifest = {'schemaVersion': 1, 'id': 'KDW-MAX-PERSONAL-CHANNEL-ASSETS-20261020',
        'status': 'staged-not-integrated', 'coordinateSpace': {'width': 360, 'height': 800},
        'sources': sources, 'assets': list(assets.values()),
        'avatarChoices': [{'id': 'cinema', 'assetId': 'channel-avatar-cinema', 'origin': 'supplied-design'}],
        'loading': {'policy': 'load-current-step-and-next; share decoded assets by id',
            'groups': {str(s['screen']): s['rasterAssets'] for s in screens},
            'note': 'Groups preserve source references, including potentially offscreen material. Native components should request only their used assets.'},
        'statistics': {'status': 'awaiting-design', 'reuse': ['channel.name', 'channel.avatarId']},
        'totals': {'sourceSvgBytes': sum(s['bytes'] for s in sources), 'uniqueRasterCount': len(assets),
            'uniqueSourceRasterBytes': sum(a['sourceBytes'] for a in assets.values()),
            'preparedRasterBytes': sum(a['bytes'] for a in assets.values())}}
    if previous.get('integration'):
        manifest['integration'] = previous['integration']
        manifest['status'] = 'integrated-local'
    dump('manifest.json', manifest)
    current_paths = {a['path'] for a in assets.values()}
    for old in previous.get('assets', []):
        if old['path'] in current_paths:
            continue
        stale = (OUT / old['path']).resolve()
        if stale.parent != (OUT / 'images').resolve():
            continue
        stale.unlink(missing_ok=True)
    dump('screens.json', screens)
    # A contact sheet is for inspection, never an application asset.
    sheet = Image.new('RGB', (1000, 7 * 190), '#ececf2')
    draw = ImageDraw.Draw(sheet)
    for index, asset in enumerate(assets.values()):
        x, y = (index % 5) * 200, (index // 5) * 190
        with Image.open(OUT / asset['path']) as image:
            image.thumbnail((170, 130))
            sheet.paste(image, (x + 15, y + 5), image if image.mode == 'RGBA' else None)
        draw.text((x + 8, y + 140), asset['id'][:28], fill='black')
        draw.text((x + 8, y + 156), str([r['screen'] for r in asset['sources']]), fill='#555555')
    sheet.save(OUT / 'raster-contact.png')
    print(json.dumps(manifest['totals']))

if __name__ == '__main__':
    main()
