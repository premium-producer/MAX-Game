# MAX BFM — исправление подготовки экрана

03.10.2026. По пользовательскому скриншоту и трассировке исходника найден decode прямо внутри inert template.content. Добавлен document.importNode перед подготовкой изображений; сохранены abort/timeout и ожидание готовности до замены кадра. Ошибка теперь также пишет screenId/name/message в console для диагностики.

Подключён существующий server SessionPort с авторизацией Stand Service, параметром session и default site-shared для серверного режима. Локальный профиль и его сохранения сохранены; fallback не добавлен. [Обоснование](../../docs/Research/max-bfm-template-decode-20261003.md).

- PASS: syntax изменённых модулей, duplicate guard.
- PASS: 18 тестов bfm-start, bfm-missions, shared-server-session; сетевые тесты — изолированный HTTP API, не работающий мастер.
- Собрано: 83 модуля, 350298 байт JS; 4 runtime-файла получены через localhost:8770 и SHA совпали. [Данные](max-bfm-decode-fix-20261003.json).
- Live сервер: GET /api/max-game/v1/catalog и /sessions/bfm-start-preview → 503 MAX_BACKEND_DISABLED. Серверное прохождение в действующем Stand Service НЕ проверено и сейчас недоступно.
- Браузер не открывался; CPU decode test не доказывает браузерное декодирование. Пользовательская приёмка ожидается.

Проверка пользователя: обновить /max-game/bfm-design/?backend=local&layout=wall, начать блогера, дождаться телефона и нажать «+». Серверный маршрут /max-game/bfm-design/?backend=server&layout=wall&session=site-shared подготовлен, но требует отдельного включения backend в мастере. Мастер, TD, фон, клиентский контент и другие визуализации не менялись.
