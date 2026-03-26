import { describe, expect, it } from "vitest";
import { buildHermesPrompt } from "./prompt.js";

describe("buildHermesPrompt", () => {
  const baseCtx = {
    agentId: "agent-123",
    agentName: "CEO",
    companyId: "company-456",
    runId: "run-789",
    paperclipApiUrl: "http://127.0.0.1:3100/api",
  };

  it("includes agent identity in prompt", () => {
    const prompt = buildHermesPrompt({ ...baseCtx });
    expect(prompt).toContain("agent-123");
    expect(prompt).toContain("CEO");
    expect(prompt).toContain("company-456");
  });

  it("includes task section when taskId is provided", () => {
    const prompt = buildHermesPrompt({
      ...baseCtx,
      taskId: "issue-1",
      taskTitle: "Fix login bug",
      taskBody: "Users can't log in",
    });
    expect(prompt).toContain("issue-1");
    expect(prompt).toContain("Fix login bug");
    expect(prompt).toContain("Users can't log in");
    expect(prompt).not.toContain("Check for Work");
  });

  it("includes heartbeat section when no task", () => {
    const prompt = buildHermesPrompt({ ...baseCtx });
    expect(prompt).toContain("Check for Work");
    expect(prompt).not.toContain("Assigned Task");
  });

  it("normalizes paperclipApiUrl — adds /api suffix", () => {
    const prompt = buildHermesPrompt({
      ...baseCtx,
      paperclipApiUrl: "http://localhost:3100",
    });
    expect(prompt).toContain("http://localhost:3100/api");
  });

  it("does not double /api suffix", () => {
    const prompt = buildHermesPrompt({
      ...baseCtx,
      paperclipApiUrl: "http://localhost:3100/api",
    });
    expect(prompt).not.toContain("/api/api");
  });

  it("uses custom template when provided", () => {
    const prompt = buildHermesPrompt({
      ...baseCtx,
      promptTemplate: "Hello {{agentName}}, your ID is {{agentId}}",
    });
    expect(prompt).toBe("Hello CEO, your ID is agent-123");
  });
});
