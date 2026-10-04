# Проверка Frost MAX — 28.09.2026

Исправлена причина резкой линии внутри иконки: ранее MaxPanelGlass размывал только фон, а WebGL-связи рисовались позже поверх. Теперь fibers+bloom проходят через JourneyFiberGlass до резких глифов/текста. Использован существующий HDR/MSAA target; один compositor заменяет output pass. Без связей эта пустая цепь не выполняется. Новых RT, контекстов, RAF, CPU-readback нет. Mip-chain добавляет около1/3 размера color attachment: до13.4MiB для4096×1280 HalfFloat; это расчёт, не измерение GPU памяти.

Профили пользователя сохранены: панель −68°/70%,Refraction100,Depth116.91,Frost0; контролы −45°/80%,Refraction100,Depth33.47,Frost56.25; Dispersion/Splay0. WEB-калибровка18 local px/9 taps/LOD≤4/transmission0.72/violetTint0.24 записана отдельно. Радиусы учитывают standalone letterbox и scale анимированных кнопок. Новый [скилл](../../skills/max-liquid-glass/SKILL.md) подключён в AGENTS, max-brand и max-game-development.

Проверено:
- 139 игровых/оптических тестов и110 Ribbon tests; результаты в tests.txt/ribbon-tests.txt. Синтаксис6 изменённых модулей, check-local, сборки MAX/Service/Viewer/Ribbon успешны. Первый Ribbon build встретил прежний Windows Errno22 при копировании шрифта; повтор успешен.
- Контракт JSON и runtime-констант, координаты маски/радиуса, обновление после движения/resize, ограничение LOD, переиспользование/освобождение ресурсов проверены тестом JourneyFiberGlass.
- В одной вкладке localhost standalone: CTA→меню→миссия с двумя узлами. Тонкая яркая связь снаружи сохраняет волокна, под иконкой становится мягким пятном; белый знак резкий. Ошибок/warn консоли нет. Это короткая визуальная проверка, не GPU-профилирование.
- Мастер: сменена только generation max-wall-right (before/after-instances.json), остальные4 не перезапускались. Check.bat:5 running/Spout sending, MAX30FPS в кратком снимке; аппаратные60FPS не заявлены. Presentation показывает обновлённый источник (master.png). Приём TD/LiDAR отдельно не проверен.
- Selectel: релиз20260928T061537Z;162/162 HTTPS SHA совпали (deployment.json). Предыдущий релиз20260928T053454Z сохранён для возврата. Короткая проверка опубликованного сценария и снимок — public.png.
- У bundled quick_validate.py отсутствует PyYAML; зависимости не устанавливались. YAML frontmatter и все локальные ссылки скилла проверены отдельно.

Реализация использует штатные [Three.js render targets](https://threejs.org/docs/pages/RenderTarget.html), mipmaps и [linear/sRGB contract](https://threejs.org/manual/pages/color-management.html), сверенные с установленным OutputPass. Это проектная калибровка по референсу, не официальный renderer Figma. [Действующий контракт](../../../apps/max-game/docs/LIQUID_GLASS.md).

Открыто: художественная приёмка пользователем, аппаратная оценка нескольких активных игровых зон. Нагрузочный прогон/видео/Git-запись/выключение не выполнялись.
