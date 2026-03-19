# Шаблоны компаний

Готовые шаблоны для быстрого старта с Paperclip. Каждый шаблон содержит преднастроенную компанию с командой AI-агентов, целями и инструкциями на русском языке.

## Доступные шаблоны

| Файл | Название | Агенты | Описание |
|------|----------|--------|----------|
| `marketing-agency.json` | Маркетинговое агентство | 4 | Директор, контент-менеджер, SMM-менеджер, аналитик |
| `software-dev.json` | Разработка ПО | 4 | CTO, backend, frontend, QA |
| `customer-support.json` | Поддержка клиентов | 3 | Руководитель, оператор, аналитик обращений |

## Формат шаблонов

Шаблоны используют формат **Paperclip Portability** (inline bundle). Каждый файл — это готовый payload для `POST /api/companies/import`, содержащий:

- `source.manifest` — манифест с описанием компании и агентов
- `source.files` — markdown-файлы с инструкциями для агентов (AGENTS.md)
- `target` — режим импорта (`new_company` по умолчанию)
- `_template` — метаданные шаблона и цели для создания после импорта

## Использование

### Через API (рекомендуется)

#### 1. Импорт компании и агентов

```bash
# Загрузить шаблон и импортировать как новую компанию
curl -X POST http://localhost:4280/api/companies/import \
  -H "Content-Type: application/json" \
  -d @templates/marketing-agency.json
```

Ответ содержит созданную компанию и агентов:

```json
{
  "company": { "id": "uuid", "name": "Маркетинговое агентство", "action": "created" },
  "agents": [
    { "slug": "direktor-po-marketingu", "id": "uuid", "action": "created" },
    ...
  ]
}
```

#### 2. Создание целей (из `_template.goals`)

Цели не импортируются автоматически — их нужно создать отдельно. Используйте `companyId` из ответа на шаге 1:

```bash
curl -X POST http://localhost:4280/api/companies/{companyId}/goals \
  -H "Content-Type: application/json" \
  -d '{"title": "Увеличить узнаваемость бренда", "level": "company", "status": "planned"}'
```

### Импорт в существующую компанию

Измените `target` в JSON перед импортом:

```json
{
  "target": {
    "mode": "existing_company",
    "companyId": "uuid-существующей-компании"
  }
}
```

### Предварительный просмотр (preview)

Перед импортом можно посмотреть план изменений:

```bash
curl -X POST http://localhost:4280/api/companies/import/preview \
  -H "Content-Type: application/json" \
  -d @templates/software-dev.json
```

### Стратегии коллизий

При импорте в существующую компанию, если агент с таким slug уже существует:

- `rename` (по умолчанию) — создать нового агента с изменённым именем
- `skip` — пропустить существующего агента
- `replace` — обновить существующего агента

```json
{
  "collisionStrategy": "skip"
}
```

## Настройка шаблонов

### Адаптер

По умолчанию агенты используют `openclaw_gateway`. Для локальной работы измените `adapterType` на `claude_local`:

```json
{
  "adapterType": "claude_local",
  "adapterConfig": {
    "cwd": "/path/to/workspace"
  }
}
```

### Бюджет

Бюджет каждого агента задан в центах (5000 = $50/месяц). Измените `budgetMonthlyCents` по необходимости.

### Heartbeat

Частота проверки задач настраивается через `runtimeConfig.heartbeat.intervalSec`:

- 300 секунд (5 минут) — для активных агентов (оператор поддержки, разработчики)
- 600 секунд (10 минут) — для управляющих агентов (директора, аналитики)

## Создание собственного шаблона

1. Настройте компанию и агентов через UI Paperclip
2. Экспортируйте:

```bash
curl -X POST http://localhost:4280/api/companies/{companyId}/export \
  -H "Content-Type: application/json" \
  -d '{}' > my-template.json
```

3. Оберните экспортированный манифест в формат шаблона (добавьте `source`, `target`, `_template`)
