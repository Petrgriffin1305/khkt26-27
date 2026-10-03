import { useEffect } from "react";
import { BackHandler } from "react-native";
export function useBlockHardwareBack() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);
}
