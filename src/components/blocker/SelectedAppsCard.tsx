import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';
import { AppIcon } from './AppIcon';
import type { RestrictedApp } from '@/types';

interface SelectedAppsCardProps {
  apps: RestrictedApp[];
}

export function SelectedAppsCard({ apps }: SelectedAppsCardProps) {
  const displayApps = apps.slice(0, 3);
  const remainingCount = apps.length - displayApps.length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Apps to Block</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{apps.length}</Text>
        </View>
      </View>

      <View style={styles.iconsRow}>
        {displayApps.map((app) => (
          <View key={app.id} style={styles.iconWrapper}>
            <AppIcon id={app.id} name={app.name} packageName={app.packageName} category={app.category} size="md" />
            <Text style={styles.appName} numberOfLines={1}>
              {app.name}
            </Text>
          </View>
        ))}

        {remainingCount > 0 && (
          <View style={styles.iconWrapper}>
            <View style={styles.moreBadge}>
              <Text style={styles.moreText}>+{remainingCount}</Text>
            </View>
            <Text style={styles.appName}>More</Text>
          </View>
        )}

        {apps.length === 0 && (
          <Text style={styles.emptyText}>No apps selected yet</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  appName: {
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 56,
    textAlign: 'center',
  },
  moreBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.bodySecondary,
    fontStyle: 'italic',
  },
});
