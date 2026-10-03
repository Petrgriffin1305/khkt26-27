import { useBlockHardwareBack } from "@/hooks/useBlockHardwareBack";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Screen, common, ErrorMessage } from "@/components/common/Screen";
import { PrimaryButton } from "@/components/goal/PrimaryButton";
import { useSetupStore } from "@/store/setupStore";
import { loadQuiz, syncAnswers } from "@/services/study";
import { colors } from "@/theme/colors";
export default function QuizScreen() {
  useBlockHardwareBack();
  const { quizQuestions, answers, answer, materials, clientId, isCompleted } =
    useSetupStore();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = (generate = false) =>
    loadQuiz(generate)
      .then(() => {
        setError(null);
        const current = useSetupStore.getState();
        const unanswered = current.quizQuestions.findIndex(
          (q) => current.answers[q.id] === undefined,
        );
        setIndex(
          unanswered < 0
            ? Math.max(0, current.quizQuestions.length - 1)
            : unanswered,
        );
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Không tải được quiz."),
      )
      .finally(() => setBusy(false));
  useEffect(() => {
    if (!clientId || !isCompleted) {
      router.replace("/");
      return;
    }
    void load();
  }, [clientId, isCompleted]);
  const question = quizQuestions[index];
  const selected = question ? answers[question.id] : undefined;
  const next = async () => {
    setBusy(true);
    setError(null);
    try {
      await syncAnswers();
      if (index < quizQuestions.length - 1) setIndex(index + 1);
      else {
        useSetupStore.getState().setStage("session-summary");
        router.replace("/session-summary");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được câu trả lời.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Kiểm tra kiến thức">
      {busy && <ActivityIndicator color={colors.accent} />}
      <ErrorMessage message={error} />
      {error && (
        <PrimaryButton
          label="THỬ LẠI"
          onPress={() => {
            setBusy(true);
            void (question && selected !== undefined ? next() : load());
          }}
          disabled={busy}
        />
      )}
      {question && (
        <>
          <Text style={common.muted}>
            Câu {index + 1} / {quizQuestions.length}
          </Text>
          <View style={common.card}>
            <Text style={common.title}>{question.question}</Text>
          </View>
          {question.options.map((option, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{
                disabled: selected !== undefined || busy,
                selected: selected === i,
              }}
              disabled={selected !== undefined || busy}
              onPress={() => {
                answer(question.id, i);
                void Haptics.notificationAsync(
                  i === question.correct_index
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Error,
                ).catch(() => {});
              }}
              style={[
                common.card,
                {
                  borderWidth: 2,
                  borderColor:
                    selected !== undefined && i === question.correct_index
                      ? colors.success
                      : selected === i
                        ? colors.danger
                        : colors.border,
                },
              ]}
            >
              <Text style={common.text}>
                {String.fromCharCode(65 + i)}. {option}
              </Text>
            </Pressable>
          ))}
          {selected !== undefined && (
            <View style={common.card}>
              <Text style={common.text}>
                {selected === question.correct_index
                  ? "✓ Chính xác"
                  : "Đáp án chưa đúng"}
              </Text>
              <Text style={common.muted}>{question.explanation}</Text>
            </View>
          )}
          <PrimaryButton
            label={
              index === quizQuestions.length - 1
                ? "XEM TỔNG KẾT"
                : "CÂU TIẾP THEO"
            }
            onPress={() => {
              void next();
            }}
            disabled={selected === undefined || busy}
          />
          {index === 0 &&
            Object.keys(answers).length === 0 &&
            materials.length > 0 && (
              <Pressable
                disabled={busy}
                accessibilityRole="button"
                onPress={() => {
                  setBusy(true);
                  setError(null);
                  void load(true);
                }}
              >
                <Text style={common.link}>Tạo quiz từ tài liệu bằng AI</Text>
                <Text style={common.muted}>
                  Tài liệu sẽ được gửi đến OpenAI để tạo câu hỏi.
                </Text>
              </Pressable>
            )}
        </>
      )}
    </Screen>
  );
}
