import type { TranscriptEntry } from "@paperclipai/adapter-utils";
import { TOOL_OUTPUT_PREFIX } from "../shared/constants.js";

function isToolLine(line: string): boolean {
  return line.startsWith(TOOL_OUTPUT_PREFIX);
}

function parseToolLine(line: string): { tool: string; content: string } | null {
  const stripped = line.slice(TOOL_OUTPUT_PREFIX.length).trim();
  const match = stripped.match(/^([a-z_]+)(?:\([^)]*\))?[:\s]+(.*)$/i);
  if (match) {
    return { tool: match[1], content: match[2] };
  }
  return { tool: "unknown", content: stripped };
}

function isThinkingLine(line: string): boolean {
  return (
    line.includes("💭") ||
    line.startsWith("<thinking>") ||
    line.startsWith("</thinking>") ||
    line.startsWith("Thinking:")
  );
}

/**
 * Parse a single line of Hermes stdout into transcript entries.
 */
export function parseHermesStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // System/adapter messages
  if (trimmed.startsWith("[hermes]")) {
    return [{ kind: "system", ts, text: trimmed }];
  }

  // Tool output
  if (isToolLine(trimmed)) {
    const parsed = parseToolLine(trimmed);
    if (parsed) {
      return [{ kind: "stdout", ts, text: `[${parsed.tool}] ${parsed.content}` }];
    }
  }

  // Thinking blocks
  if (isThinkingLine(trimmed)) {
    return [{ kind: "thinking", ts, text: trimmed.replace(/^💭\s*/, "") }];
  }

  // Error output
  if (
    trimmed.startsWith("Error:") ||
    trimmed.startsWith("ERROR:") ||
    trimmed.startsWith("Traceback")
  ) {
    return [{ kind: "stderr", ts, text: trimmed }];
  }

  // Regular assistant output
  return [{ kind: "assistant", ts, text: trimmed }];
}
