# Разработка и синхронизация KDW-MAX

Рабочая структура на Mac и основном ПК — корневые apps, UI, docs, ops. Правила единой версии, профилей запуска и публикации: [sync/WORKSPACE.md](sync/WORKSPACE.md). На Mac больше не использовать Production Local Export как рабочую папку.

Основной ПК: futuronika-ai / DESKTOP-0N2LG32, проект D:/job/production/FUTURONIKA/KDW-MAX. С Mac доступен существующий SSH-relay:

```sh
ssh -F .sync/ssh/config kdw-main
```

Конфигурация доступа и ключи локальные, вне Git. SSH-команду выполнять из рабочего корня Mac; при переносе всей папки проверить абсолютные пути локальной конфигурации.

GitHub: premium-producer/MAX-Game и premium-producer/VK_Stella, ветка kdw-max. github/MAX-Game и github/VK_Stella — публикационные копии; редактировать исходники в рабочих apps/UI/docs/ops. Точные итоговые коммиты и результаты проверок находятся в локальной .sync/SYNC-STATUS.json. Для нового среза использовать npm run sync:prepare, затем проверить изменения, SOURCE_MANIFEST и Gitleaks. Автоматического push нет.

Исходная база24.10:4202файла,1777604755байт; контрольные документы сохранены на Mac в .sync/archive/export-20261024. Это историческая квитанция, не активный источник следующей синхронизации. Отдельно одобренный [план восстановления ПК](sync/FINAL-SYNC-PROPOSAL.md) применён25.10. Текущий пакет проверяется по своему манифесту; исходный экспорт не переутверждается.
