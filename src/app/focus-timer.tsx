import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CircularProgress } from '@/components/timer/CircularProgress';
import { useSetupStore } from '@/store/setupStore';
import { useDistractionMonitor } from '@/hooks/useDistractionMonitor';
import { colors, radius, spacing, typography } from '@/theme/colors';

/** Rotating motivational tips shown below the timer. */
const MOTIVATIONAL_TIPS = [
  'Stay focused — you are building your future.',
  'Small steps every day lead to big results.',
  'The shield is active. Your goal is within reach.',
  'Distractions are temporary. Progress is permanent.',
  'You chose this goal. Now own it.',
  'One session at a time. You have got this.',
];

/**
 * Page 4 — Active Pomodoro Timer.
 * The App Restriction Shield is ACTIVE during this screen.
 * On completion: haptic feedback, unlock shield, navigate to Quiz.
 * On give-up: confirmation alert, end session early, save as incomplete.
 */
export default function FocusTimerScreen() {
  const {
    goalText,
    targetDurationSeconds,
    isCompleted,
    reset,
    setIsCompleted,
    setActualDuration,
    setDistractionAttempts,
  } = useSetupStore();

  // Fallback to 25 minutes if no target duration is set
  const totalSeconds = targetDurationSeconds || 25 * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  // Distraction monitoring — isolated in custom hook
  const { distractionAttempts } = useDistractionMonitor({
    isActive: isRunning,
  });

  // Timer progress: 0 = just started, 1 = finished
  const progress = (totalSeconds - remainingSeconds) / totalSeconds;

  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    // Set session as completed with full target duration
    setIsCompleted(true);
    setActualDuration(totalSeconds);
    setDistractionAttempts(distractionAttempts);
    // Haptic feedback on completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    // Navigate to Quiz screen
    router.replace('/quiz' as any);
  }, [setIsCompleted, setActualDuration, setDistractionAttempts, distractionAttempts, totalSeconds]);

  // Countdown timer effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleTimerComplete]);

  // Rotate motivational tips every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % MOTIVATIONAL_TIPS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle give-up / end early
  const handleGiveUp = () => {
    Alert.alert(
      'End Session Early?',
      'Your progress will be saved as an incomplete session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            // Haptic feedback for giving up
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            // Calculate actual focus time (elapsed seconds)
            const elapsedSeconds = totalSeconds - remainingSeconds;
            // Set session as incomplete with actual duration
            setIsCompleted(false);
            setActualDuration(elapsedSeconds);
            setDistractionAttempts(distractionAttempts);
            // End restriction (shield deactivation) and navigate to summary
            router.replace('/session-summary' as any);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header — back action disabled per spec */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.topicText} numberOfLines={2}>
            {goalText}
          </Text>
        </View>
        <View style={styles.shieldBadge}>
          <Text style={styles.shieldBadgeText}>Shield Active</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Circular Progress Ring with Countdown */}
        <View style={styles.timerContainer}>
          <CircularProgress progress={progress} size={280} strokeWidth={14}>
            <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </CircularProgress>
        </View>

        {/* Distraction Counter */}
        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>Distraction Attempts</Text>
          <Text style={styles.counterValue}>{distractionAttempts}</Text>
        </View>

        {/* Motivational Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>&#128161;</Text>
          <Text style={styles.tipText}>{MOTIVATIONAL_TIPS[tipIndex]}</Text>
        </View>
      </View>

      {/* Emergency Action — Give Up / End Early */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleGiveUp}
          style={styles.giveUpButton}
          accessibilityRole="button"
          accessibilityLabel="Give up and end session early"
        >
          <Text style={styles.giveUpText}>Give Up / End Early</Text>
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shieldBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerLabel: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  counterCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  counterLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    width: '100%',
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
  giveUpButton: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  giveUpText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
});
