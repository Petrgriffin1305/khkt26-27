import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme/colors';

/**
 * Page 5 — Multiple Choice Quiz (Placeholder).
 * To be implemented in the next iteration.
 */
export default function QuizScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.icon}>&#128221;</Text>
        <Text style={styles.title}>Quiz</Text>
        <Text style={styles.subtitle}>
          Quiz screen — will be completed in the next iteration.
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    letterSpacing: 1,
  },
});
