import { z } from "zod";

/** Contract for the singular /quiz/generate endpoint. */
export const geminiRequestSchema = z.object({
  topic: z.string().trim().min(1).max(50).regex(/^[a-z0-9-]+$/),
  goal: z.string().trim().min(1).max(500).optional(),
  documentText: z.string().trim().min(10).max(50000).optional(),
  count: z.number().int().min(1).max(30).default(3),
}).strict();

export const geminiQuestionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  question: z.string().trim().min(1).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).length(4)
    .refine(options => new Set(options.map(option => option.toLocaleLowerCase("vi"))).size === 4,
      "Answer options must be distinct"),
  correctAnswerIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(4000),
  knowledgePoint: z.string().trim().min(1).max(200).optional(),
}).strict();

export type GenerateQuizInput = z.infer<typeof geminiRequestSchema>;
export type GeneratedQuizQuestion = z.infer<typeof geminiQuestionSchema>;

export function parseGeneratedQuiz(text: string, count: number): GeneratedQuizQuestion[] {
  if (Buffer.byteLength(text, "utf8") > 512 * 1024)
    throw new Error("AI output exceeds size limit");
  const questions = z.array(geminiQuestionSchema).length(count).parse(JSON.parse(text));
  if (new Set(questions.map(question => question.id)).size !== questions.length)
    throw new Error("AI question IDs must be distinct");
  return questions;
}
