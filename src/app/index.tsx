import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { request } from "@/services/api";
import type { Topic } from "@/services/contracts";
import { useSetupStore } from "@/store/setupStore";
import { ErrorMessage } from "@/components/common/Screen";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoalHeader } from "@/components/goal/GoalHeader";
import { GoalTextInput } from "@/components/goal/GoalTextInput";
import { MaterialsGrid } from "@/components/goal/MaterialsGrid";
import { PrimaryButton } from "@/components/goal/PrimaryButton";
import { useGoalSetup } from "@/hooks/useGoalSetup";
import { colors, spacing, typography } from "@/theme/colors";

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

  const { topicId, setTopicId, clientId, stage, documentText, setDocumentText } = useSetupStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loadTopics = useCallback(() => {
    void request<{ topics: Topic[] }>("/topics")
      .then((r) => {
        setError(null);
        setTopics(r.topics);
        if (
          r.topics.length &&
          !r.topics.some((t) => t.id === useSetupStore.getState().topicId)
        )
          setTopicId(r.topics[0].id);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Không tải được chủ đề."),
      );
  }, [setTopicId]);
  useEffect(() => {
    loadTopics();
  }, [loadTopics]);
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <GoalHeader title="Đặt mục tiêu" stepIndicator="Bước 1 trong 3" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/history")}
          >
            <Text style={{ color: colors.accent }}>Lịch sử học</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile")}
          >
            <Text style={{ color: colors.accent }}>Tài khoản</Text>
          </Pressable>
        </View>
        {clientId && (
          <View style={{ gap: 12, marginBottom: 24 }}>
            <Text style={typography.body}>Bạn có phiên học chưa hoàn tất.</Text>
            <PrimaryButton
              label="TIẾP TỤC PHIÊN HỌC"
              onPress={() => router.replace(`/${stage}`)}
            />
          </View>
        )}
        <Text style={styles.sectionLabel}>CHỦ ĐỀ</Text>
        <ErrorMessage message={error} />
        {error && (
          <Pressable accessibilityRole="button" onPress={loadTopics}>
            <Text style={{ color: colors.accent, padding: 12 }}>
              Thử tải lại
            </Text>
          </Pressable>
        )}
        <View style={{ gap: 8, marginBottom: 24 }}>
          {topics.map((topic) => (
            <Pressable
              key={topic.id}
              accessibilityRole="button"
              accessibilityState={{ selected: topic.id === topicId }}
              disabled={!!clientId}
              onPress={() => setTopicId(topic.id)}
              style={{
                padding: 16,
                borderRadius: 14,
                backgroundColor:
                  topic.id === topicId ? colors.accentSoft : colors.card,
                borderWidth: 1,
                borderColor:
                  topic.id === topicId ? colors.accent : colors.border,
              }}
            >
              <Text style={typography.body}>
                {topic.icon} {topic.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionLabel}>MỤC TIÊU CỦA BẠN (3–500 KÝ TỰ)</Text>
        <GoalTextInput
          value={goalText}
          onChangeText={(text) => {
            if (!clientId) setGoalText(text);
          }}
        />

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          TÀI LIỆU HỌC TẬP (TÙY CHỌN)
        </Text>
        <Text style={styles.sectionLabel}>VĂN BẢN CHO GEMINI (TÙY CHỌN)</Text>
        <TextInput
          accessibilityLabel="Văn bản học tập cho Gemini"
          multiline maxLength={50000} editable={!clientId}
          value={documentText} onChangeText={setDocumentText}
          placeholder="Dán nội dung bài học (ít nhất 10 ký tự) hoặc để trống để tạo theo chủ đề"
          style={{ minHeight: 120, padding: 16, marginBottom: 16, backgroundColor: colors.card, color: colors.text, borderRadius: 14, textAlignVertical: "top" }}
        />
        <MaterialsGrid
          materials={materials}
          onAdd={() => {
            if (!clientId) void pickMaterials();
          }}
          onRemove={(id) => {
            if (!clientId) handleRemove(id);
          }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="TIẾP THEO"
          onPress={() => router.push("/app-blocker-setup")}
          disabled={
            !!clientId || !isGoalFilled || !topics.some((t) => t.id === topicId)
          }
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
