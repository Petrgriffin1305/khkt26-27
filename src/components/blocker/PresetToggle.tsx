import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';
import type { AppPreset } from '@/types';

interface PresetToggleProps {
  preset: AppPreset;
  isActive: boolean;
  onPress: () => void;
}

export function PresetToggle({ preset, isActive, onPress }: PresetToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, isActive && styles.active]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={styles.icon}>{preset.icon}</Text>
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {preset.label}
      </Text>
      <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
        {isActive && <Text style={styles.checkmark}>✓</Text>}
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
    gap: spacing.sm,
  },
  active: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    ...typography.body,
    flex: 1,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
