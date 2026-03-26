import type { UIAdapterModule } from "../types";
import type { TranscriptEntry, CreateConfigValues } from "@paperclipai/adapter-utils";
import { HermesLocalConfigFields } from "./config-fields";

function parseHermesStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[hermes]")) {
    return [{ kind: "system", ts, text: trimmed }];
  }

  if (trimmed.startsWith("┊")) {
    const stripped = trimmed.slice(1).trim();
    const match = stripped.match(/^([a-z_]+)(?:\([^)]*\))?[:\s]+(.*)$/i);
    if (match) {
      return [{ kind: "stdout", ts, text: `[${match[1]}] ${match[2]}` }];
    }
  }

  if (trimmed.includes("💭") || trimmed.startsWith("<thinking>") || trimmed.startsWith("Thinking:")) {
    return [{ kind: "thinking", ts, text: trimmed.replace(/^💭\s*/, "") }];
  }

  if (trimmed.startsWith("Error:") || trimmed.startsWith("ERROR:") || trimmed.startsWith("Traceback")) {
    return [{ kind: "stderr", ts, text: trimmed }];
  }

  return [{ kind: "assistant", ts, text: trimmed }];
}

function buildHermesLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  if (v.cwd) ac.cwd = v.cwd;
  if (v.model) ac.model = v.model;
  if (v.extraArgs) ac.provider = v.extraArgs; // reuse extraArgs field for provider
  if (v.args) ac.toolsets = v.args; // reuse args field for toolsets
  ac.timeoutSec = 300;
  ac.graceSec = 10;
  ac.persistSession = true;
  return ac;
}

export const hermesLocalUIAdapter: UIAdapterModule = {
  type: "hermes_local",
  label: "Hermes Agent",
  parseStdoutLine: parseHermesStdoutLine,
  ConfigFields: HermesLocalConfigFields,
  buildAdapterConfig: buildHermesLocalConfig,
};
