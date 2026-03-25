import { describe, expect, it } from "vitest";
import { parseHermesOutput } from "./parse.js";

describe("parseHermesOutput", () => {
  it("extracts session ID from quiet mode output", () => {
    const stdout = "Hello, I completed the task.\n\nsession_id: ses_abc123def";
    const result = parseHermesOutput(stdout, "");

    expect(result.sessionId).toBe("ses_abc123def");
    expect(result.response).toBe("Hello, I completed the task.");
  });

  it("extracts session ID from legacy format", () => {
    const stdout = "Done. Session saved: my-session-42";
    const result = parseHermesOutput(stdout, "");

    expect(result.sessionId).toBe("my-session-42");
  });

  it("extracts token usage from output", () => {
    const stderr = "tokens: 1500 input, 300 output";
    const result = parseHermesOutput("", stderr);

    expect(result.usage).toEqual({
      inputTokens: 1500,
      outputTokens: 300,
    });
  });

  it("extracts cost from output", () => {
    const stderr = "cost: $0.0042";
    const result = parseHermesOutput("", stderr);

    expect(result.costUsd).toBeCloseTo(0.0042, 4);
  });

  it("captures error lines from stderr", () => {
    const stderr = "INFO: starting\nError: model not available\nDEBUG: cleanup";
    const result = parseHermesOutput("", stderr);

    expect(result.errorMessage).toContain("Error: model not available");
  });

  it("ignores non-error log lines in stderr", () => {
    const stderr = "INFO: loading tools\nDEBUG: connected\nwarn: slow response";
    const result = parseHermesOutput("", stderr);

    expect(result.errorMessage).toBeUndefined();
  });

  it("returns empty result for empty output", () => {
    const result = parseHermesOutput("", "");

    expect(result.sessionId).toBeUndefined();
    expect(result.response).toBeUndefined();
    expect(result.usage).toBeUndefined();
    expect(result.costUsd).toBeUndefined();
    expect(result.errorMessage).toBeUndefined();
  });

  it("handles combined stdout and stderr for usage extraction", () => {
    const stdout = "Task done.\n\nsession_id: s_123";
    const stderr = "token: 800 in, 200 out\ncost: $0.01";
    const result = parseHermesOutput(stdout, stderr);

    expect(result.sessionId).toBe("s_123");
    expect(result.response).toBe("Task done.");
    expect(result.usage).toEqual({ inputTokens: 800, outputTokens: 200 });
    expect(result.costUsd).toBeCloseTo(0.01, 4);
  });
});
