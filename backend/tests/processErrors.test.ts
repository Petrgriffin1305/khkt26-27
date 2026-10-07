import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, it } from "vitest";

it("logs unhandled rejections and exceptions while the process continues", async () => {
  const moduleUrl = new URL("../src/processErrors.ts", import.meta.url).href;
  const source = `
    await import(${JSON.stringify(moduleUrl)});
    Promise.reject(new Error('test rejection'));
    setTimeout(() => { throw new Error('test exception'); }, 10);
    setTimeout(() => { console.log('still running'); }, 50);
  `;
  const { stdout, stderr } = await promisify(execFile)(process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", source],
    { timeout: 5000 },
  );
  expect(stderr).toContain("Unhandled Rejection at:");
  expect(stderr).toContain("test rejection");
  expect(stderr).toContain("Uncaught Exception:");
  expect(stderr).toContain("test exception");
  expect(stdout).toContain("still running");
});
