# MAX v5 — смещённое затемнение Frost, 03.10.2026

Пользовательский кадр: тёмные силуэты плиток и зоны находятся ниже foreground. Код: iframe #ambient центрирован aspect4096/1280; GameBackgroundFrost использовал координаты parent viewport как локальные. При letterbox top220 прежняя формула оставляла лишний Y220. Это подтверждённый координатный дефект; после исправления визуальный кадр ещё не получен.

Исправление: native window.frameElement/getBoundingClientRect задают origin и scale существующему Frost. Маски зоны и published controls переводятся в framebuffer iframe; радиусы/LOD используют его фактический масштаб. Нет frameElement — прежний полноэкранный путь сохранён. Маска стенда, фон и настройки игры не заменялись. Scoped viewer builder дополнен отсутствовавшим common-map-game-frost.js; обновлены только три модуля background, без активации процессов и полного пакета.

PASS:6 CPU тестов Frost/layout, включая Y220/горизонтальное смещение/DPR/движение/удаление; JS syntax; duplicate guard; scoped sync; source/runtime/HTTP SHA3/3. [Машинное подтверждение](max-v5-frost-origin-20261003.json). [Исследование DOM API и ограничения](../../docs/Research/max-webgl-v5-bfm-theme-20261003.md). Только same-origin, iframe без border/rotation. Новая библиотека/solver не добавлены.

Визуальная самопроверка после правки: не выполнена. Пользовательская приёмка открыта. Открыть v5 с v=frost-origin-1 и раскрыть иконки: затемнение должно следовать под ними, без отдельных копий ниже. Мастер/TD/назначения не перезапускались, v5 foreground bundle не менялся.
