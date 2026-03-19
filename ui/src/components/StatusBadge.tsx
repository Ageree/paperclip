import { cn } from "../lib/utils";
import { statusBadge, statusBadgeDefault } from "../lib/status-colors";

const statusDisplayLabel: Record<string, string> = {
  // Agent statuses
  active: "Активен",
  running: "Работает",
  paused: "Приостановлен",
  idle: "Ожидает",
  error: "Ошибка",
  terminated: "Остановлен",
  archived: "В архиве",
  pending_approval: "Ожидает одобрения",

  // Issue statuses
  backlog: "Бэклог",
  todo: "К выполнению",
  in_progress: "В работе",
  in_review: "На проверке",
  done: "Выполнено",
  cancelled: "Отменено",
  blocked: "Заблокировано",

  // Run statuses
  queued: "В очереди",
  succeeded: "Успешно",
  failed: "Ошибка",
  timed_out: "Тайм-аут",
  completed: "Завершён",

  // Approval statuses
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
  revision_requested: "Требуется доработка",

  // Goal/project statuses
  planned: "Запланировано",
  achieved: "Достигнуто",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0",
        statusBadge[status] ?? statusBadgeDefault
      )}
    >
      {statusDisplayLabel[status] ?? status.replace("_", " ")}
    </span>
  );
}
