from pathlib import Path
import json, html, zipfile
from PIL import Image, ImageDraw, ImageFont

p = Path(__file__).parent
screens = sorted(json.loads((p/'screens.json').read_text(encoding='utf-8')), key=lambda s:s['file'])
cards = ''.join(f'<a href="{s["file"]}" target="_blank"><img loading="lazy" src="{s["file"]}"><span>{html.escape(s["title"])}</span></a>' for s in screens)
(p/'index.html').write_text('''<!doctype html><html lang="ru"><meta charset="utf-8"><title>MAX — клиентская версия, скриншоты</title><style>body{margin:32px;background:#100b25;color:#fff;font:16px system-ui}h1{font-size:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:24px}a{color:inherit;text-decoration:none;background:#241c40;border-radius:12px;overflow:hidden}img{width:100%;display:block}span{display:block;padding:14px}p{color:#c5bedd}</style><h1>MAX — клиентская версия</h1><p>84 скриншота · 28 сентября 2026 · начало, первый шаг, полная сборка, задания и завершение всех 4 миссий. Нажмите на изображение для полного размера.</p><p>Бизнес пройден по ветке «Канал»; общение — голосовое сообщение и стикер. Другие варианты не сняты. Сценарные заглушки сохранены как в приложении.</p><div class="grid">'''+cards+'</div></html>',encoding='utf-8')
rows = [
 ('Блогер',['10-blogger-start','11-blogger-first-step','13-blogger-assembled','14-blogger-channel-1','18-blogger-complete']),
 ('Цифровой ID',['20-id-start','21-id-first-step','23-id-assembled','24-id-create-1','28-id-complete']),
 ('Общение',['30-communication-start','31-communication-first-step','33-communication-assembled','34a-communication-call-1','38-communication-complete']),
 ('Бизнес',['40-business-start','41-business-first-step','43-business-assembled','44-business-account-1','48-business-complete'])]
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
sheet=Image.new('RGB',(1620,1020),'#100b25');d=ImageDraw.Draw(sheet)
d.text((20,15),'MAX / КЛИЕНТСКАЯ ВЕРСИЯ — ОСНОВНЫЕ СОСТОЯНИЯ',font=font,fill='white')
for col,label in enumerate(['Начало','Первый шаг','Полная сборка','Задание','Миссия выполнена']):d.text((20+col*320,55),label,font=small,fill='#b8add7')
for r,(label,files) in enumerate(rows):
 y=90+r*230;d.text((20,y),label,font=font,fill='white')
 for c,name in enumerate(files):
  im=Image.open(p/(name+'.png')).convert('RGB');im.thumbnail((310,190));sheet.paste(im,(20+c*320,y+32))
sheet.save(p/'overview.jpg',quality=92)
(p/'README.md').write_text('# Скриншоты клиентской игры MAX\n\n84 PNG с https://futuronika.pro/df/max-game/client/, 28.09.2026. Снято реальное прохождение через UI, все четыре миссии и финал. Начало, первый шаг MAX, сборка, все экраны заданий выбранного пути, результаты и справки.\n\nБизнес: кофейня → канал. Общение: голосовое сообщение и стикер. Альтернативные бизнес-ветки, видеокружок и реакция не сняты: дополнительная съёмка остановлена по просьбе пользователя выдать готовые изображения быстрее.\n\nОткрыть index.html для галереи, overview.jpg — обзор. Исходные PNG не изменялись. Тестовый прогресс сброшен с разрешения пользователя. Консоль при основном прохождении без предупреждений и ошибок. Код и сервер не менялись.\n',encoding='utf-8')
with zipfile.ZipFile(p.parent/'max-client-screens-20260928.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in p.iterdir():
  if f.suffix in {'.png','.jpg','.html','.json','.md'}:z.write(f,f'max-client-screens/{f.name}')
print(f'{len(screens)} PNG; gallery and ZIP ready')
