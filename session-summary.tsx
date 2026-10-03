import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
<<<<<<< HEAD
import { colors, spacing, typography } from '@/theme/colors';

/**
 * Page 6 — Session Summary (Placeholder).
 * To be implemented in the next iteration.
 */
export default function SessionSummaryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.icon}>&#127881;</Text>
        <Text style={styles.title}>Session Summary</Text>
        <Text style={styles.subtitle}>
          Summary screen — will be completed in the next iteration.
        </Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.replace('/' as any)}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Back to start"
        >
          <Text style={styles.buttonText}>BACK TO START</Text>
=======
import { colors, radius, spacing, typography } from '@/theme/colors';
import { useSetupStore } from '@/store/setupStore';
import { useHistoryStore } from '@/store/historyStore';
import { quizBank } from '@/data/QuizBank';
import { StudySession } from '@/types';

export default function SessionSummaryScreen() {
  const { goalText, targetDurationSeconds, actualDurationSeconds, distractionAttempts, quizScore, isCompleted, reset } = useSetupStore();
  const { addSession } = useHistoryStore();

  const totalQuestions = quizBank.length;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const handleFinish = () => {
    const newSession: StudySession = {
      id: Date.now().toString(),
      goalText: goalText || 'Untitled Focus Session',
      topicId: 'default',
      targetDurationSeconds,
      actualDurationSeconds,
      distractionAttempts,
      quizScore,
      totalQuizQuestions: totalQuestions,
      isCompleted,
      timestamp: new Date().toISOString(),
    };
    
    addSession(newSession);
    reset();
    router.replace('/' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.badgeContainer}>
          <Text style={styles.icon}>{isCompleted ? '🎉' : '⚠️'}</Text>
          <Text style={styles.title}>
            {isCompleted ? 'Session Complete!' : 'Session Incomplete'}
          </Text>
          <Text style={styles.subtitle}>
            {isCompleted ? 'Great job staying focused.' : 'You ended the session early.'}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Topic</Text>
            <Text style={styles.statValue} numberOfLines={1}>{goalText || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Focus Duration</Text>
            <Text style={styles.statValue}>{formatTime(actualDurationSeconds)}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Distractions</Text>
            <Text style={styles.statValue}>{distractionAttempts}</Text>
          </View>
          
          {isCompleted && (
            <>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Quiz Score</Text>
                <Text style={styles.statValue}>{quizScore} / {totalQuestions}</Text>
              </View>
            </>
          )}
        </View>

        {isCompleted && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              {quizScore === totalQuestions 
                ? 'Perfect score! Your focus really paid off.' 
                : 'Good effort! Review the explanations to improve next time.'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleFinish}
          style={styles.button}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>FINISH & SAVE</Text>
>>>>>>> a2e8653 (1st)
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
  body: {
    flex: 1,
    alignItems: 'center',
<<<<<<< HEAD
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 48,
=======
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  icon: {
    fontSize: 64,
>>>>>>> a2e8653 (1st)
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
<<<<<<< HEAD
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
=======
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySecondary,
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statLabel: {
    ...typography.bodySecondary,
    fontSize: 16,
  },
  statValue: {
    ...typography.heading,
    fontSize: 16,
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  feedbackContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    width: '100%',
  },
  feedbackText: {
    ...typography.body,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
>>>>>>> a2e8653 (1st)
    paddingTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
<<<<<<< HEAD
=======
    color: "#FFFFFF",
>>>>>>> a2e8653 (1st)
    letterSpacing: 1,
  },
});
