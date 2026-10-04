# MAX client: первичный аудит падения iPhone Safari

04.10.2026. Пользователь прислал системный экран Safari «A problem repeatedly occurred» для https://vidrs.ru/df/max-game-client/webgl-v5/client.html . Релиз20261004T101343Z. Это сообщение о повторном падении страницы; по скриншоту точный fault WebProcess/GPUProcess/OOM не установлен.

## Подтверждённые факты

- Фактический DOM опубликованной страницы, `#circles[data-startup-assets]`: `{"batches":152,"images":91,"textures":322,"pixels":208995901}`.
- 208995901×4 =835983604 bytes ≈797.26MiB только RGBA-пикселей подготовленных canvas-текстур; GPU copies/mipmaps, render targets и другие ресурсы в это число не входят. Это арифметическая оценка по размерам, не измерение процесса iPhone.
- v5StartupPlan реального reviewed catalog:70 экранов,71 уникальный raster source включая QR,100862869pixels; RGBA decode≈384.76MiB.
- V5StartupAssets.load использует Promise.all для всех URL и удерживает декодированные Images в Map до dispose.
- journey-webgl-ui.prepareGPU прогревает все frames (обычный+paused) и finals; startupProgramPins сохраняет материалы, startupTextureKeys исключает текстуры из обычного удаления cache. Ограничение concurrency само по себе не устранит постоянный объём.
- Read-only субагент ios_memory_audit независимо подтвердил объём decoded assets и механизм удержания.

## Вывод и следующий шаг

Чрезмерное удержание графических ресурсов — подтверждённый дефект стратегии загрузки для ограниченных устройств и сильная гипотеза причины конкретного падения. Само падение на iPhone не воспроизведено: доступен Chromium IAB, изменение viewport не эмулирует Safari/WebKit и лимиты телефона.

Нужен выбор продуктового scope: полноценное прохождение на iPhone либо понятный desktop-only экран до создания GPU/загрузки ассетов. Пользователю задан вопрос, пока код и оба сервера не менялись. Если мобильное прохождение нужно, использовать существующий current/prepareNext loading path и освобождение Three.Texture.dispose вместо all-screen GPU residency, сохранить предварительную загрузку файлов отдельно от декодирования/загрузки в GPU. Приёмка — реальный iPhone плюс desktop regression.

[Документация и описанный опыт](../../docs/Research/max-client-ios-memory-20261004.md).
