import { Platform } from "react-native";
import { request, post } from "./api";
import type {
  Answer,
  ApiQuestion,
  ApiSession,
  SessionInput,
  UploadedDocument,
} from "./contracts";
import { useSetupStore } from "@/store/setupStore";
let saving: Promise<ApiSession> | null = null;
export async function uploadMaterials() {
  for (const material of useSetupStore.getState().materials) {
    if (material.uploaded) continue;
    const form = new FormData();
    form.append("name", material.name);
    if (Platform.OS === "web") {
      if (!material.file) throw new Error("Vui lòng chọn lại tài liệu.");
      form.append("file", material.file, material.name);
    } else {
      form.append("file", {
        uri: material.uri,
        name: material.name,
        type: material.mimeType ?? "application/octet-stream",
      } as unknown as Blob);
    }
    const uploaded = await request<UploadedDocument>("/documents/upload", {
      method: "POST",
      body: form,
    });
    useSetupStore.getState().updateMaterial(material.id, { uploaded });
  }
}
export function saveSession() {
  if (saving) return saving;
  saving = (async () => {
    const state = useSetupStore.getState();
    if (state.serverSessionId)
      return request<ApiSession>(`/sessions/${state.serverSessionId}`);
    if (!state.clientId)
      throw new Error("Chưa có phiên học. Vui lòng bắt đầu một phiên mới.");
    await uploadMaterials();
    const current = useSetupStore.getState();
    const input: SessionInput = {
      client_id: current.clientId,
      goal_text: current.goalText.trim(),
      topic_id: current.topicId,
      target_duration_seconds: current.targetDurationSeconds,
      actual_duration_seconds: current.actualDurationSeconds,
      distraction_attempts: current.distractionAttempts,
      quiz_score: 0,
      total_quiz_questions: 0,
      is_completed: current.isCompleted,
      apps_blocked: current.restrictedApps.map((a) => a.packageName ?? a.id),
      documents: current.materials.flatMap((m) =>
        m.uploaded
          ? [
              {
                id: m.uploaded.id,
                name: m.uploaded.name,
                url: m.uploaded.url,
                thumbnail_url: m.uploaded.thumbnail_url,
              },
            ]
          : [],
      ),
    };
    const session = await post<ApiSession>("/sessions", input);
    current.setServerSessionId(session.id);
    return session;
  })().finally(() => {
    saving = null;
  });
  return saving;
}
export async function loadQuiz(generate = false) {
  const state = useSetupStore.getState();
  if (state.quizQuestions.length && !generate) return;
  await saveSession();
  const result = generate
    ? await post<{ generated_questions: ApiQuestion[] }>("/quizzes/generate", {
        topic_id: state.topicId,
        document_ids: useSetupStore
          .getState()
          .materials.flatMap((m) => (m.uploaded ? [m.uploaded.id] : [])),
        question_count: 3,
        difficulty: "medium",
      }).then((r) => r.generated_questions)
    : await request<{ questions: ApiQuestion[] }>(
        `/quizzes?topic_id=${encodeURIComponent(state.topicId)}&limit=3`,
      ).then((r) => r.questions);
  if (!result.length) throw new Error("Chủ đề chưa có câu hỏi.");
  useSetupStore.getState().setQuizQuestions(result);
}
export async function syncAnswers() {
  const session = await saveSession();
  for (const [question_id, selected_index] of Object.entries(
    useSetupStore.getState().answers,
  )) {
    if (useSetupStore.getState().syncedAnswers.includes(question_id)) continue;
    await post<Answer>("/quizzes/answer", {
      session_id: session.id,
      question_id,
      selected_index,
    });
    useSetupStore.getState().markAnswerSynced(question_id);
  }
  return request<ApiSession>(`/sessions/${session.id}`);
}
