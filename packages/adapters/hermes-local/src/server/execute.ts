import {
  runChildProcess,
  buildPaperclipEnv,
  renderTemplate,
  ensureAbsoluteDirectory,
  asString,
  asNumber,
  asBoolean,
  asStringArray,
} from "@paperclipai/adapter-utils/server-utils";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import path from "node:path";
import {
  HERMES_CLI,
  DEFAULT_TIMEOUT_SEC,
  DEFAULT_GRACE_SEC,
  DEFAULT_MODEL,
  VALID_PROVIDERS,
} from "../shared/constants.js";
import { parseHermesOutput } from "./parse.js";

/** Env var keys that must never be overridden by user config. */
const BLOCKED_ENV_KEYS = /^(PAPERCLIP_|ANTHROPIC_API_KEY|OPENAI_API_KEY|OPENROUTER_API_KEY|DEEPSEEK_API_KEY|HOME|PATH|USER|SHELL)$/i;

const DEFAULT_PROMPT_TEMPLATE = `You are "{{agentName}}", an AI agent employee in a Paperclip-managed company.

IMPORTANT: Use \`terminal\` tool with \`curl\` for ALL Paperclip API calls.

Your Paperclip identity:
  Agent ID: {{agentId}}
  Company ID: {{companyId}}
  API Base: {{paperclipApiUrl}}

{{#taskId}}
## Assigned Task

Issue ID: {{taskId}}
Title: {{taskTitle}}

{{taskBody}}

## Workflow

1. Work on the task using your tools
2. When done, mark the issue as completed:
   \`curl -s -X PATCH "{{paperclipApiUrl}}/issues/{{taskId}}" -H "Content-Type: application/json" -d '{"status":"done"}'\`
3. Report what you did
{{/taskId}}

{{#noTask}}
## Heartbeat Wake — Check for Work

1. List issues assigned to you:
   \`curl -s "{{paperclipApiUrl}}/companies/{{companyId}}/issues?assigneeAgentId={{agentId}}&status=todo" | python3 -m json.tool\`

2. If issues found, pick the highest priority one and work on it
3. If no issues found, report briefly
{{/noTask}}`;

