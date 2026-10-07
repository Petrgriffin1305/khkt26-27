import { basename } from "node:path";
import { runWindowsCommand, parseTasklistImageNames, type ProcessRunner } from "./processRunner";
export type BlockerStatus = "active" | "stopped" | "unsupported";
export type GuardEvent = { type: "kill-success" | "kill-failed" | "scan-failed"; exe?: string; message?: string };
const allowed = new Set(["discord.exe", "chrome.exe", "steam.exe"]);
export function validateExecutableAllowlist(input: unknown): string[] {
  if (!Array.isArray(input) || input.length > 20) throw new Error("Invalid block list");
  const list = input.map(value => {
    if (typeof value !== "string" || value.length > 100 || !/^[a-z0-9-]+\.exe$/i.test(value))
      throw new Error("Only allowed executable basenames can be blocked");
    const name = value.toLowerCase();
    if (!allowed.has(name) || name === basename(process.execPath).toLowerCase()) throw new Error("Executable is not in the block allowlist");
    return name;
  });
  return [...new Set(list)];
}
export class WindowsGuard {
  private timer?: ReturnType<typeof setInterval>;
  private aborter?: AbortController;
  private running?: Promise<void>;
  private generation = 0;
  private blocked = new Set<string>();
  private queue: Promise<unknown> = Promise.resolve();
  status: BlockerStatus = "stopped";
  constructor(private options: {
    platform?: NodeJS.Platform; run?: ProcessRunner; onEvent?: (event: GuardEvent) => void;
    canScan?: () => boolean;
  } = {}) {}
  private report(event: GuardEvent) {
    try { this.options.onEvent?.(event); } catch { /* Event consumers cannot break the scheduler. */ }
  }
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => {});
    return result;
  }
  startBlocker(list: string[]): Promise<BlockerStatus> {
    return this.serialize(async () => {
      await this.stopInternal();
      if ((this.options.platform ?? process.platform) !== "win32") return this.status = "unsupported";
      const validated = validateExecutableAllowlist(list);
      if (!validated.length) return this.status;
      this.blocked = new Set(validated);
      this.aborter = new AbortController();
      this.status = "active";
      this.timer = setInterval(() => { void this.scanNow(); }, 3000);
      void this.scanNow();
      return this.status;
    });
  }
  stopBlocker(): Promise<void> { return this.serialize(() => this.stopInternal()); }
  private async stopInternal() {
    this.generation++;
    clearInterval(this.timer); this.timer = undefined;
    this.blocked.clear(); this.status = "stopped";
    this.aborter?.abort();
    await this.running;
    this.aborter = undefined;
  }
  scanNow(): Promise<void> {
    if (this.running) return this.running;
    if (this.status !== "active" || !this.aborter || this.options.canScan?.() === false) return Promise.resolve();
    const token = this.generation;
    const signal = this.aborter.signal;
    const valid = () => !signal.aborted && token === this.generation && this.options.canScan?.() !== false;
    const run = this.options.run ?? runWindowsCommand;
    this.running = (async () => {
      try {
        const csv = await run("tasklist.exe", ["/FO", "CSV", "/NH"], signal);
        if (!valid()) return;
        const names = parseTasklistImageNames(csv);
        for (const exe of this.blocked) {
          if (!valid()) return;
          if (!names.has(exe)) continue;
          try {
            await run("taskkill.exe", ["/F", "/IM", exe], signal);
            if (valid()) this.report({ type: "kill-success", exe });
          } catch {
            if (valid()) this.report({ type: "kill-failed", exe, message: "Không đóng được ứng dụng (quyền truy cập hoặc tiến trình đã thoát)." });
          }
        }
      } catch {
        if (valid()) this.report({ type: "scan-failed", message: "Không quét được tiến trình Windows." });
      }
    })().finally(() => { this.running = undefined; });
    return this.running;
  }
}
