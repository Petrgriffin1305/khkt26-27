import { create } from "zustand";
import {
  acceptTokens,
  clearTokens,
  post,
  request,
  restoreTokens,
  setExpiredHandler,
} from "@/services/api";
import type { AuthResponse, User } from "@/services/contracts";
import { useSetupStore } from "./setupStore";
interface AuthStore {
  user: User | null;
  ready: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  ready: false,
  error: null,
  bootstrap: async () => {
    try {
      await useSetupStore.persist.rehydrate();
      await restoreTokens();
      const user = await request<User>("/users/me");
      if (useSetupStore.getState().ownerId !== user.id)
        useSetupStore.getState().reset();
      useSetupStore.getState().setOwnerId(user.id);
      set({ user, error: null });
    } catch (error) {
      set({ user: null, error: error instanceof Error ? error.message : null });
    } finally {
      set({ ready: true });
    }
  },
  login: async (email, password, name) => {
    const response = await post<AuthResponse>(
      name ? "/auth/register" : "/auth/login",
      { email, password, ...(name ? { name } : {}) },
      false,
    );
    await acceptTokens(response.tokens);
    if (useSetupStore.getState().ownerId !== response.user.id)
      useSetupStore.getState().reset();
    useSetupStore.getState().setOwnerId(response.user.id);
    set({ user: response.user, error: null });
  },
  logout: async () => {
    // A failed network logout stays retryable instead of silently abandoning a live refresh token.
    await post<void>("/auth/logout", {});
    await clearTokens();
    useSetupStore.getState().reset();
    set({ user: null });
  },
}));
setExpiredHandler(() => {
  useAuthStore.setState({ user: null });
});
