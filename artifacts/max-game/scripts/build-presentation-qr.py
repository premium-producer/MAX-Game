"""Build a local QR asset with the existing ReportLab encoder (no web service)."""
from pathlib import Path
from reportlab.graphics.barcode.qr import QrCodeWidget
from PIL import Image, ImageDraw

url = 'https://max.ru/'
code = QrCodeWidget(url, barLevel='M')
code.qr.make()
matrix = code.qr.modules
quiet, scale = 4, 12
image = Image.new('RGB', ((len(matrix) + quiet * 2) * scale,) * 2, 'white')
draw = ImageDraw.Draw(image)
for y, row in enumerate(matrix):
    for x, dark in enumerate(row):
        if dark:
            left, top = (x + quiet) * scale, (y + quiet) * scale
            draw.rectangle((left, top, left + scale - 1, top + scale - 1), fill='black')
target = Path(__file__).resolve().parents[1] / 'public/assets/presentation/max-site-qr.png'
target.parent.mkdir(parents=True, exist_ok=True)
image.save(target)
assert all(image.getpixel(((x + quiet) * scale, (y + quiet) * scale)) == ((0, 0, 0) if dark else (255, 255, 255)) for y, row in enumerate(matrix) for x, dark in enumerate(row))
print(f'{url} -> {target} ({image.width}px; {len(matrix)} modules; quiet zone {quiet})')
