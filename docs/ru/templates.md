# Использование шаблонов

Шаблоны -- готовые конфигурации компании с командой агентов, целями и инструкциями.

## Доступные шаблоны

| Шаблон | Файл | Агенты | Описание |
|--------|------|--------|----------|
| Маркетинговое агентство | `marketing-agency.json` | 4 | Директор, контент-менеджер, SMM, аналитик |
| Разработка ПО | `software-dev.json` | 4 | CTO, backend, frontend, QA |
| Поддержка клиентов | `customer-support.json` | 3 | Руководитель, оператор, аналитик обращений |

Файлы шаблонов расположены в `paperclip/templates/`.

## Импорт через API

### Предварительный просмотр

Перед импортом можно посмотреть, что будет создано:

```bash
curl -X POST http://localhost:3100/api/companies/import/preview \
  -H "Content-Type: application/json" \
  -d @paperclip/templates/software-dev.json
```

### Импорт как новую компанию

```bash
curl -X POST http://localhost:3100/api/companies/import \
  -H "Content-Type: application/json" \
  -d @paperclip/templates/marketing-agency.json
```

Ответ содержит `companyId` созданной компании и список агентов.

### Создание целей

Цели из шаблона не импортируются автоматически. Создайте их отдельно, используя `companyId` из ответа:

```bash
curl -X POST http://localhost:3100/api/companies/{companyId}/goals \
  -H "Content-Type: application/json" \
  -d '{"title": "Выпустить MVP продукта", "level": "company", "status": "planned"}'
```

### Импорт в существующую компанию

Измените поле `target` в JSON перед импортом:

```json
{
  "target": {
    "mode": "existing_company",
    "companyId": "uuid-вашей-компании"
  }
}
```

### Стратегии коллизий

Если агент с таким slug уже существует:

| Стратегия | Поведение |
|-----------|-----------|
| `rename` | Создать нового с изменённым именем (по умолчанию) |
| `skip` | Пропустить существующего |
| `replace` | Обновить существующего |

## Настройка после импорта

### Бюджет

По умолчанию бюджет каждого агента -- $50/мес (5000 центов). Измените `budgetMonthlyCents` под ваши нужды.

### Heartbeat

Частота проверки задач:
- 300 сек (5 мин) -- активные исполнители (операторы, разработчики)
- 600 сек (10 мин) -- управляющие агенты (директора, аналитики)

### Адаптер

По умолчанию агенты используют `openclaw_gateway` (работа в песочнице NemoClaw). Для локальной разработки можно переключить на `claude_local`.

## Создание собственного шаблона

1. Настройте компанию и агентов через UI Paperclip
2. Экспортируйте:

```bash
curl -X POST http://localhost:3100/api/companies/{companyId}/export \
  -H "Content-Type: application/json" \
  -d '{}' > my-template.json
```

3. Добавьте метаданные в секцию `_template`:

```json
{
  "_template": {
    "id": "my-template",
    "version": "1.0.0",
    "locale": "ru",
    "displayName": "Мой шаблон",
    "description": "Описание шаблона",
    "goals": []
  }
}
```

4. Сохраните файл в `paperclip/templates/` для повторного использования.
