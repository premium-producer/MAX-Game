# Стела на futuronika.pro

**27.10.2026:** финальное представление Стеллы — пиксельное. Исходники и новые web-экспорты используют пиксели по умолчанию; явный `background=gradient` сохраняет альтернативный просмотр. Отдельный `pixels-no-photo` остаётся вариантом без камеры; обычная финальная Стелла сохраняет фотоэтап. Опубликованные immutable web-ресурсы не переписываются.

**23.10.2026 — переносимая связка:** новое разрешение пользователя включает передачу подтверждённого JPEG в MAX через закрытую очередь с единым gameId/sessionId. Прежние описания «только память/не передаётся» ниже относятся к старым выпускам. Публичный VPS этим изменением не обновлялся. [Текущий протокол](GAME_STELA_LINK.md).

**Итерация голосового выбора, 22.10.2026:** на audience карточки остаются видны при обработке голоса. Принятый выбор запускает тот же один вылет четырёх слов, что и нажатие. До конца сцены нет ready нового экрана и озвучки; затем photo либо result без фото. Камера открывается без голосового сопровождения, итоговая реплика — после готовности результата. Приватные настройки/пресеты, Caddy и unit неизменны; оба старых immutable release сохранены. [Проверки обновления](verification-20261022/stela-voice-selection/README.md).

Актуальная публикация: [открыть Стеллу](https://futuronika.pro/df/max-info-panel/). Экспорт `b4a713736f6ab161f3d0` из `KDW-MAX-STELA-VOICE-SELECTION-20261022`, 22.10.2026. Это текущие кнопки, четыре миссии, фото/review/retake и Qwen с голосом Vasilisa. Начало по нажатию логотипа; браузер запрашивает микрофон/камеру. Один разговор одновременно, как в исходном шлюзе киоска.

Отдельная страница по новому запросу: [пиксельная Стела без фото](https://futuronika.pro/df/max-info-panel/pixels-no-photo/). У неё фиксирован пиксельный фон и прямой переход от любого выбора к результату, без монтирования фотоэкрана/запроса камеры. Qwen и кнопки используют один серверный переход: `skipPhoto=true` при создании сессии, `photoEnabled=false` в авторитетном состоянии/контексте модели. Export-only `web/controller.cjs` расширяет исходный контроллер и заменяет промежуточный photo на result до публикации состояния, с одним увеличением revision. Повтор/назад/guards сохранены. Prompt учитывает флаг, не предлагает фотографирование. У стандартной страницы (в том числе `?background=pixels`) photo по-прежнему включён. [Проверки варианта](verification-stela-web-no-photo-20261022/README.md).

По прямому уточнению пользователя **VST обрабатываются на сервере с теми же полными пресетами**. RNNoise1.10, TDR Nova2.2.3, ZL Compressor0.6.1, FDN64Reverb0.1.20 и исходный `kdw-audio-host.exe` перенесены побайтно, включая app-local Microsoft CRT. Windows x64 плагины исполняются через Wine9.0/Xvfb на Ubuntu24.04. Фабричные состояния не устанавливались. Обе Nova остаются в bypass согласно действующему SOFT-VOICE; RNNoise/ZL на входе и ZL/FDN на выходе активны.

Клиент сохраняет прежний порядок PCM/FX/VAD и общий выход PCM/FX/fades/RTC AEC. WAV ручного управления прежние, новые для нажатий не синтезировались. Фото1080×1920 JPEG остаётся в памяти браузера; в Qwen/на диск/в игру не передаётся. HTTPS/WSS обязательны для браузерных media API. Записи текста диалогов на этом публичном сервере выключены, журнал метаданных сохраняется7дней/до100МБ.

## Устройство публикации

- Экспортёр: `apps/stela/source/export-web.mjs`; сборка через существующий Vite toolchain. Путь API и ресурсов преобразуется только в экспортируемом варианте. Desktop `www`, аудиосервис и конфигурация Windows не меняются.
- `source/web/server.cjs` оборачивает прежний `portable-server.cjs`. Доступны только status/session/client-events, чтение audio/config и два WebSocket audio/voice. Проверяются Host/Origin; настройки, VST editor, bundle и stop снаружи закрыты.
- `source/web/wine-spawn.cjs` подключается только к экспортированной копии worker. Linux запускает тот же exe через `KDW_AUDIO_WINE`, абсолютные пути plugin/state передаются как Wine `Z:/...`. Исходные250мс DSP/10с startup, очереди и guards сохранены.
- VPS: отдельный непривилегированный пользователь и systemd-сервис `max-info-panel`; frontend/gateway19092 и внутренний portable-server19091 слушают только127.0.0.1. Node24.20.0, Wine9.0, Xvfb. Установлены29необходимых системных пакетов без обновления/удаления существующих.
- Корень: `/srv/projects/futuronika/df/max-info-panel`; `current` → `releases/b4a713736f6ab161f3d0`. Предыдущие `39316d49180adca07c6f` и `e32a4f6dde925f37c5b0` сохранены; его immutable assets доступны через ссылку в новом public/releases. Caddy обслуживает только `current/public` и узкий API reverse_proxy. Файлы `/etc/caddy/sites-enabled/df-max-info-panel.caddy` и `/etc/systemd/system/max-info-panel.service` принадлежат этой публикации. При добавлении варианта без фото Caddy/unit/shared config/presets сохранены по SHA.
- Приватные Qwen/voice/audio config и пять используемых full presets находятся в `shared/data`, каталог0700/файлы0600. `data` внутри релиза — ссылка на этот каталог. Wineprefix — `shared/wine`; журналы — `shared/data/logs/voice`. В public нет ключей, presets, host exe или plugins.
- Старые `/df/stela/`, `/df/max-game-client/`, replica19086 и startup-sputnik19087 не заменялись. Автозапуск сервиса включён; при остановке systemd убирает всю его группу Wine/Xvfb.

## Сборка и обслуживание

Из корня проекта: `node apps/stela/source/export-web.mjs D:/job/production/FUTURONIKA/VK_DigitalProducts/artifacts/stella-prototype/node_modules`. Неизменяемый export появляется в `dist/stela-web/<id>`, указатель — `latest.json`. Новый id зависит от исходных SHA и web adapter. Каталог с существующим id не перезаписывается. Приватные config/full presets переносятся отдельно по SSH, никогда не через frontend или публичный архив.

Первичная публикация выполнена защищённым одноразовым `ops/stela-web-20261022/deploy.py`; **он не является повторным updater**: проверяет отсутствие предыдущей установки, SHA155файлов/пятиpresets, свободные порты и исходные маршруты; при сбое откатывает только свои route/unit/current. Для обновления подготовить новый release, сохранить shared, предыдущую цель current и URL старых immutable assets; проверить VST parity и gateway, затем атомарно переключить current и перезапустить только max-info-panel. Перед Caddy reload всегда validate. Не заменять пользовательский audio.local/пресеты заводскими и не включать текстовые логи без отдельного запроса.

Состояние: `systemctl status max-info-panel`, `journalctl -u max-info-panel`, публичный `/df/max-info-panel/__kdw/voice/status`. Сервис должен показывать configured=true, Vasilisa, warm-dual, endpoint512, logging.healthy=true; после закрытия клиента busy=false. Нативные окна VST наружу не опубликованы.

[Проверки и ограничения](verification-stela-web-20261022/README.md).
