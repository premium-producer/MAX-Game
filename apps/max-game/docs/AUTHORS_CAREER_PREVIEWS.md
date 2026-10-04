# Локальные страницы авторов и карьеры MAX

- Авторы: http://localhost:8770/max-game/authors/index.html — копия https://go.max.ru/authors.
- Карьера: http://localhost:8770/max-game/career/index.html — копия https://team.vk.company/career-max/.

Это отдельные публичные лендинги для изучения и переиспользования блоков. Игровой UI, прогресс и мастер не изменены. Оригинальные HTML, CSS, SVG, изображения, шрифты и видео сохранены с URL/SHA в `docs/Research/max-authors-site-20261001/sources/` и `docs/Research/max-career-site-20261001/sources/`.

Авторы: все разделы, десять карточек инструментов с горизонтальной прокруткой, три вкладки создания канала с оригинальными роликами, семь вопросов о каналах и шесть о донатах. Скрытый контент извлечён из исходного публичного JS. Svelte hydration и аналитика заменены локальными обработчиками меню, вкладок и FAQ; исходные CSS-градиенты сохраняются. Используются оригинальные WOFF2, неподдерживаемые локальным HTTP-сервером WOFF fallback исключены.

Карьера: исходная разметка и графика, два исходных MP4, GSAP/ScrollTrigger и оригинальная хореография скролла. Меню, якоря и FAQ адаптированы локально. Открытые вакансии определены снимком публичного API от 01.10.2026; ссылки на подробности и отклик ведут на официальный сайт. Скрытый раздел видео остаётся скрытым как в оригинале. Сервер отправки резюме, CAPTCHA, трекинг и cookies не воспроизводятся; локальная форма не отправляет данные. Видео обеих страниц проигрываются при видимости, при hidden/reduced motion приостанавливаются; движение отключается при reduced motion.

```powershell
py -3 artifacts/max-game/scripts/prepare-authors-career.py
py -3 artifacts/web/tools/check_project_duplicates.py
node artifacts/max-game/scripts/build-brandbook.mjs authors
node artifacts/max-game/scripts/build-brandbook.mjs career
```

Исходники: `artifacts/max-game/public/authors/`, `artifacts/max-game/public/career/`. Runtime обновляется изолированным сборщиком; сервер перезапускать не требуется. Он разрешает `brandbook`, `business`, `digital-id`, `authors`, `career`. Проверки: [авторы](../../../artifacts/reports/max-authors-site-20261001/README.md), [карьера](../../../artifacts/reports/max-career-site-20261001/README.md). Визуальная оценка ожидается от пользователя: три вкладки авторов, видео/FAQ; карьерная видеозаставка, скролл и раскрытие вопросов.
