import { describe, expect, it } from "vitest";
import { parseHermesStdoutLine } from "./parse-stdout.js";

const TS = "2026-03-25T22:00:00Z";

describe("parseHermesStdoutLine", () => {
  it("parses system messages with [hermes] prefix", () => {
    const entries = parseHermesStdoutLine("[hermes] Starting agent", TS);
    expect(entries).toEqual([{ kind: "system", ts: TS, text: "[hermes] Starting agent" }]);
  });

  it("parses tool output lines with ┊ prefix", () => {
    const entries = parseHermesStdoutLine("┊ terminal: ls -la", TS);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "stdout", text: "[terminal] ls -la" });
  });

  it("parses thinking lines with 💭", () => {
    const entries = parseHermesStdoutLine("💭 Let me think about this...", TS);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "thinking", text: "Let me think about this..." });
  });

  it("parses error lines", () => {
    const entries = parseHermesStdoutLine("Error: connection refused", TS);
    expect(entries).toEqual([{ kind: "stderr", ts: TS, text: "Error: connection refused" }]);
  });

  it("parses Traceback as error", () => {
    const entries = parseHermesStdoutLine("Traceback (most recent call last):", TS);
    expect(entries[0]?.kind).toBe("stderr");
  });

  it("parses regular text as assistant output", () => {
    const entries = parseHermesStdoutLine("I've completed the task.", TS);
    expect(entries).toEqual([{ kind: "assistant", ts: TS, text: "I've completed the task." }]);
  });

  it("returns empty array for blank lines", () => {
    expect(parseHermesStdoutLine("", TS)).toEqual([]);
    expect(parseHermesStdoutLine("   ", TS)).toEqual([]);
  });

  it("handles tool line with parenthesized args", () => {
    const entries = parseHermesStdoutLine("┊ read_file(/path/to/file): contents here", TS);
    expect(entries[0]).toMatchObject({ kind: "stdout", text: "[read_file] contents here" });
  });
});
