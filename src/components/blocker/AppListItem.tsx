import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';
import { AppIcon } from './AppIcon';
import type { RestrictedApp } from '@/types';

interface AppListItemProps {
  app: RestrictedApp;
  isSelected: boolean;
  onToggle: () => void;
}

export function AppListItem({ app, isSelected, onToggle }: AppListItemProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.container, isSelected && styles.selected]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <AppIcon id={app.id} name={app.name} packageName={app.packageName} category={app.category} size="md" selected={isSelected} />
      <View style={styles.info}>
        <Text style={styles.name}>{app.name}</Text>
        <Text style={styles.category}>{app.category}</Text>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '500',
  },
  category: {
    ...typography.label,
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
