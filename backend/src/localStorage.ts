import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { config } from "./config.js";
import { ApiError } from "./errors.js";
function pathFor(key: string) {
  if (!/^documents\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/.test(key))
    throw new ApiError(400, "validation-error", "Invalid storage key");
  return join(resolve(config.LOCAL_STORAGE_DIR), key);
}
export async function localUpload(key: string, body: Buffer) {
  const path = pathFor(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, { flag: "wx" });
}
export const localRead = (key: string) => readFile(pathFor(key));
export const localDelete = (key: string) => rm(pathFor(key), { force: true });
export const localHealth = () =>
  mkdir(resolve(config.LOCAL_STORAGE_DIR), { recursive: true });
const signature = (id: string, expires: number) =>
  createHmac("sha256", config.JWT_SECRET)
    .update(`document-download:${id}:${expires}`)
    .digest("hex");
export function localUrl(id: string) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  return `${config.PUBLIC_API_ORIGIN}/files/${id}?expires=${expires}&signature=${signature(id, expires)}`;
}
export function verifyLocalUrl(id: string, expires: number, supplied: string) {
  if (
    expires < Math.floor(Date.now() / 1000) ||
    expires > Math.floor(Date.now() / 1000) + 3600 ||
    !/^\w{64}$/.test(supplied)
  )
    return false;
  return timingSafeEqual(
    Buffer.from(supplied),
    Buffer.from(signature(id, expires)),
  );
}
