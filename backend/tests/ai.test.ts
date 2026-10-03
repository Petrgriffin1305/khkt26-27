import { afterEach, it, expect, vi } from "vitest";
import type { Document } from "@prisma/client";
import { generateQuestions } from "../src/ai.js";
vi.mock("../src/storage.js", () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from("study content")),
}));
afterEach(() => vi.unstubAllGlobals());
const document = {
  storage_key: "owned-key",
  name: "notes.txt",
  mime_type: "text/plain",
  size_bytes: 13,
} as Document;
it("sends study content with structured output and validates returned quiz", async () => {
  const question = {
    question: "Question?",
    options: ["A", "B", "C", "D"],
    correct_index: 1,
    explanation: "Explanation",
  };
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({ questions: [question] }),
                },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    );
  vi.stubGlobal("fetch", fetchMock);
  expect(await generateQuestions([document], "biology", 1, "medium")).toEqual([
    question,
  ]);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.store).toBe(false);
  expect(body.text.format.type).toBe("json_schema");
  expect(body.input[0].content[1].text).toContain("study content");
});
it("maps upstream refusal and malformed output to a retryable 503", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ output: [] }), { status: 200 }),
      ),
  );
  await expect(
    generateQuestions([document], "biology", 1, "medium"),
  ).rejects.toMatchObject({ status: 503 });
});
