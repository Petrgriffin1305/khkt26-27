import { uploadMaterials } from "@/services/study";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing, typography } from "@/theme/colors";
import { useSetupStore } from "@/store/setupStore";
import { TimeWheelPicker } from "@/components/timer/TimeWheelPicker";
import { QuickSelectChips } from "@/components/timer/QuickSelectChips";
import { PrimaryButton } from "@/components/goal/PrimaryButton";

/**
 * Page 3: Timer Setup
 * Quick-select chips + wheel picker (HH:MM:SS, default 00:25:00).
 * "START FOCUS" activates the restriction shield and navigates to FocusTimer.
 */
export default function TimerSetupScreen() {
  const { goalText, restrictedApps, targetDurationSeconds, setTargetDuration } =
    useSetupStore();

  // Derive initial h/m/s from the store (default 25:00)
  const [hours, setHours] = useState(Math.floor(targetDurationSeconds / 3600));
  const [minutes, setMinutes] = useState(
    Math.floor((targetDurationSeconds % 3600) / 60),
  );
  const [seconds, setSeconds] = useState(targetDurationSeconds % 60);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const isValid =
    totalSeconds >= 60 && totalSeconds <= 72000 && goalText.trim().length >= 3;

  const handleWheelChange = useCallback((h: number, m: number, s: number) => {
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  }, []);

  const handleChipSelect = useCallback((mins: number) => {
    setHours(Math.floor(mins / 60));
    setMinutes(mins % 60);
    setSeconds(0);
  }, []);

  const [busy, setBusy] = useState(false);
  const handleStartFocus = async () => {
    if (!isValid || busy) return;
    setBusy(true);
    try {
      await uploadMaterials();
    } catch (error) {
      Alert.alert(
        "Không tải được tài liệu",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
      setBusy(false);
      return;
    }
    // Haptic feedback on start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Save duration to store
    setTargetDuration(totalSeconds);
    useSetupStore.getState().beginSession(Crypto.randomUUID());
    // Navigate to Focus Timer (shield activates there)
    router.replace("/focus-timer");
    setBusy(false);
  };

  const blockedCount = restrictedApps.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Bước 3 trong 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Focus Duration</Text>
          <Text style={styles.subtitle}>
            Chọn thời gian tập trung cho phiên học của bạn
          </Text>
        </View>

        {/* Summary Badge */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mục tiêu</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {goalText || "Chưa đặt mục tiêu"}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ứng dụng đã chọn</Text>
            <Text style={styles.summaryValue}>{blockedCount} apps</Text>
          </View>
        </View>

        {/* Quick Select Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn nhanh</Text>
          <QuickSelectChips
            selectedMinutes={Math.floor(totalSeconds / 60)}
            onSelect={handleChipSelect}
          />
        </View>

        {/* Wheel Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Hoặc chỉnh thủ công (1 phút – 20 giờ)
          </Text>
          <TimeWheelPicker
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            onChange={handleWheelChange}
          />
        </View>

        {/* Total Duration Display */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng thời gian</Text>
          <Text style={styles.totalValue}>
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <PrimaryButton
          label={busy ? "ĐANG TẢI TÀI LIỆU…" : "BẮT ĐẦU TẬP TRUNG"}
          onPress={() => {
            void handleStartFocus();
          }}
          disabled={!isValid || busy}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 26,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    ...typography.label,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: "center",
  },
  totalLabel: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.accent,
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
});
