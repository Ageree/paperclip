import { useState, useRef, useEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { AGENT_ROLE_LABELS } from "@paperclipai/shared";

/* ---- Help text for (?) tooltips ---- */
export const help: Record<string, string> = {
  name: "Отображаемое имя агента.",
  title: "Должность, показываемая в оргструктуре.",
  role: "Организационная роль. Определяет положение и возможности.",
  reportsTo: "Агент, которому подчиняется данный агент в иерархии.",
  capabilities: "Описание возможностей агента. Отображается в оргструктуре и используется для маршрутизации задач.",
  adapterType: "Способ запуска агента: локальный CLI (Claude/Codex/OpenCode), OpenClaw Gateway, порождённый процесс или HTTP webhook.",
  cwd: "Рабочая директория по умолчанию для локальных адаптеров. Укажите абсолютный путь на машине, где запущен Paperclip.",
  promptTemplate: "Отправляется при каждом heartbeat. Держите его компактным и динамичным. Используйте для текущей постановки задачи, а не для больших статических инструкций. Поддерживает {{ agent.id }}, {{ agent.name }}, {{ agent.role }} и другие шаблонные переменные.",
  model: "Переопределить модель, используемую адаптером по умолчанию.",
  thinkingEffort: "Глубина размышлений модели. Допустимые значения зависят от адаптера/модели.",
  chrome: "Включить интеграцию Claude с Chrome через флаг --chrome.",
  dangerouslySkipPermissions: "Запускать Claude без запросов разрешений. Необходимо для автономной работы.",
  dangerouslyBypassSandbox: "Запускать Codex без ограничений sandbox. Необходимо для доступа к файловой системе и сети.",
  search: "Включить веб-поиск Codex во время запусков.",
  workspaceStrategy: "Как Paperclip должен создавать рабочее пространство для этого агента. Используйте project_primary для обычного выполнения в cwd или git_worktree для изолированных checkout по задачам.",
  workspaceBaseRef: "Базовый git ref для создания ветки worktree. Оставьте пустым, чтобы использовать текущий ref рабочего пространства или HEAD.",
  workspaceBranchTemplate: "Шаблон именования производных веток. Поддерживает {{issue.identifier}}, {{issue.title}}, {{agent.name}}, {{project.id}}, {{workspace.repoRef}} и {{slug}}.",
  worktreeParentDir: "Директория для создания производных worktree. Поддерживаются абсолютные пути, пути с ~ и пути относительно репозитория.",
  runtimeServicesJson: "Необязательные определения сервисов среды выполнения. Используйте для общих серверов приложений, воркеров или других долгоживущих процессов, привязанных к рабочему пространству.",
  maxTurnsPerRun: "Максимальное количество агентных шагов (вызовов инструментов) за один heartbeat-запуск.",
  command: "Команда для выполнения (например, node, python).",
  localCommand: "Переопределить путь к CLI-команде, которую должен вызывать адаптер (например, /usr/local/bin/claude, codex, opencode).",
  args: "Аргументы командной строки, через запятую.",
  extraArgs: "Дополнительные CLI-аргументы для локальных адаптеров, через запятую.",
  envVars: "Переменные окружения, передаваемые в процесс адаптера. Используйте простые значения или ссылки на секреты.",
  bootstrapPrompt: "Отправляется только при запуске новой сессии Paperclip. Используйте для стабильных начальных инструкций, которые не нужно повторять при каждом heartbeat.",
  payloadTemplateJson: "Необязательный JSON, объединяемый с payload запроса к удалённому адаптеру перед добавлением стандартных полей wake и workspace.",
  webhookUrl: "URL, на который отправляются POST-запросы при вызове агента.",
  heartbeatInterval: "Запускать агента автоматически по таймеру. Полезно для периодических задач, например, проверки новой работы.",
  intervalSec: "Секунды между автоматическими heartbeat-вызовами.",
  timeoutSec: "Максимальное время выполнения запуска в секундах. 0 — без ограничения.",
  graceSec: "Секунды ожидания после отправки сигнала прерывания перед принудительным завершением процесса.",
  wakeOnDemand: "Разрешить пробуждение агента по назначениям, API-вызовам, действиям в UI или автоматизированными системами.",
  cooldownSec: "Минимальный интервал в секундах между последовательными heartbeat-запусками.",
  maxConcurrentRuns: "Максимальное количество heartbeat-запусков, выполняемых одновременно для этого агента.",
  budgetMonthlyCents: "Месячный лимит расходов в центах. 0 — без ограничения.",
};

export const adapterLabels: Record<string, string> = {
  claude_local: "Claude (local)",
  codex_local: "Codex (local)",
  gemini_local: "Gemini CLI (local)",
  opencode_local: "OpenCode (local)",
  openclaw_gateway: "OpenClaw Gateway",
  hermes_local: "Hermes Agent",
  cursor: "Cursor (local)",
  process: "Process",
  http: "HTTP",
};

export const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

/* ---- Primitive components ---- */

export function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <HelpCircle className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <HintIcon text={hint} />}
      </div>
      {children}
    </div>
  );
}

