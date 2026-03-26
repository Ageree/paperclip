export interface HermesPromptContext {
  agentId: string;
  agentName: string;
  companyId: string;
  runId: string;
  paperclipApiUrl: string;
  taskId?: string;
  taskTitle?: string;
  taskBody?: string;
  promptTemplate?: string;
}

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

function normalizeApiUrl(url: string): string {
  if (url.endsWith("/api")) return url;
  return url.replace(/\/+$/, "") + "/api";
}

/**
 * Build the wake-up prompt sent to Hermes CLI.
 */
export function buildHermesPrompt(ctx: HermesPromptContext): string {
  const template = ctx.promptTemplate || DEFAULT_PROMPT_TEMPLATE;
  const apiUrl = normalizeApiUrl(ctx.paperclipApiUrl);

  const vars: Record<string, string> = {
    agentId: ctx.agentId,
    agentName: ctx.agentName,
    companyId: ctx.companyId,
    runId: ctx.runId,
    taskId: ctx.taskId || "",
    taskTitle: ctx.taskTitle || "",
    taskBody: ctx.taskBody || "",
    paperclipApiUrl: apiUrl,
  };

  let rendered = template;

  // Conditional sections: {{#taskId}}...{{/taskId}}
  rendered = rendered.replace(
    /\{\{#taskId\}\}([\s\S]*?)\{\{\/taskId\}\}/g,
    ctx.taskId ? "$1" : "",
  );
  rendered = rendered.replace(
    /\{\{#noTask\}\}([\s\S]*?)\{\{\/noTask\}\}/g,
    ctx.taskId ? "" : "$1",
  );

  // Replace {{variable}} placeholders
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }

  return rendered;
}
