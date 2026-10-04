# MAX BFM — template, decode и серверный профиль

03.10.2026. Пользовательский скриншот: раскрытие завершается сообщением «Экран не загрузился».

В коде decode вызывался у img в template.content. Это отдельный неактивный Document: [MDN content](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement/content). [HTML Standard decode](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-img-decode) требует отказа при не полностью активном документе. Исправление — штатный document.importNode(template.content, true) до decode, сохраняя фрагмент вне видимого DOM до готовности. Используется браузерный API, нового пакета/лицензии/самописного загрузчика нет. Применимость: действующий Chromium/Electron; фактический браузер пользователя в этой итерации не запускался.

Реальный опыт здесь — пользовательский сбой текущей интеграции. Прежние HTTP/SHA и CPU-тесты проверяли ресурсы и команды, а decode был подменён Promise: они не покрывали активность ownerDocument. Поиск отдельного issue с точно таким сочетанием не дал релевантного результата; доказательство ограничения — стандарт, а не найденные посторонние ошибки EncodingError. Устранение установленного нарушения не выдаётся за подтверждённую пользовательскую приёмку.

BFM раньше принимал только backend=local, хотя применял общее ядро. Подключён существующий createServerSessionPort (тот же, что у Site), включая X-VK-Token и session=; серверный default site-shared. Нет локального fallback. Live API вернул 503 MAX_BACKEND_DISABLED: это отдельная причина недоступности серверного режима, не причина отказа локального decode. Мастер не активирован и не перезапущен.

[Проверка](../../artifacts/reports/max-bfm-decode-fix-20261003.md).
