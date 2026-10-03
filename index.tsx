import { router } from 'expo-router';
<<<<<<< HEAD
import { ScrollView, StyleSheet, Text, View } from 'react-native';
=======
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
>>>>>>> a2e8653 (1st)
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalHeader } from '@/components/goal/GoalHeader';
import { GoalTextInput } from '@/components/goal/GoalTextInput';
import { MaterialsGrid } from '@/components/goal/MaterialsGrid';
import { PrimaryButton } from '@/components/goal/PrimaryButton';
import { useGoalSetup } from '@/hooks/useGoalSetup';
import { colors, spacing, typography } from '@/theme/colors';
<<<<<<< HEAD

/**
 * Page 1 — Goal Input.
 * Header: "Set Your Goal" + "Step 1 of 3".
 * Multi-line goal input, 2x2 materials grid, NEXT button (enabled when filled).
 */
export default function GoalInputScreen() {
=======
import { useSetupStore } from '@/store/setupStore';
import { t } from '@/utils/i18n';

export default function GoalInputScreen() {
  const { language, toggleLanguage } = useSetupStore();
>>>>>>> a2e8653 (1st)
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
<<<<<<< HEAD
      <GoalHeader title="Đặt mục tiêu" stepIndicator="Bước 1 trong 3" />
=======
      
      <View style={styles.topActionsContainer}>
        <Pressable onPress={toggleLanguage} style={styles.langBtn}>
          <Text style={styles.langBtnText}>{language === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}</Text>
        </Pressable>
        <Pressable 
          onPress={() => router.push('/history' as any)}
          style={styles.historyBtn}
        >
          <Text style={styles.historyBtnText}>{t('history', language)}</Text>
        </Pressable>
      </View>

      <GoalHeader title={t('set_goal', language)} stepIndicator={t('step_1', language)} />
>>>>>>> a2e8653 (1st)

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
<<<<<<< HEAD
        <Text style={styles.sectionLabel}>MỤC TIÊU CỦA BẠN</Text>
        <GoalTextInput value={goalText} onChangeText={setGoalText} />

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          TÀI LIỆU HỌC TẬP (TÙY CHỌN)
=======
        <Text style={styles.sectionLabel}>{t('your_goal', language)}</Text>
        <GoalTextInput value={goalText} onChangeText={setGoalText} placeholder={t('goal_placeholder', language)} />

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('study_materials', language)}
>>>>>>> a2e8653 (1st)
        </Text>
        <MaterialsGrid
          materials={materials}
          onAdd={pickMaterials}
          onRemove={handleRemove}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
<<<<<<< HEAD
          label="TIẾP THEO"
=======
          label={t('next', language)}
>>>>>>> a2e8653 (1st)
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
<<<<<<< HEAD
=======
  topActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  langBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtnText: {
    ...typography.label,
    color: colors.text,
  },
  historyBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyBtnText: {
    ...typography.label,
    color: colors.text,
  },
>>>>>>> a2e8653 (1st)
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
