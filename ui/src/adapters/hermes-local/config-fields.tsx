import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  DraftInput,
} from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function HermesLocalConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  return (
    <>
      <Field
        label="Модель"
        hint="Формат: provider/model (например anthropic/claude-sonnet-4.6, deepseek/deepseek-chat)"
      >
        <DraftInput
          value={
            isCreate
              ? values!.model ?? ""
              : eff("adapterConfig", "model", String(config.model ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ model: v })
              : mark("adapterConfig", "model", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="anthropic/claude-sonnet-4.6"
        />
      </Field>

      <Field
        label="Провайдер"
        hint="Обычно не нужен — Hermes определяет автоматически по имени модели. Варианты: auto, openrouter, nous, openai-codex, zai, kimi-coding, minimax, dashscope"
      >
        <DraftInput
          value={
            isCreate
              ? values!.extraArgs ?? ""
              : eff("adapterConfig", "provider", String(config.provider ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ extraArgs: v })
              : mark("adapterConfig", "provider", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="auto"
        />
      </Field>

      <Field
        label="Набор инструментов"
        hint="Через запятую: terminal, file, web, search, memory. Пусто = все доступные"
      >
        <DraftInput
          value={
            isCreate
              ? values!.args ?? ""
              : eff("adapterConfig", "toolsets", String(config.toolsets ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ args: v })
              : mark("adapterConfig", "toolsets", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="terminal,file,web,search"
        />
      </Field>
    </>
  );
}
