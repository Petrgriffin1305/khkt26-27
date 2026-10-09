import { beforeEach, describe, expect, it, vi } from "vitest";

const authDeps = vi.hoisted(() => {
  class TestApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return {
    ApiError: TestApiError,
    acceptTokens: vi.fn(),
    clearTokens: vi.fn(),
    getRefreshToken: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
    restoreTokens: vi.fn(),
    expiredHandler: undefined as (() => void) | undefined,
  };
});

vi.mock("@/services/api", () => ({
  acceptTokens: authDeps.acceptTokens,
  ApiError: authDeps.ApiError,
  clearTokens: authDeps.clearTokens,
  post: authDeps.post,
  request: authDeps.request,
  restoreTokens: authDeps.restoreTokens,
  setExpiredHandler: (handler: () => void) => {
    authDeps.expiredHandler = handler;
  },
}));

vi.mock("@/services/tokenStorage", () => ({
  tokenStorage: {
    get: authDeps.getRefreshToken,
  },
}));

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const user = {
  id: "6fc7cd08-17bc-4a42-9abe-4ff4e7ee51a3",
  email: "learner@example.com",
  name: "Learner",
  avatar_url: null,
  created_at: "2026-10-08T00:00:00.000Z",
};
const tokens = {
  access_token: "access",
  refresh_token: "refresh",
  expires_in: 900,
};

describe("web account persistence", () => {
  let local: MemoryStorage;
  let session: MemoryStorage;
  let useAuthStore: typeof import("../../src/store/authStore").useAuthStore;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    authDeps.expiredHandler = undefined;
    local = new MemoryStorage();
    session = new MemoryStorage();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: local,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: session,
    });
    authDeps.getRefreshToken.mockResolvedValue(null);
    authDeps.restoreTokens.mockResolvedValue(undefined);
    authDeps.request.mockResolvedValue(user);
    authDeps.post.mockResolvedValue({ user, tokens });
    authDeps.clearTokens.mockImplementation(async () => {
      session.removeItem("viendu.refresh");
    });
    const module = await import("../../src/store/authStore");
    useAuthStore = module.useAuthStore;
  });

  it("restores the cached owner offline without attempting authentication when the refresh token is gone", async () => {
    local.setItem("viendu.account", JSON.stringify(user));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().offline).toBe(true);
    expect(useAuthStore.getState().needsLogin).toBe(true);
    expect(authDeps.restoreTokens).not.toHaveBeenCalled();
    expect(authDeps.request).not.toHaveBeenCalled();
  });

  it("keeps the cached owner and requires login after the server rejects refresh", async () => {
    local.setItem("viendu.account", JSON.stringify(user));
    authDeps.getRefreshToken.mockResolvedValue("refresh");
    authDeps.restoreTokens.mockRejectedValue(
      new authDeps.ApiError(401, "expired"),
    );

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().offline).toBe(false);
    expect(useAuthStore.getState().needsLogin).toBe(true);
    expect(authDeps.request).not.toHaveBeenCalled();
  });

  it("migrates a valid session-only identity cache for older browser sessions", async () => {
    session.setItem("viendu.account", JSON.stringify(user));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toEqual(user);
    expect(local.getItem("viendu.account")).toBe(JSON.stringify(user));
    expect(useAuthStore.getState().needsLogin).toBe(true);
  });

  it("keeps an authenticated owner usable offline when refresh cannot reach the server", async () => {
    local.setItem("viendu.account", JSON.stringify(user));
    authDeps.getRefreshToken.mockResolvedValue("refresh");
    authDeps.restoreTokens.mockRejectedValue(
      new authDeps.ApiError(0, "offline"),
    );

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().offline).toBe(true);
    expect(useAuthStore.getState().needsLogin).toBe(false);
  });

  it("clears local account identity and credentials even when server logout fails", async () => {
    local.setItem("viendu.account", JSON.stringify(user));
    session.setItem("viendu.account", JSON.stringify(user));
    session.setItem("viendu.refresh", "refresh");
    authDeps.getRefreshToken.mockResolvedValue("refresh");
    authDeps.post.mockRejectedValue(new authDeps.ApiError(0, "offline"));

    await useAuthStore.getState().bootstrap();
    await expect(useAuthStore.getState().logout()).rejects.toThrow("offline");

    expect(authDeps.clearTokens).toHaveBeenCalledOnce();
    expect(local.getItem("viendu.account")).toBeNull();
    expect(session.getItem("viendu.account")).toBeNull();
    expect(session.getItem("viendu.refresh")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().needsLogin).toBe(false);
  });

  it("ignores incomplete cached identity instead of assigning a local owner", async () => {
    local.setItem("viendu.account", JSON.stringify({ id: user.id }));
    authDeps.getRefreshToken.mockResolvedValue(null);

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().needsLogin).toBe(false);
    expect(authDeps.request).not.toHaveBeenCalled();
  });

  it("retains the local owner and requires login when an active token expires", async () => {
    authDeps.getRefreshToken.mockResolvedValue("refresh");
    authDeps.restoreTokens.mockResolvedValue(undefined);
    authDeps.request.mockResolvedValue(user);
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().needsLogin).toBe(false);

    authDeps.expiredHandler?.();

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().needsLogin).toBe(true);
    expect(local.getItem("viendu.account")).toBe(JSON.stringify(user));
  });

  it("clears the login requirement after successful reauthentication", async () => {
    local.setItem("viendu.account", JSON.stringify(user));
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().needsLogin).toBe(true);

    await useAuthStore.getState().login(user.email, "password123");

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().needsLogin).toBe(false);
    expect(useAuthStore.getState().offline).toBe(false);
  });

  it("does not restore an old cached owner after a new login finishes", async () => {
    local.setItem("viendu.account", JSON.stringify(user));
    authDeps.getRefreshToken.mockResolvedValue("refresh");
    let rejectRefresh!: (error: Error) => void;
    authDeps.restoreTokens.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
      rejectRefresh = reject;
    }));
    const bootstrap = useAuthStore.getState().bootstrap();
    await vi.waitFor(() => expect(authDeps.restoreTokens).toHaveBeenCalledOnce());
    const nextUser = { ...user, id: "new-user", email: "new@example.com" };
    authDeps.post.mockResolvedValueOnce({ user: nextUser, tokens });
    await useAuthStore.getState().login(nextUser.email, "password123");
    rejectRefresh(new authDeps.ApiError(401, "old refresh expired"));
    await bootstrap;
    expect(useAuthStore.getState().user).toEqual(nextUser);
    expect(useAuthStore.getState().ready).toBe(true);
    expect(authDeps.clearTokens).not.toHaveBeenCalled();
  });

  it("does not clear a new login when an older logout response finishes", async () => {
    await useAuthStore.getState().login(user.email, "password123");
    let finishLogout!: () => void;
    authDeps.post.mockImplementationOnce(() => new Promise<void>((resolve) => { finishLogout = resolve; }));
    const logout = useAuthStore.getState().logout();
    const nextUser = { ...user, id: "new-user", email: "new@example.com" };
    authDeps.post.mockResolvedValueOnce({ user: nextUser, tokens });
    await useAuthStore.getState().login(nextUser.email, "password123");
    finishLogout();
    await logout;
    expect(useAuthStore.getState().user).toEqual(nextUser);
    expect(local.getItem("viendu.account")).toBe(JSON.stringify(nextUser));
    expect(authDeps.clearTokens).not.toHaveBeenCalled();
  });
});
