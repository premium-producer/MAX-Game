# Пиксельная Стела без фото, 22.10.2026

**Опубликовано:** [отдельная страница](https://futuronika.pro/df/max-info-panel/pixels-no-photo/), release `39316d49180adca07c6f`. По запросу пользователя фотографирование полностью исключено из этого варианта. Пиксельный фон фиксирован; выбор любой миссии сразу открывает итог. Прежние переходы выбора, кнопки, Qwen Vasilisa, inactivity и серверные VST сохранены.

Вариант задаётся атрибутом отдельного HTML. Frontend передаёт skipPhoto при создании сессии; экспортированный контроллер выдаёт result до публикации состояния, с одним увеличением revision и пустыми photo metadata. Флаг photoEnabled=false входит в авторитетное состояние/контекст Qwen; policy не предлагает фото. Основная страница и ?background=pixels сохраняют фото. Desktop controller/gateway/frontend/www не редактировались.

Проверено:

- [Модель/голосовой шлюз](test.json): оба режима, четыре миссии, revision/dedup/back/repeat, запрет photo-команд на результате; mock голосовой выбор intro→result и аудиопродолжение без промежуточного photo. План результата без вопроса/предложения фото.
- [Опубликованный UI в Firefox](browser.json): PixelScene renderer ring/ready, четыре прямых результата/back, **0 запросов камеры**, ни одного photo state, 0 browser errors. Оригинальный пиксельный URL по-прежнему открывает photo. Просмотрен [скриншот результата](result.png).
- [Реальный Qwen](qwen-check.json): существующий synthetic visitor-business.wav через input VST → модель → business-promotion/result → Vasilisa/output VST. Состояния intro/result;31 аудиочанк,495360байт; решение1.55с, первый audio4.52с;172 FX frame, max RTT110.98мс при лимите350мс. Новые ручные WAV не создавались.
- [Публикация](deployment.json):157 файлов проверены по SHA; предыдущий release и immutable assets сохранены. Caddy routes/service unit и приватные config/full presets не изменились. Переключение current и перезапуск только max-info-panel с проверкой отсутствия активной сессии; откат к предыдущему current предусмотрен.
- Аудиохост/плагины/CRT/manual recordings:56 файлов побайтно прежние; [Gitleaks](gitleaks.json) —0утечек. Пересчитан только manifest Стеллы, затем check PASS1501файл. Игра и пользовательские данные не редактировались.

Исполняемые проверки и одноразовый deploy script: `ops/stela-web-no-photo-20261022`. Сборка — текущий `apps/stela/source/export-web.mjs`, вариант контроллера — `source/web/controller.cjs`. Непубличные ключи/пресеты не входят в отчёт. Физическая акустика/микрофон и нативные UI VST заново не проверялись; серверная обработка подтверждена протокольным тестом. [Каноническое описание](../STELA_WEB.md).
