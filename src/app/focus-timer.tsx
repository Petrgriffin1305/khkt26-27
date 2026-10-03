import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { CircularProgress } from "@/components/timer/CircularProgress";
import { DistractionAlertModal } from "@/components/timer/DistractionAlertModal";
import { AVAILABLE_APPS } from "@/data/restrictedApps";
import { elapsedFocusSeconds } from "@/utils/focusClock";
import type { DistractionEvent } from "@/types";
import { useSetupStore } from "@/store/setupStore";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { useDistractionMonitor } from "@/hooks/useDistractionMonitor";
import { colors, radius, spacing, typography } from "@/theme/colors";

/** Rotating motivational tips shown below the timer. */
const MOTIVATIONAL_TIPS = [
  "Stay focused — you are building your future.",
  "Small steps every day lead to big results.",
  "Your goal is within reach. Keep going.",
  "Distractions are temporary. Progress is permanent.",
  "You chose this goal. Now own it.",
  "One session at a time. You have got this.",
];

/**
 * Page 4 — Active Pomodoro Timer.
 * Expo Go records departures and shows a warning on return.
 * On completion: haptic feedback, navigate to Quiz.
 * On give-up: confirmation alert, end session early, save as incomplete.
 */
export default function FocusTimerScreen() {
  const {
    goalText,
    targetDurationSeconds,
    startedAt,
    clientId,
    distractionAttempts,
    distractionLog,
    restrictedApps,
    focusPausedAt,
    pausedDurationMs,
    logDistraction,
    resumeFocus,
    setDistractionAttempts,
    setIsCompleted,
    setActualDuration,
  } = useSetupStore();

  // Fallback to 25 minutes if no target duration is set
  const totalSeconds = targetDurationSeconds || 25 * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [simIndex, setSimIndex] = useState(0);
  const ended = useRef(false);

  const sendDistraction = useSessionRealtime(isRunning && !!clientId);

  // Distraction monitoring — isolated in custom hook
  const handleDistraction = (event: DistractionEvent) => {
    if (ended.current || useSetupStore.getState().focusPausedAt) return;
    logDistraction(event);
    if (!event.simulated) sendDistraction();
  };
  useDistractionMonitor({
    isActive: isRunning && !focusPausedAt,
    initialAttempts: useSetupStore.getState().distractionAttempts,
    onDistraction: handleDistraction,
  });

  // Timer progress: 0 = just started, 1 = finished
  const progress = (totalSeconds - remainingSeconds) / totalSeconds;

  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    setIsRunning(false);
    setDistractionAttempts(useSetupStore.getState().distractionAttempts);
    // Set session as completed with full target duration
    useSetupStore.getState().setStage("quiz");
    setIsCompleted(true);
    setActualDuration(totalSeconds);
    // Haptic feedback on completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    // Navigate to Quiz screen
    router.replace("/quiz");
  }, [setIsCompleted, setActualDuration, totalSeconds, setDistractionAttempts]);

  // Compare wall-clock time, since interval callbacks pause in the background.
  useEffect(() => {
    if (!clientId || !startedAt) {
      router.replace("/");
      return;
    }
    if (!isRunning) return;
    const update = () => {
      const state = useSetupStore.getState();
      const remaining = totalSeconds - elapsedFocusSeconds(
        startedAt, totalSeconds, state.pausedDurationMs, state.focusPausedAt,
      );
      setRemainingSeconds(remaining);
      if (remaining === 0 && !state.focusPausedAt) handleTimerComplete();
    };
    update();
    const interval = setInterval(update, 250);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isRunning, handleTimerComplete, startedAt, totalSeconds, clientId, focusPausedAt, pausedDurationMs]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  // Rotate motivational tips every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % MOTIVATIONAL_TIPS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const [confirmEnd, setConfirmEnd] = useState(false);

  // Handle give-up / end early
  const endEarly = () => {
    if (ended.current) return;
    ended.current = true;
    setConfirmEnd(false);
    setIsRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    const state = useSetupStore.getState();
    const elapsed = elapsedFocusSeconds(
      startedAt, totalSeconds, state.pausedDurationMs, state.focusPausedAt,
    );
    useSetupStore.getState().setStage("session-summary");
    setIsCompleted(false);
    setActualDuration(elapsed);
    router.replace("/session-summary");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header — back action disabled per spec */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.topicText} numberOfLines={2}>
            {goalText}
          </Text>
        </View>
        <View style={styles.shieldBadge}>
          <Text style={styles.shieldBadgeText}>Theo dõi tập trung</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <Text style={typography.bodySecondary}>
          Ứng dụng ghi nhận gián đoạn; chưa chặn các ứng dụng khác.
        </Text>
        {/* Circular Progress Ring with Countdown */}
        <View style={styles.timerContainer}>
          <CircularProgress progress={progress} size={280} strokeWidth={14}>
            <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </CircularProgress>
        </View>

        {/* Distraction Counter */}
        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>Số lần rời ứng dụng</Text>
          <Text style={styles.counterValue}>{distractionAttempts}</Text>
        </View>

        {/* Motivational Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>&#128161;</Text>
          <Text style={styles.tipText}>{MOTIVATIONAL_TIPS[tipIndex]}</Text>
        </View>
        {__DEV__ && (
          <Pressable
            accessibilityRole="button"
            style={styles.simulateButton}
            onPress={() => {
              const pool = restrictedApps.length ? restrictedApps : AVAILABLE_APPS;
              const app = pool[simIndex % pool.length];
              setSimIndex((value) => value + 1);
              handleDistraction({ timestamp: new Date().toISOString(), appId: app.id, appName: app.name, simulated: true });
            }}
          >
            <Text style={styles.simulateText}>Thử cảnh báo sao nhãng (mô phỏng)</Text>
          </Pressable>
        )}
      </ScrollView>

      <DistractionAlertModal
        visible={isRunning && !!focusPausedAt}
        appName={distractionLog.at(-1)?.appName ?? "Ứng dụng bên ngoài"}
        simulated={distractionLog.at(-1)?.simulated ?? false}
        onResume={resumeFocus}
        onAcceptViolation={resumeFocus}
      />

      {/* Emergency Action — Give Up / End Early */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => setConfirmEnd(true)}
          style={styles.giveUpButton}
          accessibilityRole="button"
          accessibilityLabel="Give up and end session early"
        >
          <Text style={styles.giveUpText}>Give Up / End Early</Text>
        </Pressable>
      </View>
      <Modal
        visible={confirmEnd}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmEnd(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: colors.overlay,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 24,
              gap: 16,
            }}
          >
            <Text style={typography.heading}>Kết thúc sớm?</Text>
            <Text style={typography.body}>
              Tiến trình sẽ được lưu thành phiên chưa hoàn thành.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmEnd(false)}
              style={{ padding: 16 }}
            >
              <Text style={typography.body}>Tiếp tục tập trung</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={endEarly}
              style={styles.giveUpButton}
            >
              <Text style={styles.giveUpText}>Kết thúc phiên học</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  topicText: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 24,
  },
  shieldBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  shieldBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
  body: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    gap: spacing.lg,
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
  },
  timerText: {
    fontSize: 52,
    fontWeight: "800",
    color: colors.text,
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  timerLabel: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  counterCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
  },
  counterLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.accent,
    fontVariant: ["tabular-nums"],
  },
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    width: "100%",
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    ...typography.bodySecondary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  simulateButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: "dashed",
    padding: spacing.md,
  },
  simulateText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  giveUpButton: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  giveUpText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.danger,
  },
});
