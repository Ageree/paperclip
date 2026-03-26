import { describe, expect, it, vi, beforeEach } from "vitest";
import { ensureHermesConfig, buildDefaultHermesConfig } from "./setup.js";
import fs from "node:fs/promises";

vi.mock("node:fs/promises");

describe("buildDefaultHermesConfig", () => {
  it("returns YAML with auto-approval mode", () => {
    const config = buildDefaultHermesConfig();
    expect(config).toContain("mode: auto");
  });

  it("includes curl in permanent allowlist", () => {
    const config = buildDefaultHermesConfig();
    expect(config).toContain("curl");
  });

  it("disables tirith security scan", () => {
    const config = buildDefaultHermesConfig();
    expect(config).toContain("tirith_enabled: false");
  });

  it("includes common tools in allowlist", () => {
    const config = buildDefaultHermesConfig();
    expect(config).toContain("git");
    expect(config).toContain("python3");
    expect(config).toContain("ls");
    expect(config).toContain("cat");
  });
});

describe("ensureHermesConfig", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates config.yaml if it does not exist", async () => {
    const mockedFs = vi.mocked(fs);
    mockedFs.access.mockRejectedValue(new Error("ENOENT"));
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);

    await ensureHermesConfig("/home/paperclip");

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "/home/paperclip/.hermes/config.yaml",
      expect.stringContaining("mode: auto"),
      "utf-8",
    );
  });

  it("does not overwrite existing config.yaml", async () => {
    const mockedFs = vi.mocked(fs);
    mockedFs.access.mockResolvedValue(undefined);

    await ensureHermesConfig("/home/paperclip");

    expect(mockedFs.writeFile).not.toHaveBeenCalled();
  });

  it("creates .hermes directory if missing", async () => {
    const mockedFs = vi.mocked(fs);
    mockedFs.access.mockRejectedValue(new Error("ENOENT"));
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);

    await ensureHermesConfig("/home/testuser");

    expect(mockedFs.mkdir).toHaveBeenCalledWith(
      "/home/testuser/.hermes",
      { recursive: true },
    );
  });
});
