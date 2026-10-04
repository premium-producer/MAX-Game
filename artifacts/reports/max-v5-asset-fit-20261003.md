# MAX v5 — адаптивный экран по ассету

03.10.2026. v5DeviceMetrics использует aspect ассета и реальные строки controls вместо fixed phone/PC widths. Оболочка800по высоте, padding12/10, actions96px/row+10gap и18gap от картинки. CSS пустойfooter скрывает; canvas ratio и hotspot percentages прежние. Warmup использует те же метрики; splash фиксированный392×800. Backend/клиентский текст/ассеты не изменены.

PASS41CPU: device-morph8, startup10, intro10, route3, handoff4, preload6. Включены все84экрана каталога, разныйaspect приодномkind, одинаковыйaspect приразномkind, fallback,30/60/120Гц morph, hold/shell/logo, отмена, restart, ряд400px. Syntax7/duplicate/build28/197/HTTP28/28SHA+source197/197SHA PASS. Два агента: readonly каталог/CSSaudit и tests.

Внутренний браузер: фактическийlocalhost8770, загрузкаготова, меню и выборбизнеса работают; короткийdrag ладони возвращаетscan. Пройтиполноеудержание доступнымкороткимdrag не удалось; проверкавидимыхпропорций/морфаBLOCKED/ожидаетпользователя. Не выдаватьCPU заGPUприёмку. Консоль: MAX background: Ожидается живая маска стенда; фоннеисправлялся вэтойитерации. ТяжёлыеGPU/видео/мастеррестарт/публикация не выполнялись.

[Сборка](http://localhost:8770/max-game/webgl-v5/?backend=local&layout=wall&v=asset-fit-1), [JSON](max-v5-asset-fit-20261003.json), [обоснование](../../docs/Research/max-v5-asset-fit-20261003.md).

Пользовательскаяпроверка: начатьбизнесмиссию, проверитьширокоеизображение иследующийэкрансинойпропорцией; затемлюбойузкийэкран с кнопкой. Изображение должно касаться внутреннейобласти безискажения, controls оставатьсядоступными, высота/центрсохраняться.
