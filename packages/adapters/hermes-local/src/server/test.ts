import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import { HERMES_CLI, DEFAULT_MODEL, ADAPTER_TYPE } from "../shared/constants.js";

const execFileAsync = promisify(execFile);

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

async function checkCliInstalled(
  command: string,
): Promise<AdapterEnvironmentCheck | null> {
  try {
    await execFileAsync(command, ["--version"], { timeout: 10_000 });
    return null;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return {
        level: "error",
        message: `Hermes CLI "${command}" not found in PATH`,
        hint: "Install Hermes Agent: pip install hermes-agent",
        code: "hermes_cli_not_found",
      };
    }
    return null;
  }
}

async function checkCliVersion(
  command: string,
): Promise<AdapterEnvironmentCheck | null> {
  try {
    const { stdout } = await execFileAsync(command, ["--version"], { timeout: 10_000 });
    const version = stdout.trim();
    if (version) {
      return { level: "info", message: `Hermes Agent version: ${version}`, code: "hermes_version" };
    }
    return { level: "warn", message: "Could not determine Hermes Agent version", code: "hermes_version_unknown" };
  } catch {
    return {
      level: "warn",
      message: "Could not determine Hermes Agent version",
      hint: "Make sure the hermes CLI is properly installed",
      code: "hermes_version_failed",
    };
  }
}

async function checkPython(): Promise<AdapterEnvironmentCheck | null> {
  try {
    const { stdout } = await execFileAsync("python3", ["--version"], { timeout: 5_000 });
    const match = stdout.trim().match(/(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major < 3 || (major === 3 && minor < 11)) {
        return {
          level: "error",
          message: `Python ${stdout.trim()} found — Hermes requires Python 3.11+`,
          hint: "Upgrade Python to 3.11 or later",
          code: "hermes_python_old",
        };
      }
    }
    return null;
  } catch {
    return {
      level: "warn",
      message: "python3 not found in PATH",
      hint: "Hermes Agent requires Python 3.11+",
      code: "hermes_python_missing",
    };
  }
}

function checkModel(config: Record<string, unknown>): AdapterEnvironmentCheck {
  const model = asString(config.model);
  if (!model) {
    return {
      level: "info",
      message: `No model specified — will use default: ${DEFAULT_MODEL}`,
      code: "hermes_default_model",
    };
  }
  return { level: "info", message: `Model: ${model}`, code: "hermes_model_configured" };
}

function checkApiKeys(): AdapterEnvironmentCheck {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;

  if (!hasAnthropic && !hasOpenRouter && !hasOpenAI && !hasDeepSeek) {
    return {
      level: "warn",
      message: "No LLM API keys found in environment",
      hint: "Set ANTHROPIC_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, or DEEPSEEK_API_KEY",
      code: "hermes_no_api_keys",
    };
  }

  const providers: string[] = [];
  if (hasAnthropic) providers.push("Anthropic");
  if (hasOpenRouter) providers.push("OpenRouter");
  if (hasOpenAI) providers.push("OpenAI");
  if (hasDeepSeek) providers.push("DeepSeek");

  return {
    level: "info",
    message: `API keys found: ${providers.join(", ")}`,
    code: "hermes_api_keys_found",
  };
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const config = (ctx.config ?? {}) as Record<string, unknown>;
  const command = asString(config.hermesCommand) || HERMES_CLI;
  const checks: AdapterEnvironmentCheck[] = [];

  const cliCheck = await checkCliInstalled(command);
  if (cliCheck) {
    checks.push(cliCheck);
    if (cliCheck.level === "error") {
      return { adapterType: ADAPTER_TYPE, status: "fail", checks, testedAt: new Date().toISOString() };
    }
  }

  const versionCheck = await checkCliVersion(command);
  if (versionCheck) checks.push(versionCheck);

  const pythonCheck = await checkPython();
  if (pythonCheck) checks.push(pythonCheck);

  checks.push(checkModel(config));
  checks.push(checkApiKeys());

  const hasErrors = checks.some((c) => c.level === "error");
  const hasWarnings = checks.some((c) => c.level === "warn");

  return {
    adapterType: ADAPTER_TYPE,
    status: hasErrors ? "fail" : hasWarnings ? "warn" : "pass",
    checks,
    testedAt: new Date().toISOString(),
  };
}
