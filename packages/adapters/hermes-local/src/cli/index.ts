import type { CLIAdapterModule } from "@paperclipai/adapter-utils";

export const hermesCliAdapter: CLIAdapterModule = {
  type: "hermes_local",
  formatStdoutEvent(line: string, _debug: boolean) {
    if (line.trim()) {
      process.stdout.write(line + "\n");
    }
  },
};