export function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <HintIcon text={hint} />}
      </div>
      <button
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-green-600" : "bg-muted"
        )}
        onClick={() => onChange(!checked)}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function ToggleWithNumber({
  label,
  hint,
  checked,
  onCheckedChange,
  number,
  onNumberChange,
  numberLabel,
  numberHint,
  numberPrefix,
  showNumber,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  number: number;
  onNumberChange: (v: number) => void;
  numberLabel: string;
  numberHint?: string;
  numberPrefix?: string;
  showNumber: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {hint && <HintIcon text={hint} />}
        </div>
        <button
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
            checked ? "bg-green-600" : "bg-muted"
          )}
          onClick={() => onCheckedChange(!checked)}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
              checked ? "translate-x-4.5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
      {showNumber && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {numberPrefix && <span>{numberPrefix}</span>}
          <input
            type="number"
            className="w-16 rounded-md border border-border px-2 py-0.5 bg-transparent outline-none text-xs font-mono text-center"
            value={number}
            onChange={(e) => onNumberChange(Number(e.target.value))}
          />
          <span>{numberLabel}</span>
          {numberHint && <HintIcon text={numberHint} />}
        </div>
      )}
    </div>
  );
}

export function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  bordered,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(bordered && "border-t border-border")}>
      <button
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/30 transition-colors"
        onClick={onToggle}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {icon}
        {title}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function AutoExpandTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  minRows,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rows = minRows ?? 3;
  const lineHeight = 20;
  const minHeight = rows * lineHeight;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);

  useEffect(() => { adjustHeight(); }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={{ minHeight }}
    />
  );
}

/**
 * Text input that manages internal draft state.
 * Calls `onCommit` on blur (and optionally on every change if `immediate` is set).
 */
export function DraftInput({
  value,
  onCommit,
  immediate,
  className,
  ...props
}: {
  value: string;
  onCommit: (v: string) => void;
  immediate?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      className={className}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      {...props}
    />
  );
}

/**
 * Auto-expanding textarea with draft state and blur-commit.
 */
export function DraftTextarea({
  value,
  onCommit,
  immediate,
  placeholder,
  minRows,
}: {
  value: string;
  onCommit: (v: string) => void;
  immediate?: boolean;
  placeholder?: string;
  minRows?: number;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rows = minRows ?? 3;
  const lineHeight = 20;
  const minHeight = rows * lineHeight;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);

  useEffect(() => { adjustHeight(); }, [draft, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      placeholder={placeholder}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      style={{ minHeight }}
    />
  );
}

/**
 * Number input with draft state and blur-commit.
 */
export function DraftNumberInput({
  value,
  onCommit,
  immediate,
  className,
  ...props
}: {
  value: number;
  onCommit: (v: number) => void;
  immediate?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "type">) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <input
      type="number"
      className={className}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(Number(e.target.value) || 0);
      }}
      onBlur={() => {
        const num = Number(draft) || 0;
        if (num !== value) onCommit(num);
      }}
      {...props}
    />
  );
}

/**
 * "Выбрать" button that opens a dialog explaining the user must manually
 * type the path due to browser security limitations.
 */
export function ChoosePathButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors shrink-0"
        onClick={() => setOpen(true)}
      >
        Выбрать
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Укажите путь вручную</DialogTitle>
            <DialogDescription>
              Безопасность браузера не позволяет приложениям получать полные локальные пути через выбор файлов.
              Скопируйте абсолютный путь и вставьте его в поле ввода.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section className="space-y-1.5">
              <p className="font-medium">macOS (Finder)</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Найдите папку в Finder.</li>
                <li>Зажмите <kbd>Option</kbd> и нажмите правую кнопку мыши на папке.</li>
                <li>Нажмите «Скопировать путь».</li>
                <li>Вставьте результат в поле ввода пути.</li>
              </ol>
              <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                /Users/yourname/Documents/project
              </p>
            </section>
            <section className="space-y-1.5">
              <p className="font-medium">Windows (Проводник)</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Найдите папку в Проводнике.</li>
                <li>Зажмите <kbd>Shift</kbd> и нажмите правую кнопку мыши на папке.</li>
                <li>Нажмите «Копировать как путь».</li>
                <li>Вставьте результат в поле ввода пути.</li>
              </ol>
              <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                C:\Users\yourname\Documents\project
              </p>
            </section>
            <section className="space-y-1.5">
              <p className="font-medium">Терминал (macOS/Linux)</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Выполните <code>cd /path/to/folder</code>.</li>
                <li>Выполните <code>pwd</code>.</li>
                <li>Скопируйте результат и вставьте в поле ввода пути.</li>
              </ol>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Label + input rendered on the same line (inline layout for compact fields).
 */
export function InlineField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <HintIcon text={hint} />}
      </div>
      <div className="w-24 ml-auto">{children}</div>
    </div>
  );
}
