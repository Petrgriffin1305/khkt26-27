import { create } from "zustand";
import {
  acceptTokens,
  ApiError,
  clearTokens,
  post,
  request,
  restoreTokens,
  setExpiredHandler,
} from "@/services/api";
import { tokenStorage } from "@/services/tokenStorage";
import type { AuthResponse, User } from "@/services/contracts";
const USER_KEY = "viendu.account";
function userStorages(): Storage[] {
  const read = (name: "localStorage" | "sessionStorage") => {
    try {
      return globalThis[name];
    } catch {
      return null;
    }
  };
  return [read("localStorage"), read("sessionStorage")].filter(
    (storage): storage is Storage => !!storage,
  );
}
function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<User>;
  return (
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    (user.avatar_url === null || typeof user.avatar_url === "string") &&
    typeof user.created_at === "string"
  );
}
function readCachedUser(): User | null {
  for (const storage of userStorages()) {
    let raw: string | null;
    try {
      raw = storage.getItem(USER_KEY);
    } catch {
      continue;
    }
    if (!raw) continue;
    try {
      const value: unknown = JSON.parse(raw);
      if (isUser(value)) {
        const user: User = {
          id: value.id,
          email: value.email,
          name: value.name,
          avatar_url: value.avatar_url,
          created_at: value.created_at,
        };
        cache(user);
        return user;
      }
    } catch {
      // Ignore malformed identity data; it is not an authentication credential.
    }
    try {
      storage.removeItem(USER_KEY);
    } catch {
      // Storage can be disabled; the app still opens in guest mode.
    }
  }
  return null;
}
function cache(user: User) {
  const value = JSON.stringify(user);
  for (const storage of userStorages()) {
    try {
      storage.setItem(USER_KEY, value);
    } catch {
      // The identity cache is best-effort and contains no credentials.
    }
  }
}
function clearCachedUser() {
  for (const storage of userStorages()) {
    try {
      storage.removeItem(USER_KEY);
    } catch {
      // Keep clearing the remaining local state if one store is unavailable.
    }
  }
}
interface AuthStore {
  user: User | null;
  ready: boolean;
  offline: boolean;
  needsLogin: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}
// Only the newest account operation may publish identity or clear credentials.
let authOperation = 0;
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  ready: false,
  offline: false,
  needsLogin: false,
  error: null,
  bootstrap: async () => {
    const current = ++authOperation;
    let cached: User | null = null;
    try {
      cached = readCachedUser();
      let refreshToken: string | null = null;
      try {
        refreshToken = await tokenStorage.get();
      } catch {
        // Treat unavailable session storage as a missing credential.
      }
      if (current !== authOperation) return;
      if (!refreshToken) {
        set({
          user: cached,
          offline: !!cached,
          needsLogin: !!cached,
          error: null,
        });
        return;
      }
      await restoreTokens();
      if (current !== authOperation) return;
      const user = await request<User>("/users/me");
      if (current !== authOperation) return;
      cache(user);
      set({ user, error: null, offline: false, needsLogin: false });
    } catch (error) {
      if (current !== authOperation) return;
      cached ??= readCachedUser();
      const needsLogin = error instanceof ApiError && error.status === 401;
      if (needsLogin) {
        try {
          await clearTokens();
        } catch {
          // A rejected credential must not hide the cached local owner.
        }
      }
      if (current !== authOperation) return;
      set({
        user: cached,
        offline: !!cached && !needsLogin,
        needsLogin: !!cached && needsLogin,
        error: error instanceof Error ? error.message : null,
      });
    } finally {
      if (current === authOperation) set({ ready: true });
    }
  },
  login: async (email, password, name) => {
    const current = ++authOperation;
    const result = await post<AuthResponse>(
      name ? "/auth/register" : "/auth/login",
      { email, password, ...(name ? { name } : {}) },
      false,
    );
    if (current !== authOperation)
      throw new ApiError(409, "Tài khoản đã thay đổi. Vui lòng thử lại.");
    await acceptTokens(result.tokens, () => current === authOperation);
    if (current !== authOperation)
      throw new ApiError(409, "Tài khoản đã thay đổi. Vui lòng thử lại.");
    cache(result.user);
    set({ user: result.user, ready: true, error: null, offline: false, needsLogin: false });
  },
  logout: async () => {
    const current = ++authOperation;
    try {
      await post("/auth/logout", {});
    } finally {
      if (current === authOperation) {
        try {
          await clearTokens();
        } catch {
          // The in-memory access token is cleared before storage is touched.
        }
        if (current === authOperation) {
          clearCachedUser();
          set({ user: null, ready: true, offline: false, needsLogin: false, error: null });
        }
      }
    }
  },
}));
setExpiredHandler(() => {
  const cached = readCachedUser();
  useAuthStore.setState({
    user: cached,
    offline: false,
    needsLogin: !!cached,
  });
});
