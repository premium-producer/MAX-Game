# MAX single-load: проверка локального кандидата — 04.10.2026

## Исправление

Карточки автоматических миссий раньше делали location.assign, выход из них location.replace. Каждый переход заново загружал весь документ и проходил 152 warmup-пакета всех экранов. Теперь renderer и оболочка сохраняются, меняется SessionPort. Сохранения manual IndexedDB и automatic MemoryPersistence остаются раздельными; локальная миграция не нужна.

Startup закрепляет оболочку вместо всего каталога. Ранний first-screen preload работает при выборе/ладони, следующие ресурсы готовятся existing current/prepareNext. Renderer освобождает неиспользуемые текстуры, сохраняя map/alphaMap живых материалов; растр устройства ограничен drawing-buffer density и 2048 px, без mipmaps. Поздние ответы не снимают блокировку нового действия. Pagehide отменяет boot/switch и закрывает незавершённого кандидата.

Владельцы: root — lifecycle/main/runtime/docs; bounded_asset_loading — startup-assets, renderer и его CPU-тесты; session_switch_audit — независимый read-only review. F, публикации, текущие серверные черновики и игровая разметка не изменялись. Основа ветки codex/automatic-mission-copies — 8280f703a9ef8d12375fbe9eac1bc7038bc745c7; commit/push не выполнены.

## Результаты

- node --check трёх изменённых source: PASS.
- 44/44 Node tests: startup-assets, startup, autoplay-backend, autoplay-presentation, webgl-session. Включены late callback, отмена удержания, 30/60/120 Hz, старые ответы и сохранения.
- Duplicate guard PASS; scoped build 31 files / 231 input modules, app.js 2069040 bytes.
- HTTP 31/31 и исходные input SHA 231/231 совпадают. app.js SHA256: 79b44380d0414c6ee5afb1c8716b7aabf5cfc006cace3a6f6ec610f628bf1b15.
- IAB локально, первая серия: menu → automatic business → menu → manual communication palm → menu. gameInstance 3448a9ad-99cb-4bb1-8a6e-0e903f0ac6f5 неизменен; normal palm ожидает контакт, console errors 0.
- Вторая серия после сборки cancellation guard: menu → automatic communication → полный проход до QR → Continue → business → menu. gameInstance 4e891408-e4fc-482e-8b23-3524848f2019 неизменен; повторного общего loading не было; console errors 0. После последней проверки catch/pagehide финальный runtime повторно открыт.
- Первые попытки на старой вкладке дали connection refused. Локальный сервер восстановлен, новая IAB-вкладка открылась; проверки выше выполнены на фактической странице. Это не отказ защитного approval и не browser security interstitial.

## Измерения DOM-диагностики

| Метрика | Ранее (отчёт iOS) | Новый runtime |
| --- | ---: | ---: |
| GPU startup-пакеты | 152 | 4 |
| Декодированные startup images | 91 | 20 |
| Закреплённые startup textures | 322 | 46 |
| Startup pixels | 208995901 | 9587431 |
| Base RGBA startup | около 797 МиБ | 36,6 МиБ |

Текущий cache: меню 67 textures / 44095936 bytes; business screen sample 54 / 68875316; communication QR 57 / 49391284; после следующей business и возврата меню — 67 / 44096708. Рост после прохода не сохраняется в screen cache. Это выборочные короткие измерения; base RGBA не включает render targets, все mipmaps других материалов, память DOM/JS/драйвера. Не объявляется лимитом общей памяти процесса.

## Ограничения и приёмка

Техническая проверка PASS; короткая визуальная самопроверка PASS; пользовательская приёмка OPEN. Снимок в середине смены формата показал предусмотренное затухание картинки; он не является доказательством готовности контента. Итоговый кадр показывает меню после возвратов. На реальном iPhone/WebKit, плохой сети и длительном прогоне не проверено. Полного offline cache нет: следующий файл может ожидаться при недоступной/медленной сети, readiness gate сохраняется. Полная подготовка оболочки повторяется только при настоящей перезагрузке страницы.

Для проверки пользователю: один раз обновить клиент; выбрать автокарточку, затем вернуться и выбрать другую; убедиться, что общий экран «Подготовка графики MAX» между ними не появляется.

[Обоснование](../../docs/Research/max-single-load-20261004.md) · [Контракт](../../apps/max-game/docs/ASSET_LOADING.md).

![Меню после переходов](max-single-load-menu-20261004.png)

## SHA исходников для интегратора

- `artifacts/max-game/src/journey-guided-main.js`: `16f81d6b539f9dc31a9809c2b2fad35b40fbd7ffecb153a7fa848e24bdfb7f61`
- `artifacts/max-game/src/journey-webgl-ui.mjs`: `a1ec38ca61afe3a328638c4cb4adbb1638481bd2dad2df6728d6db65c835a887`
- `artifacts/max-game/src/journey-v5-startup-assets.mjs`: `8c561eef6a65fab1433498010afe9081f387a2849351652ee3105d952de31f44`
- `artifacts/max-game/test/webgl-v5-startup-assets.test.mjs`: `59df3bc85540540ea65d867bab3c3a2ed7c4ed9bd79b559031b86233aecae965`
