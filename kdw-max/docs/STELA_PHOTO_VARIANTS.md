# Stella → MAX: два варианта фотографии

Контракт 2026-10-28. Локальная реализация; установка на стенды отдельным запросом.

- Сначала существующий `POST /__kdw/link/v2/submit`, как сейчас.
- Два независимых `POST /__kdw/link/v2/photo`, `Content-Type: image/jpeg`.
- Общие заголовки: `x-kdw-session-token`, `x-kdw-game-id`, `x-kdw-revision` — тот же действующий контекст Stella.
- `x-kdw-photo-variant: full` (или отсутствие заголовка): JPEG 1080×1920, прежнее поведение.
- `x-kdw-photo-variant: avatar`: JPEG 512×512. Stella вырезает квадрат по сохранённому кругу из того же полного снимка; повторно не зеркалит. MAX накладывает круговую маску в аватарных слотах.
- Отправки не блокируют переход пользователя и повторяются независимо. Успех одного файла не считается успехом обоих.
- Ответы relay сохраняют прежнее `photoStatus` для full и добавляют `photos.full.status`, `photos.avatar.status`, каждый со своим `sha256` и `error`. Локальное принятие — `pending`, подтверждение MAX — `stored`.
- Внутренний relay → hub сохраняет `PUT /__kdw/link/v2/missions/{gameId}/photo/1` и добавляет тот же заголовок варианта. Hub сохраняет `photo` для full и добавляет `photos.full`, `photos.avatar` с независимым статусом/SHA.
- Одинаковый вариант и SHA можно повторять. Замена принятого варианта другим SHA — 409. Чужой/устаревший session context отвергается; варианты не переносятся между посетителями.
- MAX использует full только в полноформатных слотах, avatar в аватарных. Legacy full-only поддерживается прежним кропом; поздняя avatar заменяет его без перезапуска миссии.
- Отмена, завершение, TTL и retention очищают оба варианта. Базовый TTL и допуск late arrival в действующую игру сохраняются.

Реализовано локально: общий transport, MAX, сборка shared и MAX. Проверка: 22 теста общего транспорта PASS; headless Chromium с настоящими JPEG подтвердил позднее обновление аватарки без reload, прозрачные углы круговой маски и независимый полный кадр. Отчёт: `verification-photo-transport-20261028/README.md`.

Stella UI/capture реализуются отдельно; файлы PhotoScreen/PhotoCamera/PhotoGuide/use-photo-guide-tracking/use-omni-prototype в этой части работы не изменялись. Сборка MAX: `3b1ce176e576774eeb2fe23581b9c98a6ac3a3bb32d005723777fe9b4031271e`. Полная проверка двух запущенных приложений и физической камеры остаётся отдельной приёмкой. Стенды не обновлены.

Новые файлы transport/MAX для регистрации в sync (paths.json этой частью работы не редактировался):

- `docs/STELA_PHOTO_VARIANTS.md`
- `docs/verification-photo-transport-20261028/README.md`
- `docs/verification-photo-transport-20261028/browser.json`
- `docs/verification-photo-transport-20261028/tests.log`
- `ops/audit-fixes/max-photo-variants.mjs`
