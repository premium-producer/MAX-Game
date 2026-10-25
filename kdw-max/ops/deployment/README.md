# Публикация после переноса

При сборке экспорта ничего на сервере не менялось. Эти команды предназначены для последующей явной публикации. Требуются Node.js 24+, Python 3.11+, FFmpeg в PATH, OpenSSH Client. Сервер уже настроен; его сервисы, Wine, Caddy и приватные настройки не нужно заменять.

1. Выполнить Setup-Development.bat, затем Build-All.bat и Export-Web.bat.
2. В dist/max-game-web/release.json и dist/stela-web/latest.json взять release. Не публиковать всю Production Local Export: она содержит секреты.
3. Из корня экспорта создать архив: `python ops/deployment/package-web.py max-game <release>` или `python ops/deployment/package-web.py stela <release>`. Сохранить напечатанный SHA256.
4. Все SSH/SCP-команды выполнять через `powershell -File ops/deployment/Remote.ps1 ssh ...` / `... scp ...`. Последний аргумент SSH — одна строка удалённой команды; адрес `selectel-vidrs`. Обёртка использует только ключи этой папки, проверка host key включена.

## MAX

База: `/srv/projects/futuronika/df/max-game-client`. Прочитать `readlink -f <база>/current` и сохранить результат как expected_previous. Выбрать новый deployment вида `20261024T120000Z`; создать `<база>/.incoming/<deployment>`. Загрузить туда архив `MAX-Game-Web-<release>.zip` и `deploy-max-server.py` через SCP. Выполнить на сервере:

```text
python3 <база>/.incoming/<deployment>/deploy-max-server.py <deployment> <release> <sha256> <expected_previous>
```

Скрипт проверяет исходный current, архив и файлы; переключает current; проверяет HTTPS и видео Range; при ошибке возвращает прежний current. Старые immutable URL сохраняются.

## Стелла

База: `/srv/projects/futuronika/df/max-info-panel`. Прочитать current аналогично MAX. Загрузить архив `MAX-Stela-Web-No-Photo-<release>.zip` и `deploy-stela-server.py` в `<база>/.incoming/`. Выполнить:

```text
python3 <база>/.incoming/deploy-stela-server.py <release> <sha256> <expected_previous>
```

Скрипт отказывается работать во время активной голосовой/аудиосессии, сохраняет shared/data и прежние URL, проверяет манифест, перезапускает только max-info-panel и откатывает current при ошибке. Настройки Caddy, systemd и приватные профили не переписываются. Для существенно изменённой архитектуры сервера сначала пересмотреть проверки скрипта.

Обе обёртки подготовлены для переноса, но публикация из нового комплекта не выполнялась. При сообщении OpenSSH о слишком широких правах ключа ограничить права файла private/deployment/ssh/selectel_vds_ed25519 текущим пользователем Windows; не отключать проверку host key.

## Редактор миссий

Исходники: ops/mission-editor/src. Параметры build-current.mjs: путь к node_modules игры, новый выходной каталог, каталог snapshot. Локальные snapshot — снимок на дату экспорта, не актуальное состояние сервера. Перед изменением облачных данных получить свежий snapshot и backup, соблюдать docs/MISSION_EDITOR.md. Доступы: private/deployment/max-asset-audit-selectel.json.
