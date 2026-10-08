import { useEffect } from "react";
import { Slot, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AdventureApp from "@/adventure/AdventureApp";
export default function WebLayout() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = "vi";
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Local persistence still works if service workers are disabled.
      });
    }
  }, []);
  return (
    <SafeAreaProvider>
      {pathname === "/" && <AdventureApp />}
      <Slot />
    </SafeAreaProvider>
  );
}
