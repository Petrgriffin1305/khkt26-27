import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="app-blocker-setup" />
        <Stack.Screen name="timer-setup" />
        <Stack.Screen name="focus-timer" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="session-summary" />
      </Stack>
    </SafeAreaProvider>
  );
}
