import { describe, expect, it } from "vitest";
import { type as adapterType, label, models, agentConfigurationDoc } from "./index.js";

describe("hermes-local adapter exports", () => {
  it("exports correct adapter type", () => {
    expect(adapterType).toBe("hermes_local");
  });

  it("exports human-readable label", () => {
    expect(label).toBe("Hermes Agent");
  });

  it("exports updated model list with latest models", () => {
    const modelIds = models.map((m) => m.id);

    // Latest Anthropic models
    expect(modelIds).toContain("anthropic/claude-sonnet-4.6");
    expect(modelIds).toContain("anthropic/claude-opus-4.6");

    // Latest OpenAI
    expect(modelIds).toContain("openai/gpt-5.4");

    // Chinese models (cheap, accessible)
    expect(modelIds).toContain("deepseek/deepseek-r1");
    expect(modelIds).toContain("qwen/qwen-3-coder");

    // Should NOT contain outdated models
    expect(modelIds).not.toContain("anthropic/claude-sonnet-4");
    expect(modelIds).not.toContain("openai/gpt-4.1");
  });

  it("each model has id and label", () => {
    for (const model of models) {
      expect(model.id).toBeTruthy();
      expect(model.label).toBeTruthy();
      expect(typeof model.id).toBe("string");
      expect(typeof model.label).toBe("string");
    }
  });

  it("exports configuration documentation", () => {
    expect(agentConfigurationDoc).toContain("Hermes Agent");
    expect(agentConfigurationDoc).toContain("pip install hermes-agent");
  });
});
