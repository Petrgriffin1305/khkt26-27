// Session-only persistence survives reload without keeping a credential after
// the browser session ends. Never include this value in backups or logs.
const KEY = "viendu.refresh";
export const tokenStorage = {
  get: async () =>
    typeof window === "undefined" ? null : sessionStorage.getItem(KEY),
  set: async (token: string) => {
    sessionStorage.setItem(KEY, token);
  },
  clear: async () => {
    sessionStorage.removeItem(KEY);
  },
};
