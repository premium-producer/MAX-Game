# WAVE-08/A — свежая презентация Стеллы на серверном VK-квизе

04.10.2026. Исполнитель ST-1/ST-2: `parallel_backend_plan`; root — backend copy projection, изолированная browser fixture, интеграция и общие документы. **Технически собрано; browser/визуальная приёмка ожидает root. F не применён этим агентом.**

## Источники и границы

- Кандидат: `artifacts/workspace/tests/parallel-wave8/stella-candidate`; SHA-изоляция, **не Git worktree**. Скопированы199 файлов принятого WAVE-03 source без node_modules/dist/cache/runs. `parallel-wave8/stella-baseline.json` фиксирует исходные SHA; повторная проверка подтверждает сохранность WAVE-03.
- Принятый source: `artifacts/workspace/tests/parallel-wave3/stella-candidate` — его server MasterSlice, projection, station ownership, pending namespace и completion fences сохранены.
- Визуальный источник: `artifacts/workspace/tasks/stella-voice-v1/artifacts/stella-prototype` (5196), прочитан без изменений. Его локальные Prototype/scoring/events/voice/camera не перенесены в master-mode.
- Транспорт: побайтная копия **текущего F WAVE-07** `panel-client.mjs`; новые durable механизмы/протоколы не создавались. Старый sessionStorage namespace сохранён.
- Backend/UI-сервера этим агентом не запускались; live8782,5196, камера, mic, платные API, F/SQLite не затрагивались. `node_modules` — readonly-use junction к существующей `artifacts/stella-prototype/node_modules`, installs/lockfile changes нет.

## Что вошло

| Часть | Результат |
| --- | --- |
| Главная | Перенесена точная optical logo CSS из5196. Старые RingActions/touch и server admission сохранены; voice registration не импортирован. |
| Onboarding | Удалена отвергнутая декоративная иллюстрация с сердцем. Master продолжает скрывать обещание неподключённого голоса. |
| Вопросы/reveal | Исходная хореография совпадает; сохранены master-only authoritativeCopy/interactive/backEnabled. Перенесён безопасный disabled на уходящей карточке. Текст ответа берётся с сервера, локальная таблица не подменяет drive label. |
| WhiteEntity | Перенесён актуальный presentation component с optional controlled envelope. Renderer/config по сравнению с5196 совпадают, кроме прежнего локального vendor import. Master явно задаёт generationDurationSeconds=6; reduced-motion прежние1.6с. Новые7с не включены. ControlledActive/onHidden не используются как бизнес-ACK. |
| Copy и layout | Final/Discovery читают optional `view.presentationCopy` от замороженного определения; старый `view.title/notice` остаётся fallback. Root отдельно обновляет copy/version новых admissions. Позиции/размеры текста взяты из5196 revision-seven.css. |
| QR результата | Вместо статического Discovery asset в master-final выводится настоящий SVG QR exact package resultPath и кликабельная ссылка. Encoder — уже pinned F qrcode-generator2.0.4. Foreign resultPath не рендерится. Указано, что ссылка локальная; public hosting/доступ телефона не заявлены. |
| Station/presentation | `presentation_complete` принадлежит actual AnswerFlight/PhotoReveal/WhiteEntity callback Стеллы. Runner не подтверждает его за UI. Final не освобождает станцию; следующий посетитель доступен только после backend canStart. |

Обновлён только тип optional `presentationCopy`; бизнес-версии и старые snapshot payload не меняются. Camera accept по-прежнему честно ведёт к fallback/skip. Фото capture/review/образ/upload/generation остаются отдельному владельцу **STELLA-PHOTO-AUDIT-13**. MAX master UI и voice CommandPort не начаты.

## Готовые механизмы и provenance

Использованы прежние React19, Motion13.5.0, Vite8.3.1, Vitest5.0.2, LumiCells и pinned panel-client. QRCode2.0.4 MIT выполняет собственно encoding, новый QR-алгоритм не написан. Обоснование/официальные ссылки/overflow case уже зафиксированы в [исследовании renderer](../../docs/Research/typed-renderer-capabilities-20261004.md). Exact F QR source SHA `ea91d7118a5395289170da848b7c6758b996163bfbccf312591ab65a4911b7c0`, metadata и MIT license сохранены; license также попадает в dist. React/Motion/Howler notices сохранены. LumiCells upstream UNLICENSED с пользовательским разрешением на код коллеги; брендовые ассеты сохраняют свой provenance и не объявляются общедоступными.

