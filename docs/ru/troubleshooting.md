# Решение проблем

Типичные проблемы и способы их устранения.

## Paperclip не запускается

Проверьте статус сервиса:

```bash
systemctl status paperclip
```

Если статус `failed` или `inactive`, смотрите логи:

```bash
journalctl -u paperclip -n 100 --no-pager
```

Частые причины:
- **Порт 3100 занят** -- остановите процесс, занимающий порт: `lsof -i :3100`
- **Не собран проект** -- выполните `cd /opt/paperclip && pnpm build`
- **Нет прав** -- проверьте владельца: `ls -la /opt/paperclip`

Перезапуск:

```bash
sudo systemctl restart paperclip
```

## Агент не отвечает

### Проверьте sandbox

```bash
nemoclaw status
```

Если sandbox не запущен, перезапустите:

```bash
nemoclaw onboard
```

### Проверьте heartbeat

На странице агента в UI проверьте:
- Время последнего heartbeat -- если давно, агент не подключён
- Статус -- `paused` означает превышение бюджета или ручную паузу
- Ошибки последнего запуска в логах

### Проверьте подключение

Агент с адаптером `openclaw_gateway` должен быть подключён к Paperclip через invite-ссылку. Проверьте раздел **Доступ** в настройках компании.

## NVIDIA API ошибка

### Проверьте ключ

Убедитесь, что API-ключ активен на [build.nvidia.com](https://build.nvidia.com) в разделе API Keys.

### Проверьте подключение

```bash
curl -sf https://integrate.api.nvidia.com -o /dev/null && echo "OK" || echo "Нет доступа"
```

### Переустановите ключ

```bash
nemoclaw onboard
```

Введите ключ заново при запросе.

## Высокие расходы

### Проверьте бюджеты

На странице каждого агента отображаются текущие расходы за месяц. Если расходы растут быстрее ожидаемого:

1. **Уменьшите бюджет** агента (`budgetMonthlyCents`)
2. **Увеличьте интервал heartbeat** (`intervalSec`) -- реже проверяет задачи
3. **Уменьшите `maxConcurrentRuns`** -- меньше параллельных запусков
4. **Приостановите агента** через UI, если нужно срочно остановить расходы

### Поставьте агента на паузу

Через UI нажмите **Пауза** на странице агента. Агент перестанет выполнять задачи до снятия паузы.

## Обновление сломало систему

Скрипт обновления автоматически создаёт бекап и выполняет откат при ошибке. Если автоматический откат не сработал:

### Ручной откат

1. Остановите сервис:

```bash
sudo systemctl stop paperclip
```

2. Найдите бекап:

```bash
ls /opt/paperclip/data.backup.*
```

3. Восстановите данные:

```bash
cp -r /opt/paperclip/data.backup.XXXXXXXX /opt/paperclip/data
```

4. Откатите код:

```bash
cd /opt/paperclip
git log --oneline -5    # найдите нужный коммит
git checkout <коммит>
pnpm install --frozen-lockfile
pnpm build
```

5. Запустите:

```bash
sudo systemctl start paperclip
```

Подробнее -- в [руководстве по обновлению](update.md).

## Порт 3100 недоступен

### С локальной машины

```bash
curl -sf http://localhost:3100/api/health && echo "OK" || echo "Не отвечает"
```

Если не отвечает -- проверьте `systemctl status paperclip`.

### С удалённой машины

Порт 3100 по умолчанию слушает только localhost. Для удалённого доступа:

1. Используйте [Tailscale](https://tailscale.com) (рекомендуется)
2. Или настройте SSH-туннель:

```bash
ssh -L 3100:localhost:3100 user@your-vps
```

3. Или проверьте firewall:

```bash
sudo ufw status
sudo ufw allow 3100/tcp   # только для доверенных сетей!
```

Не открывайте порт 3100 в интернет без аутентификации.
