# MAX launch preview: применённые готовые механизмы

04.10.2026 · WAVE-03/C. Изолированный D-кандидат, технический DOM, не художественный GPU-рендер.

Этот срез продолжает [исследование отдельного runner](technical-renderer-runner-20261004.md) и использует его принятые ограничения из интеграционного опыта WAVE-02. Новых пакетов, брокера, собственного планировщика или транспорта команд нет. Anime.js4.5.0 (MIT) из vendor мастера интерполирует вращение, проявление и движение; существующий createMaxClient сохраняет команду до отправки и сверяет точный durable receipt. DBOS и launch checkpoints остаются у backend-агента.

Сверенные официальные API:

- [Anime seek](https://animejs.com/documentation/animation/animation-methods/seek/): восстановление конкретного времени с muteCallbacks=true, чтобы загрузка сама не повторяла семантические события.
- [Anime onComplete](https://animejs.com/documentation/animation/animation-callbacks/oncomplete/): callback завершённого воспроизведения, после которого DOM-адаптер ждёт два requestAnimationFrame перед локальным свидетельством представления. Такое свидетельство не является GPU/Spout presented.
- [Anime playbackRate/speed](https://animejs.com/documentation/animation/animation-playback-settings/playbackrate/): изменение скорости вращения без создания нового таймлайна при каждом ответе квиза.
- [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API): один технический MAX preview на origin, release при скрытии/уходе страницы. Это не арбитраж удалённых компьютеров или общих физических arch/ribbon outputs; он остаётся будущей задачей.

Композиция получает frozen launchPlan и checkpoint из backend, не определяет бизнес-фазы и длительности. Callback относится к instanceKey+bootId+assignmentId+planId+phase. Отправка дополнительно требует свежей доступной проекции, server elapsed>=duration и exact revision команды. Reload сверяет pending через существующий client; отказ не порождает цикл POST на той же подтверждённой проекции.

Теги квиза отображают только server tagsMax; выбранные проявляются, скорость растёт с числом видимых. Launch использует технический flight, затем те же object IDs на ленте и SCREEN_RIGHT. WhiteEntity=false. Эти координаты DOM не заменяют общий rear domain и физический crop; родной renderer должен подключаться следующим отдельным срезом.

Известные пределы: скрытая вкладка перестаёт представлять кадры; сервер сохраняет фазу и ожидает marker. Исторический v1 без launchPlan работает прежними техническими кнопками. Без Web Locks автоматика выключена. Реальные видеокарточки/QR/GPU/canonical game здесь не реализуются. Проверки: [отчёт](../../artifacts/reports/max-launch-ui-20261004.md).
