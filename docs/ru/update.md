# Обновление системы

Руководство по обновлению Paperclip.

## Когда обновлять

- Вышла новая версия с нужным функционалом или исправлением
- Получено уведомление о критическом обновлении безопасности
- Не обновляйте в момент активной работы агентов -- дождитесь завершения текущих запусков

## Обновление до последней версии

```bash
sudo bash scripts/client-update.sh
```

## Обновление до конкретной версии

```bash
sudo bash scripts/client-update.sh v0.4.0
```

## Что происходит при обновлении

Скрипт выполняет 7 этапов:

| Этап | Описание |
|------|----------|
| 1. Проверка | Наличие Paperclip, git, pnpm, systemctl |
| 2. Бекап | Копирование `/opt/paperclip/data` (хранятся последние 3 бекапа) |
| 3. Остановка | `systemctl stop paperclip` |
| 4. Обновление | `git fetch`, переключение на версию, `pnpm install`, `pnpm build`, `pnpm db:migrate` |
| 5. Запуск | `systemctl start paperclip` |
| 6. Health check | Проверка `http://localhost:3100/api/health` через 5 секунд |
| 7. Результат | Если health check не прошёл -- автоматический откат |

## Откат

### Автоматический

Если после обновления health check не проходит, скрипт автоматически:
1. Останавливает сервис
2. Возвращает код на предыдущий коммит
3. Пересобирает проект
4. Запускает сервис

### Ручной

Если нужно откатиться вручную:

```bash
sudo systemctl stop paperclip
cd /opt/paperclip
git log --oneline -5          # посмотреть историю
git checkout <нужный-коммит>
pnpm install --frozen-lockfile
pnpm build
sudo systemctl start paperclip
```

### Восстановление данных из бекапа

```bash
ls /opt/paperclip/data.backup.*                           # список бекапов
cp -r /opt/paperclip/data.backup.20260319120000 /opt/paperclip/data
sudo systemctl restart paperclip
```

## Проверка текущей версии

```bash
cd /opt/paperclip && git describe --tags --always
```

## Проверка после обновления

```bash
# Health check
curl -sf http://localhost:3100/api/health && echo "OK"

# Статус сервиса
systemctl status paperclip

# Логи (последние 50 строк)
journalctl -u paperclip -n 50 --no-pager
```

Если возникли проблемы после обновления, смотрите [решение проблем](troubleshooting.md).
