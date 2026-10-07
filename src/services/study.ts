import { Platform } from "react-native";
import { request, post } from "./api";
import type {
  Answer,
  GenerateQuizResponse,
  ApiQuestion,
  ApiSession,
  SessionInput,
  UploadedDocument,
} from "./contracts";
import { useSetupStore } from "@/store/setupStore";
let saving: Promise<ApiSession> | null = null;
export async function uploadMaterials() {
  const before = useSetupStore.getState();
  for (const material of before.materials) {
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
    const current = useSetupStore.getState();
    if (current.ownerId !== before.ownerId || current.clientId !== before.clientId)
      throw new Error("Phiên học đã thay đổi trong khi tải tài liệu.");
    current.updateMaterial(material.id, { uploaded });
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
    if (current.clientId !== state.clientId || current.ownerId !== state.ownerId)
      throw new Error("Phiên học đã thay đổi trong khi lưu.");
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
    const latest = useSetupStore.getState();
    if (latest.clientId !== state.clientId || latest.ownerId !== state.ownerId)
      throw new Error("Phiên học đã thay đổi trong khi lưu.");
    latest.setServerSessionId(session.id);
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
  const current = useSetupStore.getState();
  if (current.clientId !== state.clientId || current.ownerId !== state.ownerId)
    throw new Error("Phiên học đã thay đổi trong khi tải quiz.");
  current.setQuizQuestions(result);
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

let generatingGemini: Promise<void> | null = null;
export function loadGeminiQuiz(): Promise<void> {
  if (generatingGemini) return generatingGemini;
  const before = useSetupStore.getState();
  if (Object.keys(before.answers).length) return Promise.reject(new Error("Không thể đổi quiz sau khi đã trả lời."));
  const text = before.documentText.trim();
  if (text && (text.length < 10 || text.length > 50000))
    return Promise.reject(new Error("Văn bản Gemini phải có 10–50.000 ký tự."));
  generatingGemini = (async () => {
    await saveSession();
    const active = useSetupStore.getState();
    if (active.clientId !== before.clientId || active.ownerId !== before.ownerId)
      throw new Error("Phiên học đã thay đổi.");
    const result = await post<GenerateQuizResponse>("/quiz/generate", {
      topic: before.topicId, ...(text ? { documentText: text } : {}), count: 3,
    });
    const current = useSetupStore.getState();
    if (current.clientId !== before.clientId || current.ownerId !== before.ownerId || Object.keys(current.answers).length)
      throw new Error("Phiên học đã thay đổi. Không áp dụng bộ quiz cũ.");
    if (!Array.isArray(result) || result.length !== 3 || result.some(q => q.options?.length !== 4))
      throw new Error("Bộ quiz Gemini không hợp lệ.");
    current.setQuizQuestions(result.map(q => ({
      ...q, topic_id: before.topicId, correct_index: q.correctAnswerIndex,
    })));
  })().finally(() => { generatingGemini = null; });
  return generatingGemini;
}
