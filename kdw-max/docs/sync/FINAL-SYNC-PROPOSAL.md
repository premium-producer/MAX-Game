# План восстановления ПК — применён 25.10.2026

Пользователь отдельно подтвердил весь перечисленный ниже план 25.10.2026. Применены5конфигураций и6служебных файлов;13проверенных конфликтных копий перенесены в архив с сохранением содержимого. Проверены42CAS-пути и полный состав8app-папок до записи; после записи все8пакетов совпадают с их манифестами.797защищённых файлов, кроме5одобренных app.json, сохранили SHA. Квитанция на ПК: .sync/archive/reconcile-20261025T141422Z/receipt.json. Следующее согласование общих исходников описано в [WORKSPACE.md](WORKSPACE.md).

## Пять конфигураций запуска

Восстановить только проектные различия из существующих копий, SHA которых совпадает с прежним манифестом. Остальные параметры, включая размеры окна/порт, сохранить и проверить до записи.

| Целевой app.json, относительно KDW-MAX на ПК | Проверенная копия рядом | Требуемый режим |
|---|---|---|
| apps/stela/app.json | app (3).json | production=true; восстановленный version label STAND-PRODUCTION |
| production/dev/apps/stela/app.json | app (3).json | production=false; version label STAND-PRODUCTION-DEV |
| production/dev/apps/max-game/app.json | app (2).json | production=false; view=pixel-map; прежние проектные version/v из эталона |
| production/startup-one-pc/max-game/app.json | app (2).json | production=true; view=pixel-map; прежние проектные version/v из эталона |
| production/startup-max/max-game/app.json | app (2).json | production=true; view=pixel-map; прежние проектные version/v из эталона |

В dev сохраняется отдельный режим разработки. В production остаются стендовые ограничения. Приватные настройки устройств, камер/микрофонов, голоса, сети и pairing не переносятся между ПК.

## Служебные файлы production/dev

Восстановить из копий, совпадающих с delivery-манифестом:

- apps/max-game/source/client/test/kdw-link-motion.test.mjs — утраченная проверка геометрии линков;
- apps/STARTUP/tools/sync-game-link.mjs — копирование stand-settings.cjs;
- ops/production-build/test-worker.cjs — проверочный сервер с production:true;
- README.md — актуальное описание dev/production и обновления.

Перенести из проверенного экспорта ещё два вспомогательных файла: apps/max-game/source/verify-device-morph.mjs и apps/max-game/source/verify-device-transitions.cjs. Изменение тестовой оснастки само по себе не запускает браузер, платные запросы или пересборку.

## Манифесты и резервные копии

Перед каждым изменением проверить текущий SHA против dry-run/CAS. При любом новом расхождении остановить соответствующую замену и повторно сравнить версии.

Все заменяемые файлы и дополнительные конфликтные копии сохранить в отдельном backup. Восстановленные app (2)/(3).json, две дополнительные SDK-копии и прежние app (4).js вывести из активных app-папок в backup без потери содержимого.

После проверки состава согласовать package-manifest затронутых приложений и delivery-manifest dev с фактическими проверенными файлами. Не переутверждать неизвестные изменения. Проверить все8активных app-папок, проектные build-input SHA, тесты основной игры/dev и сохранность приватных данных/runtime/VST.

Исходный Production Local Export, исторические releases, пользовательские data/private, runtime и VST не изменяются. Старые Git-checkout с незакоммиченной работой сохраняются отдельно от новых чистых копий.

Точные исходные SHA и причины: [.sync/proposal/applications.json](../../.sync/proposal/applications.json), [delivery-six.json](../../.sync/proposal/delivery-six.json), [dev-verification-sources.json](../../.sync/proposal/dev-verification-sources.json), [CAS](../../.sync/proposal/cas.json).
