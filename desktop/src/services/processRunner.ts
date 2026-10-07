import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { win32 } from "node:path";
const execute = promisify(execFile);
export type ProcessRunner = (command: "tasklist.exe" | "taskkill.exe", args: string[], signal: AbortSignal) => Promise<string>;
export const runWindowsCommand: ProcessRunner = async (command, args, signal) => {
  const executable = win32.join(process.env.SystemRoot ?? "C:\\Windows", "System32", command);
  const result = await execute(executable, args, {
    shell: false, windowsHide: true, timeout: 2000, maxBuffer: 2 * 1024 * 1024,
    encoding: "utf8", signal,
  });
  return result.stdout;
};
export function parseTasklistImageNames(csv: string): Set<string> {
  const names = new Set<string>();
  for (const line of csv.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    if (!line.trim() || /^INFO:/i.test(line)) continue;
    const match = /^"((?:[^\"]|"")+)"\s*,/.exec(line);
    if (!match) throw new Error("Unexpected tasklist output");
    names.add(match[1].replaceAll('""', '"').toLowerCase());
  }
  return names;
}
