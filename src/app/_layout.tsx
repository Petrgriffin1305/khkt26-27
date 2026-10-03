import "react-native-gesture-handler";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { useAuthStore } from "@/store/authStore";
export default function RootLayout() {
  const { user, ready, bootstrap } = useAuthStore();
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  if (!ready)
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Protected guard={!user}>
          <Stack.Screen name="auth" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="index" />
          <Stack.Screen name="app-blocker-setup" />
          <Stack.Screen name="timer-setup" />
          <Stack.Screen
            name="focus-timer"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="quiz" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="session-summary"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="history" />
          <Stack.Screen name="profile" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