SVG получает только результат доверенного encoder, не backend HTML. URL проверяется по packageId, same-origin и допустимому DEV prefix. Неподдержанный или чрезмерно длинный QR показывает ошибку вместо неверного результата.

## Проверки

- TypeScript PASS.
- Scoped ESLint изменённых TSX PASS.
- Node **7/7 PASS**: current transport all questions, lost accepted response→reload receipt, stale/duplicate completion, instance/dispose, protocol/storage failure; QR exact package binding, foreign URL rejection, existing DEV proxy, actual encoder overflow.
- Vitest **22/22 PASS**: polling/reveal identity, настоящая BrandSplash под polling; pause/stale/foreign station не владеют прежним callback; final/next visitor; frozen copy/legacy fallback/QR mismatch; WhiteEntity lifecycle/readiness/hidden/error/dispose и сохранение master timing6с/reduced1.6; прежние product-entry transitions. GPU в компонентных тестах mocked — это не визуальное доказательство.
- Duplicate guard PASS перед сборкой.
- Production build PASS:59 dist-файлов. Существующее предупреждение bundle >500kB сохраняется, не скрывается.
- Первый Vitest `configLoader runner` встретил `require is not defined` на picomatch при node_modules junction; `native` loader корректен. Sandbox fork получил spawn EPERM; адресный разрешённый запуск тестов/сборки прошёл. Это инфраструктурные попытки, не положительные тесты.

Команды из candidate:

```powershell
node node_modules/typescript/bin/tsc -b --pretty false
node --test --test-isolation=none tests/slice-client.test.mjs tests/result-qr.test.mjs
node node_modules/vitest/vitest.mjs run src/features/master/MasterSlice.test.tsx src/features/master/presentation.test.ts src/features/master/PhotoReveal.test.tsx src/components/WhiteEntity.test.tsx src/features/prototype/product-entry-flow.test.tsx --configLoader native
node node_modules/vite/bin/vite.js build --configLoader native
& 'F:/project/VK_DigitalProducts_Stand/artifacts/backend-probes/quiz-panel/.venv/Scripts/python.exe' tests/make-manifest.py
```

## Передача и приёмка

[Source manifest](../workspace/tests/parallel-wave8/stella-candidate/source-manifest.json) содержит все SHA, exact changedFiles allowlist, visual inputs и read-only external dependencies. SHA `4ced2ee15ea68623fbe1f36037f39cf5e1a130b3fd5d9fbe78a71e3171af9e9e`.

[Build manifest](../workspace/tests/parallel-wave8/stella-candidate/dist/build-manifest.json): SHA `4996056bfef49625e321f64372ab7ad98d780628dc2b7689e3dd6cd8634c6014`. Entry `/stella/?master=1`, same-origin API; optional DEV5218 `/master-api` к root-назначенному fixture backend. Сборка готова для static host, запуск Vite не обязателен.

Root переносит **только exact dist allowlist** в свою изолированную master fixture; не node_modules/tests/source/SQLite. Самостоятельный rebuild от source должен повторно сверить внешние SHA. Общие D runtime и F не обновлялись, Git config/commit/push нет.

Критерии короткой browser-приёмки:

1. Главная: одинаковый видимый размер знаков; onboarding без сердца и неподключённого voice promise.
2. Три server questions/reveals: новый drive текст только у нового frozen config; reload/Back не создаёт второго ответа.
3. Accept→honest camera fallback→skip; никаких camera/provider запросов. Либо прямой skip.
4. WhiteEntity показывается/скрывается, после actual completion появляется final; не утверждать7с, master остаётся6с.
5. Полный frozen final текст/направление читается без наложения на QR; QR и ссылка относятся к тому же packageId, result доступен, нет синтетических генераций.
6. Другая сессия/отмена/reload не отправляет устаревший presentation ACK; консоль без ошибок.

До фактического кадра статус визуальной самопроверки **OPEN**; художественная приёмка — у пользователя. Фото/provider/public result и полноценный MAX UI этой передачей не закрываются.
