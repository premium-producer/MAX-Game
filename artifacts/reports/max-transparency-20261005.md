# MAX: миссия поверх фона стенда — 05.10.2026

Исправлено и установлено на MAX_RIGHT (DESKTOP-64J4BMN). Пользователь обнаружил дефект предыдущей MAX-SHOW-01: миссия закрывала общий фон.

Причины: непрозрачные html/body/main в max-show/show.css, inline body/#managed-status в managed webgl-v5/index.html и Chromium canvas страницы с :root color-scheme:dark. WebGL уже alpha:true, scene.background=null, clear alpha0; самостоятельный ambient отключён для managedAssignment.

Исправлены только show.css, managed index.html и accepted-source.json. Подложки прозрачны, поздний :root{color-scheme:normal} перекрывает исходный :root. Для #videos сохранена отдельная тёмная подложка. JS игры, backend, миссии, фон LumiCells и видео не пересобирались.

## Проверка

- Actual local backend9500/canonical9501 + реальные wrapper/game9520: миссия с видимыми иконками поверх шахматной подложки. Root осмотрел снимок; html/body rgba(0,0,0,0), scheme normal. Это проверка композиции в браузере, не фото LED.
- [Снимок](../workspace/tasks/prod-integrator/artifacts/max-show-20261005/transparency-fix/mission-transparent.jpg).
- Первая попытка html{color-scheme:normal} не перекрыла более специфичный :root; ошибка выявлена браузером и устранена до применения.
- В браузерной сессии замечены две ошибки MutationObserver; происхождение не установлено, console0 не заявляется. Сценарий и отрисовка работали. Изолированные QA процессы остановлены, данные сохранены.
- Duplicate guard PASS. Remote исходные SHA совпали с принятой F-версией. Три файла применены с CAS и резервом config/max-transparency-before-20261005; root manifest и accepted PIN совпадают, реальный HTTP отдаёт новую CSS.
- Перезапущена только роль MAX_RIGHT. Launcher exit0/ready, новый bootId e5301aaf-c542-4476-854a-e5086038e247. По свежему producer log Spout sending, 4096×1282, примерно60fps, dropped0. Независимый receiver и LED в этой короткой итерации не проверялись.
- Принятая F production-source-max-show-20261005 обновлена, provenance/резерв сохранены. MASTER, Стелла, VK_LEFT и арка не перезапускались; пользовательские сессии не отменялись.

## Статус

Техническое применение PASS. Браузерная самопроверка прозрачности PASS. Проверка владельцем на физическом стенде OPEN. Ошибки MutationObserver требуют отдельной локализации при воспроизведении.

Трафик SIM: RX ≥0.100596 МБ файлов; TX не измерено; всего не измерено; учёт: оценка; основание: три маленьких SFTP stage32917+32942+32943байт и apply1794байта через Selectel, дополнительные служебные PS/команды/ответы/overhead не измерены; остаток неизвестен. Локальные QA и копирование F не списываются. Единственный учёт этой итерации — запись D/WORKLOG, здесь ссылка на тот же объём, не дополнительный расход.
