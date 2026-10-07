import { randomUUID } from "node:crypto";
import { WindowsGuard, type GuardEvent } from "./services/windowsGuard";
type FocusState = "idle" | "running" | "paused" | "completed" | "stopped";
export class FocusController {
  private queue: Promise<unknown> = Promise.resolve();
  private timer?: ReturnType<typeof setInterval>;
  private deadline = 0;
  private pausedRemaining = 0;
  private state: FocusState = "idle";
  private sessionId: string | null = null;
  readonly events: GuardEvent[] = [];
  constructor(readonly guard: WindowsGuard, private now = Date.now) {}
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation); this.queue = next.catch(() => {}); return next;
  }
  isFocusActive() { return this.state === "paused" || (this.state === "running" && this.deadline > this.now()); }
  getStatus() {
    return { state: this.state, sessionId: this.sessionId, blocker: this.guard.status,
      remainingSeconds: Math.max(0, Math.ceil((this.state === "paused" ? this.pausedRemaining : this.deadline - this.now()) / 1000)),
      events: this.events.slice(-20) };
  }
  start(input: { durationSeconds: number; blockList: string[]; confirmed: boolean }) {
    return this.serialize(async () => {
      if (this.state === "running" || this.state === "paused") throw new Error("Đã có phiên Focus đang chạy.");
      if (!input.confirmed || !Number.isInteger(input.durationSeconds) || input.durationSeconds < 60 || input.durationSeconds > 72000)
        throw new Error("Cần xác nhận đóng ứng dụng và thời lượng 1 phút–20 giờ.");
      this.events.length = 0; this.sessionId = randomUUID();
      this.deadline = this.now() + input.durationSeconds * 1000; this.state = "running";
      try { await this.guard.startBlocker(input.blockList); }
      catch (error) { this.state = "idle"; this.deadline = 0; this.sessionId = null; throw error; }
      this.timer = setInterval(() => { void this.refresh().catch(() => {}); }, 250);
      return this.getStatus();
    });
  }
  refresh() {
    return this.serialize(async () => {
      if (this.state === "running" && this.deadline <= this.now()) await this.end("completed");
      return this.getStatus();
    });
  }
  pause() {
    return this.serialize(async () => {
      if (this.state === "running" && this.deadline <= this.now()) await this.end("completed");
      else if (this.state === "running") { this.pausedRemaining = this.deadline - this.now(); this.state = "paused"; }
      return this.getStatus();
    });
  }
  resume() {
    return this.serialize(async () => {
      if (this.state === "paused") { this.deadline = this.now() + this.pausedRemaining; this.state = "running"; }
      return this.getStatus();
    });
  }
  stop() { return this.serialize(async () => { await this.end("stopped"); return this.getStatus(); }); }
  private async end(state: "completed" | "stopped") {
    clearInterval(this.timer); this.timer = undefined;
    this.state = state; this.deadline = 0; this.pausedRemaining = 0;
    await this.guard.stopBlocker();
  }
}
