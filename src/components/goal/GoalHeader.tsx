import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';

interface GoalHeaderProps {
  title: string;
  stepIndicator: string;
}

/** Screen header: large title on the left, "Step X of 3" indicator on the right. */
export function GoalHeader({ title, stepIndicator }: GoalHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={typography.title} accessibilityRole="header">
        {title}
      </Text>
      {/* Title passed as prop — Vietnamese copy lives in the screen */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{stepIndicator}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
});
