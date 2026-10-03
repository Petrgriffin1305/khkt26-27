import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSetupStore } from '@/store/setupStore';
import { sessionStorage } from '@/services/storage';
import { StudySession } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/colors';

/**
 * Generate a simple unique ID for the session.
 * In production, use expo-crypto or a UUID library.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format seconds into a human-readable duration string.
 * Examples: 90 -> "1m 30s", 3661 -> "1h 1m 1s", 45 -> "45s"
 */
function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Get feedback text based on quiz score ratio.
 */
function getFeedbackMessage(score: number, total: number): string {
  if (total === 0) return 'No quiz was available for this topic.';
  const ratio = score / total;
  if (ratio === 1) return 'Perfect score! You have mastered this topic.';
  if (ratio >= 0.7) return 'Great job! You have a strong understanding.';
  if (ratio >= 0.4) return 'Good effort! Review the explanations to improve.';
  return 'Keep practicing! Review the material and try again.';
}

/**
 * Page 6 — Session Summary.
 * Displays the completed or abandoned study session with stats,
 * then persists to local storage and resets the flow.
 */
export default function SessionSummaryScreen() {
  const {
    goalText,
    targetDurationSeconds,
    actualDurationSeconds,
    distractionAttempts,
    quizScore,
    totalQuizQuestions,
    isCompleted,
    restrictedApps,
    reset,
  } = useSetupStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.load().catch(() => {});
  }, []);

  const handleFinishAndSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const session: StudySession = {
        id: generateId(),
        goalText,
        topicId: goalText,
        targetDurationSeconds,
        actualDurationSeconds,
        distractionAttempts,
        quizScore,
        totalQuizQuestions,
        isCompleted,
        timestamp: new Date().toISOString(),
      };

      await sessionStorage.saveSession(session);

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});

      reset();
      router.replace('/');
    } catch (_error) {
      setSaveError('Failed to save session. Please try again.');
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
      setIsSaving(false);
    }
  }, [
    goalText,
    targetDurationSeconds,
    actualDurationSeconds,
    distractionAttempts,
    quizScore,
    totalQuizQuestions,
    isCompleted,
    reset,
  ]);

  const feedbackMessage = getFeedbackMessage(quizScore, totalQuizQuestions);
  const appsBlockedCount = restrictedApps.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeEmoji}>{isCompleted ? '\uD83C\uDF89' : '\uD83D\uDCA1'}</Text>
          </View>
          <Text style={styles.badgeTitle}>
            {isCompleted ? 'Session Complete!' : 'Session Ended'}
          </Text>
          <Text style={styles.badgeSubtitle}>
            {isCompleted
              ? 'You focused successfully and completed your goal.'
              : 'You ended the session early. Every attempt counts.'}
          </Text>
        </View>

        {/* Score Card — only show if session was completed */}
        {isCompleted && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Quiz Score</Text>
            <Text style={styles.scoreValue}>
              {quizScore} / {totalQuizQuestions}
            </Text>
            <Text style={styles.scoreFeedback}>{feedbackMessage}</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>
              {formatDuration(actualDurationSeconds)}
            </Text>
            <Text style={styles.statLabel}>Focus Duration</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue} numberOfLines={2}>
              {goalText}
            </Text>
            <Text style={styles.statLabel}>Topic Studied</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚠️</Text>
            <Text style={styles.statValue}>{distractionAttempts}</Text>
            <Text style={styles.statLabel}>Distractions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚫</Text>
            <Text style={styles.statValue}>{appsBlockedCount}</Text>
            <Text style={styles.statLabel}>Apps Blocked</Text>
          </View>
        </View>

        {/* Save Error */}
        {saveError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleFinishAndSave}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            isSaving && styles.saveButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Finish and save session"
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>FINISH & SAVE</Text>
          )}
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  badgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  badgeTitle: {
    ...typography.heading,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  badgeSubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xs,
  },
  scoreFeedback: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '47%',
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.label,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.accentPressed,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    letterSpacing: 1,
  },
});
