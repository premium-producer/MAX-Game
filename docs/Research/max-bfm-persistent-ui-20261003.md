# MAX BFM — постоянные панели и native View Transitions

Уточнение интеграции после отзыва: root snapshot захватывает также opaque page fill, поэтому он должен быть ниже отдельного background group. Текущий порядок root0/background1/stage2/HUD100+/debug200+. Простое поднятие UI без этого условия скрывало фон. [Фактическая проверка обычного перехода](../../artifacts/reports/max-bfm-background-layer-20261003.json).

03.10.2026. Готовый механизм — браузерные View Transitions из BFM-DESIGN-ENGINE. Vendor upstream-transition.css задаёт HUD group z-index100, old opacity0, new opacity1/animation:none. Адаптация потеряла высокий слой; debug остался в root snapshot, рамка — в dissolve сцены.

Официальная [документация Chrome](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions) описывает перекрытие fixed UI document-scoped pseudo-tree и готовый workaround: отдельное view-transition-name overlay. [CSSWG issue8941](https://github.com/w3c/csswg-drafts/issues/8941) фиксирует реальный опыт нарушения paint order и управление им через z-index псевдогрупп. Здесь применён этот браузерный механизм и готовый BFM HUD, без нового solver.

Element-scoped API Chrome147+ позволяет изолировать subtree, но в этой короткой совместимой правке JS/host requirements не меняются. Сохраняется feature detection/fallback. Snapshot постоянного UI временно замораживает содержимое; это не live DOM. Отдельные имена без явных group layers не гарантируют порядок. Штатное скрытие timer в menu/finish отличается от исчезновения всего UI и не отменяется.

Версии: BFM SHA закреплён provenance.json; установленный esbuild0.28.2/MIT — только сборка/парсер. Native API без новых пакетов. Частному BFM не приписывается открытая лицензия; перенос разрешён владельцем. Документация не копировалась в runtime.

[Проверка](../../artifacts/reports/max-bfm-persistent-ui-20261003.md). Нужна приёмка промежуточных native кадров; финальный кадр/Node этого не подтверждают.
