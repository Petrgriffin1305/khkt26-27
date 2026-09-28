import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalHeader } from '@/components/goal/GoalHeader';
import { GoalTextInput } from '@/components/goal/GoalTextInput';
import { MaterialsGrid } from '@/components/goal/MaterialsGrid';
import { PrimaryButton } from '@/components/goal/PrimaryButton';
import { useGoalSetup } from '@/hooks/useGoalSetup';
import { colors, spacing, typography } from '@/theme/colors';

/**
 * Page 1 — Goal Input.
 * Header: "Set Your Goal" + "Step 1 of 3".
 * Multi-line goal input, 2x2 materials grid, NEXT button (enabled when filled).
 */
export default function GoalInputScreen() {
  const {
    goalText,
    materials,
    isGoalFilled,
    setGoalText,
    pickMaterials,
    handleRemove,
  } = useGoalSetup();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GoalHeader title="Đặt mục tiêu" stepIndicator="Bước 1 trong 3" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>MỤC TIÊU CỦA BẠN</Text>
        <GoalTextInput value={goalText} onChangeText={setGoalText} />

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          TÀI LIỆU HỌC TẬP (TÙY CHỌN)
        </Text>
        <MaterialsGrid
          materials={materials}
          onAdd={pickMaterials}
          onRemove={handleRemove}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="TIẾP THEO"
          onPress={() => router.push('/app-blocker-setup')}
          disabled={!isGoalFilled}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionLabelSpaced: {
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
});
