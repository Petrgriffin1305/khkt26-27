import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "@/theme/colors";
export const common = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    gap: 16,
    flexGrow: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  title: { ...typography.title },
  text: { ...typography.body },
  muted: { ...typography.bodySecondary },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 52,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  error: { color: colors.danger, fontSize: 15 },
  link: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 12,
  },
});
export function Screen({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <SafeAreaView style={common.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={common.content}
      >
        <Text style={common.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <View accessibilityLiveRegion="polite">
      <Text style={common.error}>{message}</Text>
    </View>
  ) : null;
}
