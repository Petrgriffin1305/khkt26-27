import { app, BrowserWindow, ipcMain, powerMonitor } from "electron";
import { join } from "node:path";
import { WindowsGuard, validateExecutableAllowlist } from "./services/windowsGuard";
import { FocusController } from "./focusController";
let window: BrowserWindow | undefined;
const guard: WindowsGuard = new WindowsGuard({ canScan: () => focus.isFocusActive(), onEvent: event => {
  focus.events.push(event); if (focus.events.length > 100) focus.events.shift();
} });
const focus: FocusController = new FocusController(guard);
let quitting = false;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { window?.show(); window?.focus(); });
  app.whenReady().then(() => {
    window = new BrowserWindow({ width: 520, height: 720, webPreferences: {
      preload: join(__dirname, "preload.js"), nodeIntegration: false,
      contextIsolation: true, sandbox: true,
    } });
    const channels: Record<string, (input?: unknown) => Promise<unknown>> = {
      "focus:start": async input => {
        if (!input || typeof input !== "object") throw new Error("Invalid Focus request");
        const value = input as Record<string, unknown>;
        const list = validateExecutableAllowlist(value.blockList);
        if (typeof value.durationSeconds !== "number" || value.confirmed !== true) throw new Error("Invalid Focus request");
        return focus.start({ durationSeconds: value.durationSeconds, blockList: list, confirmed: true });
      },
      "focus:stop": () => focus.stop(), "focus:pause": () => focus.pause(),
      "focus:resume": () => focus.resume(), "focus:status": () => focus.refresh(),
    };
    for (const [channel, handler] of Object.entries(channels)) ipcMain.handle(channel, (event, input) => {
      if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame)
        throw new Error("Untrusted IPC sender");
      return handler(input);
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", event => event.preventDefault());
    window.webContents.on("render-process-gone", () => { void focus.stop(); });
    window.on("closed", () => { window = undefined; void focus.stop(); app.quit(); });
    powerMonitor.on("resume", () => { void focus.refresh(); });
    void window.loadFile(join(__dirname, "../src/renderer/index.html"));
  });
  app.on("before-quit", event => {
    if (quitting) return;
    event.preventDefault(); quitting = true;
    const fallback = setTimeout(() => app.exit(), 3000);
    void focus.stop().finally(() => { clearTimeout(fallback); app.quit(); });
  });
}
