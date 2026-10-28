# Фото full + avatar: production-MAX

28.10.2026 установлен PHOTO-VARIANTS-MAX-20261028-2 на max-game-pc (DESKTOP-64J4BMN), complete. Шесть файлов: async-link.cjs, game-link.cjs, portable-server.cjs, webgl-v5/app.js и две build-метадаты. Пакет 7690236 байт, передача 2,28 с; сохранено 11 настроечных файлов. Установка в 08:58:09 UTC+3.

MAX перезапущен; оба Spout-слоя готовы, armed/inputActive=true, админка HTTP200. Никакие тестовые посетители на стенде не создавались.

Использован изолированный bundle SHA256 3b1ce176e576774eeb2fe23581b9c98a6ac3a3bb32d005723777fe9b4031271e. Он восстановлен esbuild onLoad без изменения рабочих исходников: три файла геометрии сверены с inputs установленного RELATIVE-LAYOUT-MAX-20261028-1. Единственный изменённый input — kdw-game-link.mjs. Итоговый SHA точно совпал с ранее собранной фото-версией. Параллельные правки масштаба/анимации и TouchStart не вошли. Пакет -1 с общей более новой геометрией не устанавливался.

Скрипт изолированной сборки: .cache/build-photo-isolated.mjs; staging: .cache/photo-variants-isolated. Следующая установка должна учитывать этот plan.json после RELATIVE-LAYOUT-MAX-20261028-1. Резервная копия MAX на другом ПК и CHUWI не менялись. Физическое фотографирование/проверка нового посетителя после установки не выполнялись; локальные доказательства в docs/verification-stela-photo-variants-20261028 и verification-photo-transport-20261028.
