# WAVE-03/C — MAX launch UI

04.10.2026. Кандидат: `artifacts/workspace/tests/parallel-wave3/max-master-candidate`. В F не применён агентом. Root владеет маршрутами/app.py, B — backend/launch settings. Общие документы обновляет root.

## Срез

Пять UI-файлов: max.html/max.css/max.js, новые max-launch-client.mjs/max-launch-renderer.mjs. Technical MAX page показывает прозрачные теги квиза, постепенное проявление принятых ответов и более быстрое вращение. После назначения проходит tags → ribbon → SCREEN_RIGHT. На правом экране те же object IDs и labels; копии на ленте затухают. WhiteEntity=false, VK Discovery не изменён. После доставки миссии арка независимо показывает новый active/paused MAX-квиз, пока прежняя миссия остаётся справа; отмена нового квиза не стирает прежнюю миссию. Активный launch сохраняет владение аркой, queued assignment сам не воспроизводится.

Автоматика запускается явно, default off; значение запоминается в sessionStorage для данного instanceKey. Web Lock ограничивает владельца технического MAX preview одним окном данного origin. Никакой команды квиза, касания или старта gameplay автоадаптер не отправляет. После пролога остаётся явный existing presented. Production/GPU или распределённое владение поверхностями не заявляются.

Anime.js4.5.0 ведёт кадры. Backend сохраняет фазы и elapsed. Completion и muted seek на завершённый рубеж сначала рисуют frame и ждут два RAF; контроллер проверяет current phase, assignment, plan, boot, paused/fresh/available, elapsed и revision. Pending команды продолжают храниться старым клиентом с точными ID. На одной и той же отклонённой проекции нет бесконечного POST retry.

## Проверки

`node --check` трёх JS/MJS — PASS. `node --test --test-isolation=none artifacts/workspace/tests/parallel-wave3/max-ui-tests/launch.test.mjs` — 10/10 PASS:

1. Off/paint/elapsed/fresh gating; exact marker body.
2. Старые callbacks phase/assignment/boot не проходят; pause/off/stale не продвигают.
3. Pending блокирует новую команду; новая revision допускает восстановление после CAS refusal.
4. Правый output, отсутствие white entity, unknown entity kind fail closed.
5. Фактический Anime seek + два RAF; stale-phase callback снят.
6. Off/paused snapshot рисуется без ACK.
7. Те же IDs с ленты попадают на правый экран и сохраняются после delivery.
8. Reload existing MAX client сверяет exact saved receipt без нового POST.
9. Новый квиз использует свободную арку при занятом правом экране; pause/cancel не меняет DOM прежней миссии.
10. Новый квиз не отнимает арку активного launch; queued квиз не запускает queued launch.

Отдельные процессы/БД/порты C не запускались. Backend HTTP/restart проверяет B; короткий IAB прогон на8844 выполняет root. Root сообщил PASS первого полного пути MAX; расширенный случай второго квиза при занятой миссии передан ему на повторную визуальную проверку. Пользовательская художественная приёмка OPEN. Это техническая схема, не попытка совпасть с материалом живого стенда.

Исследование: [готовые механизмы](../../docs/Research/max-launch-technical-preview-20261004.md).

## SHA-256 UI-кандидата

| Файл | SHA-256 |
|---|---|
| max.js | a73723e387576bd2336bcaf2007dfb38a82a7549f5ccea14978b2130144c0466 |
| max.html | a0868c6663987af8bf8c3bbaa431cd7b0cacc9112e4a0b927a05866f7e0611f7 |
| max.css | e200bc9baa8df0a1b56ba074c97537ee21af837ce2525a0a7b7b6091d40f1e0b |
| max-launch-client.mjs | 6f21b2c0d8c1ada84026f929db7ac2ce408b1be44034a0c5d37bb5c1f4a38b12 |
| max-launch-renderer.mjs | c2a7dfb3c77fd1d5618462e3e00fbca0a4623afa78e63af1584d44796d0a349e |
