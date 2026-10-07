import { afterEach, describe, expect, it, vi } from "vitest";
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("@google/genai", async importOriginal => {
  const original = await importOriginal<typeof import("@google/genai")>();
  return { ...original, GoogleGenAI: class { models = { generateContent }; } };
});
import { config } from "../src/config.js";
import { generateGeminiQuiz, quizResponseSchema } from "../src/gemini.js";
const question = { id: "q1", question: "Question?", options: ["A", "B", "C", "D"], correctAnswerIndex: 1, explanation: "Reason" };
const originalKey = config.GEMINI_API_KEY;
afterEach(() => { config.GEMINI_API_KEY = originalKey; vi.resetAllMocks(); vi.useRealTimers(); });
describe("Gemini adapter", () => {
  it("sends untrusted study data with a fixed JSON schema and configured model", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockResolvedValue({ text: JSON.stringify([question]) });
    expect(await generateGeminiQuiz({ topic: "biology", documentText: "Study material text", count: 1 })).toEqual([question]);
    const request = generateContent.mock.calls[0][0];
    expect(request.model).toBe(config.GEMINI_MODEL);
    expect(request.config.responseMimeType).toBe("application/json");
    expect(request.config.responseSchema).toEqual(quizResponseSchema);
    expect(request.config.responseSchema.items.properties.options.minItems).toBe("4");
    expect(JSON.parse(request.contents).studyData.documentText).toBe("Study material text");
    expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
  });
  it("does not contact Gemini without a key", async () => {
    config.GEMINI_API_KEY = "";
    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 503 });
    expect(generateContent).not.toHaveBeenCalled();
  });
  it.each(["not json", "[]", undefined])("rejects invalid/refused output %s", async text => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockResolvedValue({ text });
    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 502 });
  });
  it.each([404, 429, 500])("hides provider details for status %i", async status => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockRejectedValue({ status, message: "secret prompt/key" });
    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 503, message: "Gemini is unavailable. Please retry later." });
  });
  it("aborts requests after 60 seconds", async () => {
    vi.useFakeTimers(); config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockImplementation(({ config: options }) => new Promise((_, reject) => {
      options.abortSignal.addEventListener("abort", () => reject(new Error("abort")), { once: true });
    }));
    const assertion = expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 504 });
    await vi.advanceTimersByTimeAsync(60000); await assertion;
  });
});
