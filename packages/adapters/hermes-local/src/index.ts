import { ADAPTER_TYPE, ADAPTER_LABEL } from "./shared/constants.js";
import type { AdapterModel } from "@paperclipai/adapter-utils";

export const type = ADAPTER_TYPE;
export const label = ADAPTER_LABEL;

/**
 * Models available through Hermes Agent.
 *
 * Updated to latest models (March 2026) including affordable Chinese models
 * for the Russian/CIS market where cost efficiency matters.
 */
export const models: AdapterModel[] = [
  // Anthropic — latest
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6 (Anthropic)" },
  { id: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6 (Anthropic)" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5 (Anthropic)" },

  // OpenAI — latest
  { id: "openai/gpt-5.4", label: "GPT-5.4 (OpenAI)" },
  { id: "openai/o3", label: "o3 (OpenAI)" },

  // Google
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Google)" },

  // Chinese models — cheap and capable
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (DeepSeek)" },
  { id: "deepseek/deepseek-v3", label: "DeepSeek V3 (DeepSeek)" },
  { id: "qwen/qwen-3-coder", label: "Qwen 3 Coder (Alibaba)" },
  { id: "qwen/qwen-3-235b", label: "Qwen 3 235B (Alibaba)" },
  { id: "zhipu/glm-4-plus", label: "GLM-4 Plus (Zhipu AI)" },
  { id: "kimi/kimi-k2.5", label: "Kimi K2.5 (Moonshot)" },
  { id: "minimax/minimax-01", label: "MiniMax-01 (MiniMax)" },
];

/**
 * Documentation shown in the Paperclip UI when configuring a Hermes agent.
 */
export const agentConfigurationDoc = `# Hermes Agent Configuration

Hermes Agent is a full-featured AI agent by Nous Research with 30+ native
tools, persistent memory, session persistence, skills, and MCP support.

## Prerequisites

- Python 3.11+ installed
- Hermes Agent installed: \`pip install hermes-agent\`
- At least one LLM API key configured in ~/.hermes/.env

## Core Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| model | string | anthropic/claude-sonnet-4.6 | Model to use (provider/model format) |
| provider | string | (auto) | API provider: auto, openrouter, nous, openai-codex, zai, kimi-coding, minimax, minimax-cn, dashscope, kilo-code |
| timeoutSec | number | 300 | Execution timeout in seconds |
| graceSec | number | 10 | Grace period after SIGTERM before SIGKILL |

## Tool Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| toolsets | string | (all) | Comma-separated toolsets to enable (e.g. "terminal,file,web") |

## Session & Workspace

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| persistSession | boolean | true | Resume sessions across heartbeats |
| worktreeMode | boolean | false | Use git worktree for isolated changes |
| checkpoints | boolean | false | Enable filesystem checkpoints |

## Advanced

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| hermesCommand | string | hermes | Path to hermes CLI binary |
| verbose | boolean | false | Enable verbose output |
| extraArgs | string[] | [] | Additional CLI arguments |
| env | object | {} | Extra environment variables |
| promptTemplate | string | (default) | Custom prompt template with {{variable}} placeholders |

## Available Template Variables

- \`{{agentId}}\` — Paperclip agent ID
- \`{{agentName}}\` — Agent display name
- \`{{companyId}}\` — Paperclip company ID
- \`{{runId}}\` — Current heartbeat run ID
- \`{{taskId}}\` — Current task/issue ID (if assigned)
- \`{{taskTitle}}\` — Task title (if assigned)
- \`{{taskBody}}\` — Task description (if assigned)
`;
