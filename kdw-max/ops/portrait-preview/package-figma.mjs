#!/usr/bin/env node
// PORTRAIT-LAYOUT-C: package the frames from capture-figma.mjs as a separate
// Figma plugin "MAX — вертикальный стенд · 1080×1920". Same pack format, UI
// and runtime as UI/figma-plugins/max-current-screens; the landscape plugin
// and its screens.maxscreens are not touched.
// Usage (from kdw-max): node ops/portrait-preview/package-figma.mjs <capture-dir>
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../../UI/figma-plugins/max-current-screens/source');
const capture = path.resolve(process.argv[2] ?? 'portrait-figma');
const plugin = path.join(capture, 'max-portrait-screens');
const W = 1080, H = 1920, LABEL = `${W}×${H}`;
const sha = b => createHash('sha256').update(b).digest('hex');
const data = JSON.parse(fs.readFileSync(path.join(source, 'final-fixtures.json'), 'utf8'));
const frames = JSON.parse(fs.readFileSync(path.join(capture, 'captures.json'), 'utf8'));
const order = new Map(['shared.standby', ...data.fixtures.map(f => f.id)].map((id, i) => [id, i]));
frames.sort((a, b) => order.get(a.id) - order.get(b.id));
const missing = [...order.keys()].filter(id => !frames.some(f => f.id === id));
if (missing.length) console.warn('Missing frames (not captured):', missing.join(', '));

fs.mkdirSync(plugin, {recursive: true});
const assets = {};let offset = 0;
for (const f of frames) {
  const bytes = fs.readFileSync(path.join(capture, 'final-assets', f.image));
  if (bytes.readUInt32BE(16) !== W || bytes.readUInt32BE(20) !== H || sha(bytes) !== f.sha256) throw Error('Unexpected frame ' + f.id);
  if (bytes.length > 8 * 1024 * 1024) throw Error('Frame exceeds bounded transport: ' + f.id);
  assets[f.image] = {localPath: 'final-assets/' + f.image, offset, bytes: bytes.length, sha256: f.sha256, width: W, height: H, format: 'png'};
  offset += bytes.length;
}
const revision = data.revision.replace('.pixel-map', '') + '.portrait-1080x1920.screenshots1';
const indexBytes = Buffer.from(JSON.stringify({schema: 'max-screen-pack/v1', revision, payloadBytes: offset, assets}));
const length = Buffer.alloc(4); length.writeUInt32LE(indexBytes.length);
const packFile = path.join(plugin, 'screens.maxscreens');
const fd = fs.openSync(packFile, 'w');
try {
  fs.writeSync(fd, Buffer.from('MAXSCREENPACK1\n')); fs.writeSync(fd, length); fs.writeSync(fd, indexBytes);
  for (const f of frames) fs.writeSync(fd, fs.readFileSync(path.join(capture, 'final-assets', f.image)));
} finally { fs.closeSync(fd); }
const transport = {schema: 'max-screen-pack/v1', file: 'screens.maxscreens', indexSha256: sha(indexBytes), bytes: fs.statSync(packFile).size};
const summary = {frames: frames.length, uniqueScreens: new Set(frames.filter(f => data.catalog.tasks[f.taskId]?.screens[f.screenId]).map(f => f.screenId)).size,
  assets: Object.keys(assets).length, width: W, height: H, missions: 4, businesses: 3, mediaBytes: offset};
const pack = {revision, transport, summary, sectors: {cafe: 'Кофейня', flowers: 'Цветочный магазин', auto: 'Автомастерская'}, catalog: data.catalog,
  frames: frames.map(({diagnostics, ...f}) => f), assets};
// Labels, frame metadata and the comment export's capture-pixel coordinates.
const relabel = s => s.replaceAll('3072×1536', LABEL).replaceAll('width:3072,height:1536', `width:${W},height:${H}`).replaceAll('*3072', '*' + W).replaceAll('*1536', '*' + H);
fs.writeFileSync(path.join(plugin, 'code.js'), 'const PACK=' + JSON.stringify(pack) + ';\n' +
  ['comment-mapper.js', 'comments-runtime.js', 'final-runtime.js'].map(f => relabel(fs.readFileSync(path.join(source, f), 'utf8'))).join('\n'));
fs.writeFileSync(path.join(plugin, 'ui.html'), relabel(fs.readFileSync(path.join(source, 'final-ui-template.html'), 'utf8'))
  .replace('/*PACK_READER*/', fs.readFileSync(path.join(source, 'pack-reader.js'), 'utf8'))
  .replace('/*COMMENTS_UI*/', fs.readFileSync(path.join(source, 'comments-ui.js'), 'utf8')));
fs.writeFileSync(path.join(plugin, 'manifest.json'), JSON.stringify({name: `MAX — вертикальный стенд · ${LABEL}`, id: 'max-portrait-screens-local-20261105', api: '1.0.0',
  main: 'code.js', ui: 'ui.html', editorType: ['figma'], documentAccess: 'dynamic-page',
  networkAccess: {allowedDomains: ['https://api.figma.com'], reasoning: 'Read comments from the selected Figma file on explicit request using a temporary user-provided token.'}}, null, 2));
fs.writeFileSync(path.join(plugin, 'README.md'), `# MAX — вертикальный стенд ${LABEL} (вариант C)

${frames.length} кадров, как в наборе max-current-screens, но на вертикальном экране ${LABEL}: главное меню, ладонь, все экраны четырёх миссий, поля, клавиатура, игры с постами и витриной, итоги и финальный QR.

1. Figma Desktop → Plugins → Development → Import plugin from manifest… → manifest.json из этой папки.
2. В плагине выберите screens.maxscreens из этой же папки.
3. Выберите миссии и бизнесы → «Собрать фреймы со скриншотами».

Кадры сняты из готовой сборки app.js с правками ветки portrait-layout-c (ops/portrait-preview), в headless Chrome. Видео меню и фото посетителя со стелы в кадры не попадают.${missing.length ? `\n\nНе сняты: ${missing.join(', ')}.` : ''}
`);
console.log({...summary, missing: missing.length, packBytes: transport.bytes, plugin});
