import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const KEY = "pomodoro.refresh";
// Web session is intentionally memory-only. Keychain/Keystore is used on mobile.
let webToken: string | null = null;
export const tokenStorage = {
  get: () =>
    Platform.OS === "web"
      ? Promise.resolve(webToken)
      : SecureStore.getItemAsync(KEY),
  set: (token: string) => {
    if (Platform.OS === "web") {
      webToken = token;
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(KEY, token);
  },
  clear: () => {
    if (Platform.OS === "web") {
      webToken = null;
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(KEY);
  },
};
