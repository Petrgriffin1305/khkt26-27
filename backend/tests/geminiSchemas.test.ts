import { describe, expect, it } from "vitest";
import { geminiRequestSchema, parseGeneratedQuiz } from "../src/geminiSchemas.js";

const question = {
  id: "q1", question: "Cấu trúc nào sử dụng LIFO?",
  options: ["Queue", "Stack", "Array", "Graph"],
  correctAnswerIndex: 1, explanation: "Stack lấy phần tử mới nhất ra trước.",
};

describe("Gemini request", () => {
  it("accepts topic only and trims study text", () => {
    expect(geminiRequestSchema.parse({ topic: " biology " })).toEqual({ topic: "biology", count: 3 });
    expect(geminiRequestSchema.parse({ topic: "biology", documentText: "  Nội dung bài học  ", count: 1 })
      .documentText).toBe("Nội dung bài học");
  });
  it.each([
    { topic: "" }, { topic: "../biology" }, { topic: "biology", count: "3" },
    { topic: "biology", count: 0 }, { topic: "biology", count: 11 },
    { topic: "biology", count: 1.5 }, { topic: "biology", documentText: " " },
    { topic: "biology", documentText: "x".repeat(50001) },
    { topic: "biology", questionCount: 3 },
  ])("rejects invalid request %j", input => {
    expect(geminiRequestSchema.safeParse(input).success).toBe(false);
  });
});

describe("Gemini output", () => {
  it("accepts a direct question array", () => {
    expect(parseGeneratedQuiz(JSON.stringify([question]), 1)).toEqual([question]);
  });
  it.each([
    { options: ["A", "B", "C"] }, { options: ["A", "B", "C", "D", "E"] },
    { options: ["A", " a ", "C", "D"] }, { correctAnswerIndex: -1 },
    { correctAnswerIndex: 4 }, { correctAnswerIndex: 1.5 },
    { correctAnswerIndex: "1" }, { question: " " }, { explanation: "" },
    { id: "" }, { extra: true },
  ])("rejects malformed question %j", patch => {
    expect(() => parseGeneratedQuiz(JSON.stringify([{ ...question, ...patch }]), 1)).toThrow();
  });
  it("rejects wrong count, duplicate IDs, envelopes, fenced and oversized JSON", () => {
    for (const [text, count] of [
      [JSON.stringify([question]), 2],
      [JSON.stringify([question, question]), 2],
      [JSON.stringify({ questions: [question] }), 1],
      ["```json\n[]\n```", 1], ["x".repeat(128 * 1024 + 1), 1],
    ] as const) expect(() => parseGeneratedQuiz(text, count)).toThrow();
  });
});
