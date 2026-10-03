import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme/colors';
import { useHistoryStore } from '@/store/historyStore';

export default function HistoryScreen() {
  const { sessions, clearHistory } = useHistoryStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Trở về</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Lịch sử học tập</Text>
        <Pressable onPress={clearHistory} style={styles.clearBtn}>
          <Text style={styles.clearText}>Xóa</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có phiên học nào.</Text>
          </View>
        ) : (
          sessions.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.topicText} numberOfLines={1}>{s.goalText}</Text>
                <View style={[styles.badge, s.isCompleted ? styles.badgeSuccess : styles.badgeFail]}>
                  <Text style={styles.badgeText}>{s.isCompleted ? 'Hoàn thành' : 'Bỏ cuộc'}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{formatDate(s.timestamp)}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Thời gian</Text>
                  <Text style={styles.statValue}>{formatTime(s.actualDurationSeconds)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Xao nhãng</Text>
                  <Text style={styles.statValue}>{s.distractionAttempts}</Text>
                </View>
                {s.isCompleted && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Điểm Quiz</Text>
                    <Text style={styles.statValue}>{s.quizScore}/{s.totalQuizQuestions}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    ...typography.bodySecondary,
    color: colors.text,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  clearText: {
    ...typography.label,
    color: colors.danger,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    ...typography.bodySecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  topicText: {
    ...typography.heading,
    fontSize: 16,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeFail: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dateText: {
    ...typography.bodySecondary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.text + '80',
    marginBottom: 2,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
  },
});
