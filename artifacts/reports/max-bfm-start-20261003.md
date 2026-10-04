# MAX BFM v4 — техническая проверка первой итерации

03.10.2026. [Исследование и ограничения](../../docs/Research/max-bfm-presentation-20261003.md).

Статус: **собрано локально, пользовательская приёмка не проведена**. Это этап меню/удержания/раскрытия, не полная четвёртая версия игры.

URL: http://localhost:8770/max-game/bfm-design/?backend=local&layout=wall

## Что действительно подключено

- Native BFM screen transition с оригинальными dissolve timings и CSS-кривыми; исходные фрагменты и SHA в `artifacts/max-game/vendor/bfm-native/`.
- Браузерные CSS/WAAPI выполняют отображение и движение, DOM-элемент является зоной ввода. Собственного spring/collision engine в новой зависимости нет.
- Прежний `createMissionSessionApplication` + существующий session facade + MISSION_CATALOG. Все шесть миссий доступны для проверки старта. Новое сохранение явно изолировано: `max-bfm-preview:v1` / `bfm-start-preview`.
- MAX logo/font/glyphs, плитка120/radius32/caption24, ring endpoints. GPU-фон использует существующий `lumiReferenceBackground`, без изменения его исходников.
- После подтверждённого удержания backend переходит к заданию, но preview приостанавливает владельца ввода и таймер: ответов/телефона в этом сечении нет. Ни одно задание не засчитывается визуальной анимацией.
- Сборщик пишет только `apps/max-game/bfm-design/`; старые runtime bundles, мастер, TD и deployment не изменяет.

## Результаты

- PASS `node --check`: bfm-main, bfm-start-contact, screen-transition, build-bfm-runtime.
- PASS `node --test --test-isolation=none artifacts/max-game/test/bfm-start.test.mjs`: 3/3. Реальный SessionPort: ранний отпуск, второй pointer, повтор800ms, отсутствие двойного подтверждения, рестарт, выход из hit target, отмена. Native transition contract: ожидание finished, поздний callback отменённого перехода, reduced motion и fallback.
- Тесты используют mock DOM/pointer capture/ViewTransition: они проверяют адаптер и backend, **не браузерную реализацию Web Animations, GPU или видимую плавность**.
- PASS duplicate guard.
- PASS локальная esbuild-сборка:79 модулей. Build guard отвергает импорты старых journey-motion/reference-motion/reference-frame/guided-main. `build.json` фиксирует SHA inputs/output.
- PASS HTTP200 и совпадение runtimeSHA для HTML/JS/CSS/provenance и MAX logo/font/tokens: [HTTP-результаты](max-bfm-http-20261003.json). Повторено после финальной сборки.
- Первый изолированный запуск node:test и esbuild были заблокированы sandbox `spawn EPERM`. Тесты выполнены без дочерней изоляции; локальная сборка выполнена после разрешённой эскалации. Это ограничения запуска инструментов, не ошибки приложения.

## Открытые критерии

BLOCKED до отзыва пользователя: отображение/плавность/пропорции и native input в целевом браузере. Вкладки агент не открывал, GPU-нагрузка и видео не запускались.

Не реализованы в v4: ring→line, телефон/PC и действия, переходы заданий/QR, server profile, drag с раздвиганием. Новая версия не объявляется заменой работающей игры. BFM не даёт готового collision solver; этот пробел не закрыт фиктивной ссылкой на библиотеку.

Пользовательская проверка: выбрать миссию → коротко нажать/отпустить и затем удержать0.8с → после раскрытия нажать рестарт. Ожидается: короткое нажатие не раскрывает круг; повтор раскрывает его один раз; рестарт возвращает ладонь. Прислать кадр и оценку темпа.
