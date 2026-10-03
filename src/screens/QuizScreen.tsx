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
import { quizService } from '@/services/quizService';
import { useSetupStore } from '@/store/setupStore';
import { QuizQuestion } from '@/types';
import { colors, radius, spacing, typography } from '@/theme/colors';

interface QuizScreenProps {
  topicId?: string;
}

/**
 * Page 5 — Multiple Choice Quiz Assessment.
 * Questions are fetched through the quizService abstraction so the mock
 * bank can be swapped for a real backend later without touching the UI.
 */
export default function QuizScreen({ topicId }: QuizScreenProps) {
  const {
    goalText,
    setQuizScore,
    setTotalQuizQuestions,
    setIsCompleted,
  } = useSetupStore();

  const resolvedTopicId = topicId && topicId.length > 0 ? topicId : goalText || 'default';

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions for the current topic on mount
  useEffect(() => {
    let isMounted = true;

    quizService
      .getQuestionsByTopic(resolvedTopicId)
      .then((result) => {
        if (!isMounted) return;
        setQuestions(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Could not load quiz questions. Please try again.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedTopicId]);

  const finishQuiz = useCallback(
    (finalScore: number, total: number) => {
      setQuizScore(finalScore);
      setTotalQuizQuestions(total);
      setIsCompleted(true);
      router.replace('/session-summary' as any);
    },
    [setQuizScore, setTotalQuizQuestions, setIsCompleted],
  );

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      // Guard against double-taps once an answer is locked in
      if (selectedIndex !== null) return;

      const question = questions[currentIndex];
      if (!question) return;

      const correct = optionIndex === question.correctIndex;
      setSelectedIndex(optionIndex);
      setIsAnswerCorrect(correct);

      if (correct) {
        setScore((prev) => prev + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    },
    [selectedIndex, questions, currentIndex],
  );

  const handleNext = useCallback(() => {
    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      finishQuiz(score, questions.length);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
    setIsAnswerCorrect(null);
  }, [currentIndex, questions.length, score, finishQuiz]);

  const handleSkip = useCallback(() => {
    // Allow graceful exit from a broken/empty quiz into the summary flow
    setQuizScore(0);
    setTotalQuizQuestions(0);
    router.replace('/session-summary' as any);
  }, [setQuizScore, setTotalQuizQuestions]);

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerBody}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Error ----------
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerBody}>
          <Text style={styles.emptyIcon}>&#9888;&#65039;</Text>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={handleSkip}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Continue to session summary"
          >
            <Text style={styles.primaryButtonText}>CONTINUE ANYWAY</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Empty (no quiz for topic) ----------
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerBody}>
          <Text style={styles.emptyIcon}>&#128216;</Text>
          <Text style={styles.emptyTitle}>No quiz available</Text>
          <Text style={styles.emptySubtitle}>
            There are no questions for this topic yet. You can continue to your
            session summary.
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={handleSkip}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Skip quiz and view summary"
          >
            <Text style={styles.primaryButtonText}>SKIP TO SUMMARY</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const showExplanation = selectedIndex !== null && isAnswerCorrect !== null;
  const progressRatio = (currentIndex + (selectedIndex !== null ? 1 : 0)) / questions.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header: progress + score */}
      <View style={styles.header}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressLabel}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>Score: {score}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === question.correctIndex;

            let optionStyle = styles.optionButton;
            let optionTextStyle = styles.optionText;
            let trailing = '';

            if (selectedIndex !== null) {
              if (isCorrectOption) {
                optionStyle = [styles.optionButton, styles.optionCorrect] as any;
                optionTextStyle = [styles.optionText, styles.optionTextCorrect] as any;
                trailing = ' \u2713';
              } else if (isSelected) {
                optionStyle = [styles.optionButton, styles.optionIncorrect] as any;
                optionTextStyle = [styles.optionText, styles.optionTextIncorrect] as any;
                trailing = ' \u2717';
              } else {
                optionStyle = [styles.optionButton, styles.optionDimmed] as any;
                optionTextStyle = [styles.optionText, styles.optionTextDimmed] as any;
              }
            }

            return (
              <Pressable
                key={`${question.id}-${index}`}
                onPress={() => handleSelectOption(index)}
                disabled={selectedIndex !== null}
                style={({ pressed }) => [
                  optionStyle,
                  pressed && selectedIndex === null && styles.optionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Option ${index + 1}: ${option}`}
              >
                <Text style={optionTextStyle}>
                  {option}
                  {trailing}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation Card */}
        {showExplanation && (
          <View
            style={[
              styles.explanationCard,
              isAnswerCorrect ? styles.explanationCorrect : styles.explanationIncorrect,
            ]}
          >
            <Text
              style={[
                styles.explanationTitle,
                isAnswerCorrect ? styles.explanationTitleCorrect : styles.explanationTitleIncorrect,
              ]}
            >
              {isAnswerCorrect ? 'Correct!' : 'Not quite'}
            </Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleNext}
          disabled={selectedIndex === null}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            selectedIndex === null && styles.primaryButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLastQuestion ? 'Finish quiz' : 'Next question'}
        >
          <Text style={styles.primaryButtonText}>
            {isLastQuestion ? 'FINISH QUIZ' : 'NEXT QUESTION'}
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.label,
  },
  scoreBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  questionText: {
    ...typography.heading,
    fontSize: 19,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionPressed: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.accentSoft,
  },
  optionCorrect: {
    borderColor: colors.success,
    backgroundColor: '#EAF9EE',
  },
  optionIncorrect: {
    borderColor: colors.danger,
    backgroundColor: '#FDECEC',
  },
  optionDimmed: {
    opacity: 0.55,
  },
  optionText: {
    ...typography.body,
  },
  optionTextCorrect: {
    color: colors.success,
    fontWeight: '700',
  },
  optionTextIncorrect: {
    color: colors.danger,
    fontWeight: '700',
  },
  optionTextDimmed: {
    color: colors.textSecondary,
  },
  explanationCard: {
    marginTop: spacing.lg,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
  },
  explanationCorrect: {
    backgroundColor: '#EAF9EE',
    borderColor: colors.success,
  },
  explanationIncorrect: {
    backgroundColor: '#FDECEC',
    borderColor: colors.danger,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  explanationTitleCorrect: {
    color: colors.success,
  },
  explanationTitleIncorrect: {
    color: colors.danger,
  },
  explanationText: {
    ...typography.bodySecondary,
    lineHeight: 20,
  },
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodySecondary,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    ...typography.heading,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentPressed,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...typography.button,
    letterSpacing: 1,
  },
});
