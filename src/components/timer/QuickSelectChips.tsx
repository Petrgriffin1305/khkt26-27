import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';

interface QuickSelectChipsProps {
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
}

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
];

/**
 * Quick-select duration chips (15m / 25m / 45m / 60m).
 * Tapping a chip sets the wheel picker to that duration.
 */
export function QuickSelectChips({
  selectedMinutes,
  onSelect,
}: QuickSelectChipsProps) {
  return (
    <View style={styles.container}>
      {PRESETS.map((preset) => {
        const isActive = selectedMinutes === preset.minutes;
        return (
          <Pressable
            key={preset.minutes}
            onPress={() => onSelect(preset.minutes)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && !isActive && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select ${preset.label}`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipPressed: {
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
