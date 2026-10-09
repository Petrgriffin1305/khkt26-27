import { afterEach, describe, expect, it, vi } from "vitest";
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("@google/genai", async importOriginal => {
  const original = await importOriginal<typeof import("@google/genai")>();
  return { ...original, GoogleGenAI: class { models = { generateContent }; } };
});
import { config } from "../src/config.js";
import { generateGeminiQuiz, quizResponseSchema } from "../src/gemini.js";
const question = { id: "q1", question: "Question?", options: ["A", "B", "C", "D"], correctAnswerIndex: 1, explanation: "Reason" };
const sourceText = "In photosynthesis, chlorophyll absorbs light energy.";
const groundedQuestion = {
  id: "q1", question: "What absorbs light energy during photosynthesis?",
  options: ["Chlorophyll", "Sound", "Pressure", "Gravity"],
  correctAnswerIndex: 0,
  explanation: "Chlorophyll absorbs light energy during photosynthesis.",
  sourceExcerpt: "chlorophyll absorbs light energy",
};
const originalKey = config.GEMINI_API_KEY;
const originalModel = config.GEMINI_MODEL;
const originalFallbackModel = config.GEMINI_FALLBACK_MODEL;
afterEach(() => {
  config.GEMINI_API_KEY = originalKey;
  config.GEMINI_MODEL = originalModel;
  config.GEMINI_FALLBACK_MODEL = originalFallbackModel;
  vi.resetAllMocks();
  vi.useRealTimers();
});
describe("Gemini adapter", () => {
  it("sends untrusted study data with a fixed JSON schema and configured model", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockResolvedValue({ text: JSON.stringify([groundedQuestion]) });
    expect(await generateGeminiQuiz({ topic: "biology", documentText: sourceText, documentAttached: true, goal: "Review photosynthesis", count: 1 }))
      .toEqual([groundedQuestion]);
    const request = generateContent.mock.calls[0][0];
    expect(request.model).toBe(config.GEMINI_MODEL);
    expect(request.config.responseMimeType).toBe("application/json");
    expect(request.config.responseJsonSchema).toEqual(quizResponseSchema(true));
    expect(request.config.responseJsonSchema.items.properties.options.minItems).toBe(4);
    expect(request.config.responseJsonSchema.items.required).toContain("knowledgePoint");
    expect(request.config.responseJsonSchema.items.required).toContain("sourceExcerpt");
    expect(JSON.parse(request.contents).studyData.documentText).toBe(sourceText);
    expect(JSON.parse(request.contents).studyData.goal).toBe("Review photosynthesis");
    expect(request.config.systemInstruction).toContain("đúng 1 câu");
    expect(request.config.systemInstruction).toContain("không bù kiến thức ngoài tài liệu");
    expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
  });
  it("keeps exact choice bounds without expanding the quiz array into fixed output bounds", () => {
    const schema = quizResponseSchema();
    expect(schema).toMatchObject({
      type: "array",
      items: {
        type: "object",
        required: ["id", "question", "options", "correctAnswerIndex", "explanation", "knowledgePoint"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
          correctAnswerIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
          knowledgePoint: { type: "string", description: "A concise concept label of at most 200 characters." },
        },
      },
    });
    expect(schema).not.toHaveProperty("minItems");
    expect(schema).not.toHaveProperty("maxItems");
  });
  it("requests thirty questions without fixed array bounds rejected by the provider", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    const questions = Array.from({ length: 30 }, (_, index) => ({ ...question, id: `q${index}` }));
    generateContent.mockImplementation(request => {
      const schema = request.config.responseJsonSchema as { minItems?: number; maxItems?: number };
      if (schema.minItems !== undefined || schema.maxItems !== undefined)
        return Promise.reject({ status: 400, message: "fixed array bounds exceed the provider grammar limit" });
      return Promise.resolve({ text: JSON.stringify(questions) });
    });

    expect(await generateGeminiQuiz({ topic: "biology", count: 30 })).toHaveLength(30);
    const request = generateContent.mock.calls[0][0];
    const schema = request.config.responseJsonSchema;
    expect(request.config.systemInstruction).toContain("đúng 30 câu");
    expect(schema).not.toHaveProperty("minItems");
    expect(schema).not.toHaveProperty("maxItems");
    expect(schema.items.properties.options).toMatchObject({ minItems: 4, maxItems: 4 });
  });
  it("rejects a provider response whose question count differs from the request", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    const questions = Array.from({ length: 29 }, (_, index) => ({ ...question, id: `q${index}` }));
    generateContent.mockResolvedValue({ text: JSON.stringify(questions) });

    await expect(generateGeminiQuiz({ topic: "biology", count: 30 })).rejects.toMatchObject({
      status: 502, kind: "invalid-ai-output",
    });
  });
  it("does not contact Gemini without a key", async () => {
    config.GEMINI_API_KEY = "";
    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 503 });
    expect(generateContent).not.toHaveBeenCalled();
  });
  it("rejects an attached file without source text before contacting Gemini", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    await expect(generateGeminiQuiz({ topic: "biology", documentAttached: true, count: 1 }))
      .rejects.toMatchObject({ name: "ZodError" });
    expect(generateContent).not.toHaveBeenCalled();
  });
  it("returns a specific error when the source cannot support the requested quiz", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockResolvedValue({ text: "[]" });
    await expect(generateGeminiQuiz({
      topic: "biology", documentAttached: true, documentText: sourceText, count: 1,
    })).rejects.toMatchObject({ status: 422, kind: "insufficient-study-material" });
  });
  it.each(["not json", "[]", undefined])("rejects invalid/refused output %s", async text => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockResolvedValue({ text });
    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 502 });
  });
  it.each([
    [{ status: 400, message: JSON.stringify({ error: { details: [{ reason: "API_KEY_INVALID" }] } }) }, 502, "provider-authentication-failed", "Khóa Gemini không hợp lệ hoặc chưa được cấp quyền. Hãy kiểm tra GEMINI_API_KEY ở backend."],
    [{ status: 403, message: "provider details must stay private" }, 502, "provider-authentication-failed", "Khóa Gemini không hợp lệ hoặc chưa được cấp quyền. Hãy kiểm tra GEMINI_API_KEY ở backend."],
    [{ status: 402, message: "provider details must stay private" }, 402, "provider-billing-required", "Gemini cần được cấp thêm tín dụng hoặc bật thanh toán trong Google AI Studio."],
    [{ status: 429, message: "provider details must stay private" }, 429, "provider-quota-exceeded", "Gemini đã vượt hạn mức. Hãy kiểm tra hạn mức trong Google AI Studio rồi thử lại."],
    [{ status: 503, message: "provider details must stay private" }, 503, "service-unavailable", "Gemini hiện không khả dụng. Vui lòng thử lại sau."],
    [{ status: 404, message: "provider details must stay private" }, 502, "provider-model-unavailable", "Model Gemini đã chọn không khả dụng. Hãy đổi GEMINI_MODEL sang model hiện được hỗ trợ trong Google AI Studio."],
    [{ status: "NOT_FOUND", message: "provider details must stay private" }, 502, "provider-model-unavailable", "Model Gemini đã chọn không khả dụng. Hãy đổi GEMINI_MODEL sang model hiện được hỗ trợ trong Google AI Studio."],
  ])("classifies provider failures without exposing provider details", async (error, status, kind, message) => {
    config.GEMINI_API_KEY = "test-only-key";
    generateContent.mockRejectedValue(error);
    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status, kind, message });
  });
  it.each([[503, "UNAVAILABLE"], [504, "DEADLINE_EXCEEDED"]])("falls back once within the deadline after an explicit transient response %s", async (status, providerStatus) => {
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_MODEL = "gemini-primary";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    generateContent
      .mockRejectedValueOnce({ status, message: JSON.stringify({ error: { status: providerStatus } }) })
      .mockResolvedValueOnce({ text: JSON.stringify([question]) });

    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).resolves.toEqual([question]);
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(generateContent.mock.calls.map(([request]) => request.model)).toEqual(["gemini-primary", "gemini-fallback"]);
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBe(generateContent.mock.calls[1][0].config.abortSignal);
  });
  it("does not make more than one fallback attempt when both models are overloaded", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    generateContent.mockRejectedValue({ status: 503, message: JSON.stringify({ error: { status: "UNAVAILABLE" } }) });

    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 503, kind: "service-unavailable" });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it("does not fall back for authentication errors", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    generateContent.mockRejectedValue({ status: 403, message: "provider details must stay private" });

    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ kind: "provider-authentication-failed" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it.each([
    [{ status: 402 }, "provider-billing-required"],
    [{ status: 429 }, "provider-quota-exceeded"],
    [{ status: 404 }, "provider-model-unavailable"],
    [{ status: 400 }, "provider-configuration-error"],
    [{ status: 503 }, "service-unavailable"],
  ])("does not use the fallback for non-overload errors %j", async (error, kind) => {
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    generateContent.mockRejectedValue(error);

    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ kind });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it.each(["", "gemini-3.8-flash"])("does not fall back when fallback model is disabled or equals primary (%s)", async fallbackModel => {
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_MODEL = "gemini-3.8-flash";
    config.GEMINI_FALLBACK_MODEL = fallbackModel;
    generateContent.mockRejectedValue({ status: 503, message: JSON.stringify({ error: { status: "UNAVAILABLE" } }) });

    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 503, kind: "service-unavailable" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("does not fall back when the primary returns invalid output", async () => {
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    generateContent.mockResolvedValue({ text: "not json" });

    await expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ kind: "invalid-ai-output" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("aborts requests after 90 seconds", async () => {
    vi.useFakeTimers(); config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    generateContent.mockImplementation(({ config: options }) => new Promise((_, reject) => {
      options.abortSignal.addEventListener("abort", () => reject(new Error("abort")), { once: true });
    }));
    const assertion = expect(generateGeminiQuiz({ topic: "biology", count: 1 })).rejects.toMatchObject({ status: 504 });
    await vi.advanceTimersByTimeAsync(90000); await assertion;
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("shares one 90-second deadline across the primary and fallback attempts", async () => {
    vi.useFakeTimers();
    config.GEMINI_API_KEY = "test-only-key";
    config.GEMINI_FALLBACK_MODEL = "gemini-fallback";
    let rejectPrimary!: (error: unknown) => void;
    generateContent
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectPrimary = reject; }))
      .mockImplementationOnce(({ config: options }) => new Promise((_, reject) => {
        options.abortSignal.addEventListener("abort", () => reject(new Error("abort")), { once: true });
      }));

    const operation = generateGeminiQuiz({ topic: "biology", count: 1 });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(75000);
    rejectPrimary({ status: 503, message: JSON.stringify({ error: { status: "UNAVAILABLE" } }) });
    await Promise.resolve();
    await Promise.resolve();
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(generateContent.mock.calls[1][0].config.httpOptions.timeout).toBeLessThanOrEqual(15000);

    const assertion = expect(operation).rejects.toMatchObject({ status: 504, kind: "upstream-timeout" });
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});
