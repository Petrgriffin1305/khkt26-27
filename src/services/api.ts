import Constants from "expo-constants";
import { tokenStorage } from "./tokenStorage";
import type { Tokens } from "./contracts";

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  // Nếu env trỏ về localhost mà app chạy trên thiết bị thật -> không kết nối được.
  const envIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(
    fromEnv ?? "",
  );
  if (fromEnv && !envIsLocalhost) return fromEnv.replace(/\/$/, "");
  // Suy ra IP LAN của máy chạy Metro từ hostUri (thiết bị thật luôn thấy host phát dev server).
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost;
  const hostIp = hostUri?.split(":")[0];
  if (hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1")
    return `http://${hostIp}:3000/api/v1`;
  // Fallback cuối: localhost chỉ dùng cho web/iOS simulator, không dùng được trên máy thật.
  return fromEnv?.replace(/\/$/, "") || "http://localhost:3000/api/v1";
}

export const API_URL = resolveApiUrl();
console.log("API base URL:", API_URL);
let accessToken: string | null = null;
let expiresAt = 0;
let refreshing: Promise<void> | null = null;
let onExpired: () => void = () => {};
let generation = 0;
export function setExpiredHandler(handler: () => void) {
  onExpired = handler;
}
export async function acceptTokens(tokens: Tokens) {
  await tokenStorage.set(tokens.refresh_token);
  accessToken = tokens.access_token;
  expiresAt = Date.now() + tokens.expires_in * 1000;
}
export async function clearTokens() {
  generation++;
  accessToken = null;
  await tokenStorage.clear();
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function fetchWithTimeout(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    path === "/quizzes/generate" ? 100000 : 30000,
  );
  const url = `${API_URL}${path}`;
  console.log("Calling API URL:", url);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const err = error as {
      message?: string;
      response?: unknown;
      config?: { url?: string };
    };
    console.error(
      "API request failed. message:",
      err?.message,
      "| response:",
      err?.response,
      "| config.url:",
      err?.config?.url,
      "| request URL:",
      url,
    );
    throw new ApiError(
      0,
      "Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
async function decode<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, "Máy chủ trả về dữ liệu không hợp lệ.");
  }
  if (!response.ok) {
    const problem = body as { detail?: string };
    throw new ApiError(response.status, problem.detail ?? "Yêu cầu thất bại.");
  }
  return body as T;
}
export async function restoreTokens() {
  if (!refreshing) {
    const current = generation;
    refreshing = (async () => {
      const refresh = await tokenStorage.get();
      if (!refresh) throw new ApiError(401, "Vui lòng đăng nhập.");
      const response = await fetchWithTimeout("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      const tokens = await decode<Tokens>(response);
      if (current === generation) await acceptTokens(tokens);
    })()
      .catch(async (error) => {
        if (error instanceof ApiError && error.status === 401) {
          await clearTokens();
          onExpired();
        }
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  await refreshing;
}
export async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (authenticated) {
    if (!accessToken) await restoreTokens();
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  let response = await fetchWithTimeout(path, { ...init, headers });
  if (authenticated && response.status === 401) {
    await restoreTokens();
    headers.set("Authorization", `Bearer ${accessToken}`);
    response = await fetchWithTimeout(path, { ...init, headers });
  }
  return decode<T>(response);
}
export const post = <T>(path: string, body: unknown, authenticated = true) =>
  request<T>(
    path,
    { method: "POST", body: JSON.stringify(body) },
    authenticated,
  );

export async function getAccessToken() {
  if (!accessToken || expiresAt - Date.now() < 30000) await restoreTokens();
  if (!accessToken) throw new ApiError(401, "Vui lòng đăng nhập.");
  return accessToken;
}
