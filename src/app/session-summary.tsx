import { useBlockHardwareBack } from "@/hooks/useBlockHardwareBack";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { Screen, common, ErrorMessage } from "@/components/common/Screen";
import { PrimaryButton } from "@/components/goal/PrimaryButton";
import { useSetupStore } from "@/store/setupStore";
import { syncAnswers } from "@/services/study";
import type { ApiSession } from "@/services/contracts";
export default function SessionSummaryScreen() {
  useBlockHardwareBack();
  const state = useSetupStore();
  const [saved, setSaved] = useState<ApiSession | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const save = () =>
    syncAnswers()
      .then((session) => {
        setSaved(session);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Chưa lưu được phiên học."),
      )
      .finally(() => setBusy(false));
  useEffect(() => {
    if (!state.clientId) {
      router.replace("/");
      return;
    }
    void save();
  }, [state.clientId]);
  const finish = () => {
    if (!saved) return;
    state.reset();
    router.dismissAll();
    router.replace("/");
  };
  return (
    <Screen
      title={
        state.isCompleted ? "🎉 Hoàn thành phiên học!" : "Phiên học đã kết thúc"
      }
    >
      <View style={common.card}>
        <Text style={common.title}>
          {saved
            ? `${saved.quiz_score} / ${saved.total_quiz_questions}`
            : "Đang lưu…"}
        </Text>
        <Text style={common.muted}>
          {state.isCompleted
            ? "Câu trả lời đúng"
            : "Phiên dừng sớm, không thực hiện quiz"}
        </Text>
      </View>
      <View style={common.card}>
        <Text style={common.text}>Mục tiêu: {state.goalText}</Text>
        <Text style={common.text}>
          Tập trung: {Math.floor(state.actualDurationSeconds / 60)} phút{" "}
          {state.actualDurationSeconds % 60} giây
        </Text>
        <Text style={common.text}>
          Số lần rời ứng dụng: {state.distractionAttempts}
        </Text>
        <Text style={common.text}>
          Ứng dụng đã chọn: {state.restrictedApps.length}
        </Text>
      </View>
      {busy && <ActivityIndicator />}
      <ErrorMessage message={error} />
      {error && (
        <PrimaryButton
          label="THỬ LƯU LẠI"
          onPress={() => {
            setBusy(true);
            void save();
          }}
          disabled={busy}
        />
      )}
      {saved && <Text style={common.muted}>Đã lưu trên máy chủ.</Text>}
      <PrimaryButton
        label="HOÀN TẤT"
        onPress={finish}
        disabled={busy || !saved}
      />
    </Screen>
  );
}
