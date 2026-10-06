# MAX на стенде: текущее решение и подключение — 05.10.2026

Read-only аудит F-кода и свежие компактные SSH-проверки MAX_RIGHT/MASTER. Основной агент владел удалёнными чтениями; независимый агент сверил код и границы интеграции. Приложения не перезапускались, игровые команды/назначения не отправлялись, ключи и БД не читались. Опрос root UI запрашивает текущее ролевое назначение через штатный binding, игровой браузер не запускался.

## Что принято

WAVE10 перенёс визуал и ассеты standalone MAX-Game из коммита `3cf476f70cde11f2cbd7814f7f02a26b90fca3a4` в managed MAX. Источник: F `artifacts/reports/wave10-integration-20261005.md`. Мастер сохраняет очередь/назначения, canonical MAX и SQLite сохраняют игровой прогресс; renderer получает snapshot через ServerSessionPort. Standalone автомиссии и бесконечный видеофинал в принятой стендовой адаптации выключены; звук default off. Текущий contentRevision — `missions-reviewed-20261003-abe878cfed89`.

```text
MAX_RIGHT: WebGL V5 → localhost9573 Node proxy
                  → LAN HTTPS/mTLS → MASTER9568 gateway
                  → MASTER canonical MAX9570 / SQLite
MASTER9569: сценарный backend / DBOS / очередь / назначение
MAX_RIGHT: отдельный native renderer9576 → Spout фон
```

## Свежая площадочная проверка

| Узел | Подтверждено |
|---|---|
| MAX_RIGHT | UUID6a8a4e42-437b-4fd4-a363-d2fb155db83b; DESKTOP-64J4BMN/dr7; LAN10.0.0.13; release C:/VKStand/releases/stand-base-20261005-r1/MAX_RIGHT |
| MAX UI | Node18424/Session1; 127.0.0.1:9573; root GET200, страница ожидания/восстановления, активного назначения в ответе нет |
| MAX renderer | Electron19612/Session1; 127.0.0.1:9576; наличие процесса не подтверждает игровой кадр |
| MASTER | UUID066c1c43-8266-4a86-885e-4d2855d91546; DESKTOP-27LJLV6/futuronika-setup; LAN10.0.0.92 |
| MASTER сервисы | gateway9568 и health9560 на0.0.0.0; backend9569 и canonical9570 на127.0.0.1; backend /health GET200 |
| Версии | Пять MAX файлов и два MASTER файла совпали SHA256 с F/artifacts/releases/prod-integration-wave10-20261005 |

Это точечная сверка, не полный повторный аудит всех ассетов. Время в отчёте взято с управляющего ПК: remote MASTER timestamp отличается примерно на7 часов, поэтому не использовался как источник времени проверки.

## Подключение

На самом MAX_RIGHT открыть `http://127.0.0.1:9573/`. При активном назначении root перенаправляет на `/max-game/webgl-v5/index.html?backend=server&assignment=…&session=…`. При отсутствии назначения показывает восстановление/ожидание. ID не нужно придумывать вручную; `backend=local` не является режимом площадки.

С другого ПК адрес `http://10.0.0.13:9573/` не доступен: UI привязан к loopback, проверяет точный Host и Origin. Удалённый просмотр — браузер на desktop MAX_RIGHT либо штатный OpenSSH local forwarding `управляющий127.0.0.1:9573 → MAX_RIGHT127.0.0.1:9573`. Нужен свободный местный9573; URL также именно127.0.0.1:9573. Туннель этой задачей не создавался. Браузер с игрой может отправлять receipts/ввод в настоящий сценарий и не является пассивным просмотрщиком.

SSH/SFTP — закрытый Producer Kit Local, Windows PowerShell5.1:

```powershell
$fleet = 'D:/job/production/BUSINESS/PRODUCER-KIT/workspace/producer-kit/Local/fleet.ps1'
& $fleet -DeviceId '6a8a4e42-437b-4fd4-a363-d2fb155db83b'
# Для SFTP добавить -Files; Selectel основной, CloudCore резервный.
```

Порт обратного туннеля берётся из свежего реестра, UUID/host pin проверяются. Штатный fleet может обновлять локальные ACL/pin; аудит использовал существующий pinned OpenSSH без этой части. Документ не содержит реквизитов. Браузер получает локальный player token; mTLS ключи остаются в Node host.

## Границы готовности

Игра пока не скомпозирована в Spout MAX_RIGHT. Код role-application.mjs явно разделяет handles UI и фона. Последний отдельный native монитор подтвердил4096×1282/60FPS фон; crop служебных2строк даёт4096×1280. Не подтверждены этой задачей физические LiDAR/LED, появление игры на стене и полный проход миссии. Browser presented возвращает browserPrepared=true,physicalPresented=false и требует GPU evidence, поэтому загрузка страницы не засчитывает физический показ.

При потере MASTER текущий clock TTL может закрывать renderer; автономность/HA ещё не реализованы. Статический отдельный риск local-dev8782/8783: обновлённый UI требует /bridge/context, а canonical managed-host.mjs его не содержит; production MAX adapter содержит. Это расхождение не воспроизводилось и не исправлялось в read-only аудите.

Главные источники: F/docs/STAND_ACCESS.md; F/artifacts/reports/wave10-integration-20261005.md; F/releases MAX local-server.mjs/request-policy.mjs/max-binding.mjs/role-application.mjs; D/artifacts/reports/stand-gpu-launch-20261005.md. F и пользовательские данные не менялись.

[Свежая проверка MAX](../workspace/tasks/max-current-audit-20261005/max-live.json), [MASTER](../workspace/tasks/max-current-audit-20261005/master-live.json), [сверка SHA](../workspace/tasks/max-current-audit-20261005/sha-comparison.json).

Трафик SIM: RX ≈0.010348 МБ payload команд; TX ≈0.004108 МБ payload ответов; всего ≈0.014456 МБ учтённого payload; учёт: оценка; основание: два коротких pinned SSH-опроса через Selectel 05.10.2026, 04:42–04:43 UTC+3, длины команд/ответов, WAN и SSH overhead не измерены; остаток: неизвестен. Ответы реестра управляющей стороне ≈0.006766 МБ отдельно, маршрут через SIM не подтверждён. Исходные ≈150 ГБ — сообщённая оценка, неизвестные параллельные расходы не позволяют считать остаток достоверным; прежние передачи повторно не списываются.
