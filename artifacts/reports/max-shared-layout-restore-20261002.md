# MAX: INVALID_SAVED_SESSION при cold-start — 02.10.2026

На пользовательском кадре отказ старта shared WebGL. Фактическое расхождение: commit принимал renderer:<id>:<mission>:<node>, load отвергал все ключи кроме open-max/canonical tasks. Исправлена одна проверка load: тот же validLayoutNode, что commit, без ослабления принадлежности узла/схемы/receipt/clock guards.

Новый shared-layout-restore.test.mjs воспроизвёл INVALID_SAVED_SESSION до исправления. Сценарий: публичный канал до public-link, Site/WebGL positions, подтверждённая пауза владельца, close, новый application+Browser PersistencePort над теми же JSON bytes. После исправления подтверждённый snapshot и исходные bytes совпали. Фактический browser storage пользователя не читался/не очищался; это воспроизведение пути, не анализ его private данных.

PASS:42 CPU/250мс (restore,mission logic,WebGL presentation); node --check; duplicate guard; изолированный build23 shared files/98 bundled modules. Два localhost GET200 совпали SHA с новым bundle/common application. Мастер/API не активирован/не перезапущен, браузер/GPU/публикация не запускались. Видимый запуск после обновления и сохранённый шаг подтверждает пользователь.
