import { afterAll, beforeAll, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../src/config.js";
import {
  localUpload,
  localRead,
  localDelete,
  localUrl,
  verifyLocalUrl,
} from "../src/localStorage.js";
let directory: string;
const original = config.LOCAL_STORAGE_DIR;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "pomodoro-storage-test-"));
  config.LOCAL_STORAGE_DIR = directory;
});
afterAll(async () => {
  config.LOCAL_STORAGE_DIR = original;
  await rm(directory, { recursive: true, force: true });
});
it("stores files locally and rejects path traversal", async () => {
  const key = `documents/${randomUUID()}/${randomUUID()}`;
  await localUpload(key, Buffer.from("study"));
  expect((await localRead(key)).toString()).toBe("study");
  await localDelete(key);
  await expect(localRead(key)).rejects.toThrow();
  await expect(localUpload("../outside", Buffer.from("bad"))).rejects.toThrow(
    "Invalid storage key",
  );
});
it("signs expiring document URLs and rejects tampering", () => {
  const id = randomUUID();
  const url = new URL(localUrl(id));
  const expires = Number(url.searchParams.get("expires"));
  const signature = url.searchParams.get("signature")!;
  expect(verifyLocalUrl(id, expires, signature)).toBe(true);
  expect(verifyLocalUrl(randomUUID(), expires, signature)).toBe(false);
  expect(verifyLocalUrl(id, expires - 7200, signature)).toBe(false);
  expect(verifyLocalUrl(id, expires, "x".repeat(64))).toBe(false);
});
