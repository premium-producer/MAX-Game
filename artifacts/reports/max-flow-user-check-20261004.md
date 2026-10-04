# Проверка пользовательского экспорта MAX — 04.10.2026

Источник: C:/Users/futuronika_ai/Downloads/max-asset-flow-2026-10-04.json, SHA256 e81fda1b5a0ef9fd52a6bc248421b7076ba651a754b9660278e491bfa4f2690b, экспорт2026-10-04T05:41:42.563Z.

GET https://futuronika.pro/df/max-asset-audit/editor/api/max-asset-flow полностью совпадает с файлом после исключения служебных exportedAt/revision. Serverrevision7bd7389df7dd3532edf0991c9f8a87cba57bf4ed8a5735557543488042d44801;15заданий84экрана,50зон41кнопка5таймеров. [Сравнение](max-flow-user-check-20261004/comparison.json).

Root проверил сервер; независимый read-only verify_user_flow проверил существующим validator draft/publication и сравнил с миграцией исходных73records/33settings. Ровно два изменения: в blogger.channel.chats добавлены enabled зона rect[241.15,224.14,225.96,98.56] и внешняя «Новая кнопка», обе target blogger.channel.menu. Остальные данные идентичны baseline. Draft PASS; изменённое задание blogger.channel publication PASS.

Полный publication пока FAIL:8/15заданий содержат прежние ссылки на отключённые экраны (первые причины: blogger.comments.sent;digital-id.create-id.redirect;communication.call.calling;communication.message.voice-recording;communication.story.publish;business.channel.ready;business.bot.details;business.store.connect). Это уже присутствует в migratedbaseline и не вызвано двумя новыми правками. Перед интеграцией игровогоv3 необходимо согласовать маршруты вокруг отключённых экранов; автоматический обход валидатор не угадывает.

IAB вновь не открыл liveURL: ERR_BLOCKED_BY_CLIENT. Видимое отображение на сайте в этой проверке не подтверждено. Данные сохранены и валидны для редактора. Новыеv3 переходы ещё не подключены к игровому runtime, что подтверждается текущим build-webgl-v5-runtime и контрактом ASSET_AUDIT. На live не делалось POST/import/редактирование; локальная разметка, код, runtime и F не изменялись.
