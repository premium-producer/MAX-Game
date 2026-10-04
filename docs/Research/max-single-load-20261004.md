# MAX: один запуск и ограниченная подготовка ресурсов

04.10.2026. Действующий Three.js 0.185.1 (MIT), browser History API, существующие ImageLoader/LoadingManager и текущий/prepareNext путь. Новых зависимостей и отдельного менеджера кэша нет.

## Подтверждённые основания

- [Three.js Texture](https://threejs.org/docs/pages/Texture.html): штатные dispose, generateMipmaps и LinearFilter. Освобождение GPU не равно освобождению DOM Image.
- [Three.js memory](https://threejs.org/manual/pages/textures.html): память зависит от размеров растеризованной текстуры, а не размера PNG в сети.
- [Disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html): ресурсы освобождаются явно; материал и его texture имеют разные жизненные циклы.
- [Реальный опыт iOS](https://discourse.threejs.org/t/issues-with-complex-scene-on-ios/46356): тяжёлая сцена может завершить вкладку Safari; небольшой download не доказывает небольшой расход GPU. Это не доказательство причины конкретного падения пользователя.
- [History.replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState): меняет URL текущей записи без навигации и перезагрузки документа; URL должен оставаться того же origin.

## Решение

Убрать location.assign/replace при переключении карточек manual/automatic. Сохранить renderer и загруженную оболочку; поменять только существующую backend-сессию с отдельной MemoryPersistence демонстрации и IndexedDB обычной игры. Поздние callbacks фильтруются идентичностью сессии и epoch, pagehide отменяет незавершённое переключение.

Не декодировать и не закреплять все 70 экранов в startup. Оставить 20 изображений оболочки, два splash-размера и иконки. Первые экраны выбранной миссии готовить на этапе ладони, затем использовать существующий current/prepareNext. Texture.dispose применяется штатным renderer при освобождении неиспользуемых экранов. Растер экрана соответствует drawing buffer, ограничен 2048 по длинной стороне вместе с padding, без mipmaps.

Это исключает повторную полную подготовку между миссиями, но не обещает офлайн-проход или отсутствие ожидания при недоступной сети. Браузер управляет HTTP/decoded image cache; полного предварительного скачивания каталога, Service Worker и offline cache в этой итерации нет. Готовность изображения и GPU по-прежнему обязательна перед ответом/автотаймером.

[Проверка](../../artifacts/reports/max-single-load-20261004.md) · [Контракт](../../apps/max-game/docs/ASSET_LOADING.md).
