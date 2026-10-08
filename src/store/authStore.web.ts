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
import { useSetupStore } from "./setupStore";
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
function claimOwner(user: User) {
  if (useSetupStore.getState().ownerId !== user.id)
    useSetupStore.getState().reset();
  useSetupStore.getState().setOwnerId(user.id);
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
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  ready: false,
  offline: false,
  needsLogin: false,
  error: null,
  bootstrap: async () => {
    let cached: User | null = null;
    try {
      await useSetupStore.persist.rehydrate();
      cached = readCachedUser();
      let refreshToken: string | null = null;
      try {
        refreshToken = await tokenStorage.get();
      } catch {
        // Treat unavailable session storage as a missing credential.
      }
      if (!refreshToken) {
        if (cached) claimOwner(cached);
        set({
          user: cached,
          offline: !!cached,
          needsLogin: !!cached,
          error: null,
        });
        return;
      }
      await restoreTokens();
      const user = await request<User>("/users/me");
      claimOwner(user);
      cache(user);
      set({ user, error: null, offline: false, needsLogin: false });
    } catch (error) {
      cached ??= readCachedUser();
      const needsLogin = error instanceof ApiError && error.status === 401;
      if (needsLogin) {
        try {
          await clearTokens();
        } catch {
          // A rejected credential must not hide the cached local owner.
        }
      }
      if (cached) claimOwner(cached);
      set({
        user: cached,
        offline: !!cached && !needsLogin,
        needsLogin: !!cached && needsLogin,
        error: error instanceof Error ? error.message : null,
      });
    } finally {
      set({ ready: true });
    }
  },
  login: async (email, password, name) => {
    const result = await post<AuthResponse>(
      name ? "/auth/register" : "/auth/login",
      { email, password, ...(name ? { name } : {}) },
      false,
    );
    await acceptTokens(result.tokens);
    cache(result.user);
    claimOwner(result.user);
    set({ user: result.user, error: null, offline: false, needsLogin: false });
  },
  logout: async () => {
    try {
      await post("/auth/logout", {});
    } finally {
      try {
        await clearTokens();
      } catch {
        // The in-memory access token is cleared before storage is touched.
      }
      clearCachedUser();
      try {
        useSetupStore.getState().reset();
      } finally {
        set({ user: null, offline: false, needsLogin: false, error: null });
      }
    }
  },
}));
setExpiredHandler(() => {
  const cached = readCachedUser();
  if (cached) claimOwner(cached);
  useAuthStore.setState({
    user: cached,
    offline: false,
    needsLogin: !!cached,
  });
});
