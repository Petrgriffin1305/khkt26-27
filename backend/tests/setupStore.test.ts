import { afterEach, expect, it, vi } from "vitest";
vi.mock("@react-native-async-storage/async-storage", () => ({ default: {
  getItem: vi.fn().mockResolvedValue(null), setItem: vi.fn().mockResolvedValue(undefined), removeItem: vi.fn().mockResolvedValue(undefined),
} }));
import { useSetupStore } from "../../src/store/setupStore.js";
const q = { id: "q1", topic_id: "biology", question: "Question", options: ["A", "B", "C", "D"], correct_index: 1, explanation: "Reason" };
afterEach(() => useSetupStore.getState().reset());
it("does not commit/reveal an answer without confidence and locks confidence after commit", () => {
  const store = useSetupStore; store.getState().setQuizQuestions([q]);
  store.getState().selectOption(q.id, 1); store.getState().answer(q.id, 1);
  expect(store.getState().answers.q1).toBeUndefined();
  store.getState().setConfidence(q.id, "high"); store.getState().answer(q.id, 1);
  store.getState().setConfidence(q.id, "low"); store.getState().selectOption(q.id, 2);
  expect(store.getState().answers.q1).toBe(1); expect(store.getState().confidenceRatings.q1).toBe("high");
  expect(store.getState().draftOptions.q1).toBe(1);
});
it("clears pending confidence when a new session or quiz begins", () => {
  useSetupStore.getState().setConfidence(q.id, "low");
  useSetupStore.getState().setQuizQuestions([q]); expect(useSetupStore.getState().confidenceRatings).toEqual({});
  useSetupStore.getState().setConfidence(q.id, "high");
  useSetupStore.getState().beginSession("new-session"); expect(useSetupStore.getState().confidenceRatings).toEqual({});
});
it("migrates a pre-confidence persisted draft without losing committed answers", async () => {
  const storage = (await import("@react-native-async-storage/async-storage")).default;
  vi.mocked(storage.getItem).mockResolvedValueOnce(JSON.stringify({ version: 0, state: {
    clientId: "old-session", stage: "quiz", answers: { q1: 1 }, quizQuestions: [q],
  } }));
  await useSetupStore.persist.rehydrate();
  expect(useSetupStore.getState().answers).toEqual({ q1: 1 });
  expect(useSetupStore.getState().documentText).toBe("");
  expect(useSetupStore.getState().confidenceRatings).toEqual({});
});
