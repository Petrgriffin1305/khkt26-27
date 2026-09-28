import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';

interface GoalTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/** Multi-line goal input with subtle border and accent focus ring. */
export function GoalTextInput({
  value,
  onChangeText,
  placeholder = 'Hôm nay bạn muốn học gì? (VD: Chương 3 Lịch sử...)',
}: GoalTextInputProps) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
        accessibilityLabel="Ô nhập mục tiêu học tập"
        accessibilityHint="Nhập nội dung bạn muốn học hôm nay"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    ...typography.body,
    minHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    lineHeight: 22,
  },
});
