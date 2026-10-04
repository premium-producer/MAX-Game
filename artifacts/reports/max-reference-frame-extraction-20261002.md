# MR-01: извлечение подготовки кадра — 02.10.2026

Первая итерация принятого плана. Механика сохранена: прежние springs, drift, carry, fixed palm и solver; следующие исправления не смешаны с извлечением. В journey-webgl-ui.mjs остался адаптер измерений: id/owner/role, layout, размеры плитки/подписи, pointer flags, presence и препятствие-device. journey-reference-frame.mjs содержит тот же prepass, который теперь вызывается тестами.

Диагностика ReferenceStartTrace ограничена180 кадрами, в renderer включается только motion-debug=1. В console.debug выдаются переходы phase/contact и duplicate IDs с run, позами, alpha, velocity и числом наблюдавшихся подтверждений scan. Восстановленный scanned snapshot не считается новым hold. Пользовательские сохранения не экспортируются и не сбрасываются.

Проверки: syntax,27/27 reference-frame/reference-presentation/webgl-shared-reveal tests. В новом наборе реальный Session application проходит SELECT_MISSION, ранний отпуск, повторный hold, однократный scan и появление иконок. Кадры рассчитываются настоящим IconMotion и общим prepareReferenceFrame на30/60/120Hz. Проверены конечные числа, уникальные ID, нулевая collision-коррекция ладони и сохранение исходной точки контакта внутри её bounds. Это не проверка абсолютной неподвижности: прежний bob пока сохранён.

Граница доказательств: размеры и DOM flags поданы измерительными fixtures; браузерная сборка DOM, pointer capture и GPU не запускались. Полный пользовательский дефект не воспроизведён; MR-01 не закрыт. У пользователя запрошено уточнение, на какой фазе остаётся сбой. Ограничитель пересечений и alpha-gate по-прежнему имеют замечания аудита — исправление будет отдельными итерациями.

Duplicate guard и WebGL-сборка PASS. HTML/guided-app.js по localhost:8770 возвращают200 и совпадают с runtime.