function buildPrompt(
  ctx: AdapterExecutionContext,
  config: Record<string, unknown>,
): string {
  const template = asString(config.promptTemplate, "") || DEFAULT_PROMPT_TEMPLATE;
  const taskId = asString((ctx.context as Record<string, unknown>)?.taskId, "");
  const taskTitle = asString((ctx.context as Record<string, unknown>)?.taskTitle, "");
  const taskBody = asString((ctx.context as Record<string, unknown>)?.taskBody, "");
  const agentName = ctx.agent.name || "Hermes Agent";

  let paperclipApiUrl =
    asString(config.paperclipApiUrl, "") ||
    process.env.PAPERCLIP_API_URL ||
    "http://127.0.0.1:3100/api";
  if (!paperclipApiUrl.endsWith("/api")) {
    paperclipApiUrl = paperclipApiUrl.replace(/\/+$/, "") + "/api";
  }

  const vars: Record<string, string> = {
    agentId: ctx.agent.id || "",
    agentName,
    companyId: ctx.agent.companyId || "",
    runId: ctx.runId || "",
    taskId: taskId || "",
    taskTitle,
    taskBody,
    paperclipApiUrl,
  };

  let rendered = template;
  rendered = rendered.replace(
    /\{\{#taskId\}\}([\s\S]*?)\{\{\/taskId\}\}/g,
    taskId ? "$1" : "",
  );
  rendered = rendered.replace(
    /\{\{#noTask\}\}([\s\S]*?)\{\{\/noTask\}\}/g,
    taskId ? "" : "$1",
  );

  return renderTemplate(rendered, vars);
}

export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const config = (ctx.agent.adapterConfig ?? {}) as Record<string, unknown>;

  // Validate hermesCommand — only allow basename (no path separators)
  const rawHermesCmd = asString(config.hermesCommand, "");
  const hermesCmd = rawHermesCmd && !rawHermesCmd.includes(path.sep) ? rawHermesCmd : HERMES_CLI;
  const model = asString(config.model, "") || DEFAULT_MODEL;
  const provider = asString(config.provider, "");
  const timeoutSec = asNumber(config.timeoutSec, DEFAULT_TIMEOUT_SEC);
  const graceSec = asNumber(config.graceSec, DEFAULT_GRACE_SEC);
  const toolsets =
    asString(config.toolsets, "") || asStringArray(config.enabledToolsets)?.join(",");
  const extraArgs = asStringArray(config.extraArgs);
  const persistSession = asBoolean(config.persistSession, true);
  const worktreeMode = asBoolean(config.worktreeMode, false);
  const checkpoints = asBoolean(config.checkpoints, false);

  const prompt = buildPrompt(ctx, config);

  const useQuiet = asBoolean(config.quiet, true);
  const args = ["chat", "-q", prompt];
  if (useQuiet) args.push("-Q");
  args.push("-m", model);

  if (provider && (VALID_PROVIDERS as readonly string[]).includes(provider)) {
    args.push("--provider", provider);
  }
  if (toolsets) args.push("-t", toolsets);
  if (worktreeMode) args.push("-w");
  if (checkpoints) args.push("--checkpoints");
  if (asBoolean(config.verbose, false)) args.push("-v");

  const prevSessionId = asString(
    (ctx.runtime?.sessionParams as Record<string, unknown> | null)?.sessionId,
    "",
  ) || undefined;
  if (persistSession && prevSessionId) {
    args.push("--resume", prevSessionId);
  }
  if (extraArgs?.length) args.push(...extraArgs);

  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter((e): e is [string, string] => e[1] != null),
    ),
    ...buildPaperclipEnv(ctx.agent),
  };
  if (ctx.runId) env.PAPERCLIP_RUN_ID = ctx.runId;

  const taskId = asString((ctx.context as Record<string, unknown>)?.taskId, "");
  if (taskId) env.PAPERCLIP_TASK_ID = taskId;

  // Merge user env vars — filter out blocked keys to prevent credential override
  const userEnv = config.env;
  if (userEnv && typeof userEnv === "object" && !Array.isArray(userEnv)) {
    const safeEntries = Object.entries(userEnv as Record<string, unknown>)
      .filter(([k, v]) => typeof v === "string" && !BLOCKED_ENV_KEYS.test(k));
    for (const [k, v] of safeEntries) {
      env[k] = v as string;
    }
  }

  // Validate working directory — must be absolute, fallback to home workspaces
  const rawCwd =
    asString(config.cwd, "") ||
    asString((ctx.context as Record<string, unknown>)?.workspaceDir, "") ||
    `/home/${process.env.USER || "paperclip"}/workspaces`;
  try {
    await ensureAbsoluteDirectory(rawCwd, { createIfMissing: true });
  } catch (err) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `Invalid working directory: ${(err as Error).message}`,
    };
  }
  const cwd = rawCwd;

  await ctx.onLog(
    "stdout",
    `[hermes] Starting Hermes Agent (model=${model}, timeout=${timeoutSec}s)\n`,
  );
  if (prevSessionId) {
    await ctx.onLog("stdout", `[hermes] Resuming session: ${prevSessionId}\n`);
  }

  const result = await runChildProcess(ctx.runId, hermesCmd, args, {
    cwd,
    env,
    timeoutSec,
    graceSec,
    onLog: ctx.onLog,
  });

  const parsed = parseHermesOutput(result.stdout || "", result.stderr || "");
  await ctx.onLog(
    "stdout",
    `[hermes] Exit code: ${result.exitCode ?? "null"}, timed out: ${result.timedOut}\n`,
  );

  const executionResult: AdapterExecutionResult = {
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    provider: provider || null,
    model,
  };

  if (parsed.errorMessage) executionResult.errorMessage = parsed.errorMessage;
  if (parsed.usage) executionResult.usage = parsed.usage;
  if (parsed.costUsd !== undefined) executionResult.costUsd = parsed.costUsd;
  if (parsed.response) executionResult.summary = parsed.response.slice(0, 2000);

  if (persistSession && parsed.sessionId) {
    executionResult.sessionParams = { sessionId: parsed.sessionId };
    executionResult.sessionDisplayId = parsed.sessionId.slice(0, 16);
  }

  return executionResult;
}
