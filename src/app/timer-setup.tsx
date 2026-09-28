import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme/colors';

/**
 * Page 3: Timer Setup (Placeholder)
 * To be implemented in the next iteration.
 */
export default function TimerSetupScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

      <View style={styles.body}>
        <Text style={styles.comingSoon}>⏱️</Text>
        <Text style={styles.title}>Focus Duration</Text>
        <Text style={styles.subtitle}>
          Timer setup screen — sẽ hoàn thành ở vòng lặp kế tiếp.
        </Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.accent,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  comingSoon: {
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
});
