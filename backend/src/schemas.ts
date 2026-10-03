import { z } from "zod";
export const topicId = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/);
export const uuid = z.uuid();
export const name = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\p{N} .'-]+$/u);
export const registerSchema = z.object({
  email: z
    .email()
    .max(255)
    .transform((v) => v.toLowerCase()),
  name,
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password must be at most 72 UTF-8 bytes",
    ),
});
export const loginSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});
export const sessionSchema = z
  .object({
    client_id: uuid.optional(),
    goal_text: z.string().trim().min(3).max(500),
    topic_id: topicId,
    target_duration_seconds: z.number().int().min(60).max(72000),
    actual_duration_seconds: z.number().int().min(0).max(72000),
    distraction_attempts: z.number().int().min(0).max(10000),
    quiz_score: z.number().int().min(0).max(50),
    total_quiz_questions: z.number().int().min(0).max(50),
    is_completed: z.boolean(),
    apps_blocked: z.array(z.string().min(1).max(100)).max(50),
    documents: z
      .array(
        z.object({
          id: uuid,
          name: z.string().max(255),
          url: z.url(),
          thumbnail_url: z.url().nullable().optional(),
        }),
      )
      .max(10),
  })
  .superRefine((v, ctx) => {
    if (v.quiz_score > v.total_quiz_questions)
      ctx.addIssue({
        code: "custom",
        path: ["quiz_score"],
        message: "Score cannot exceed question count",
      });
    if (
      v.actual_duration_seconds > v.target_duration_seconds ||
      (v.is_completed &&
        v.actual_duration_seconds !== v.target_duration_seconds)
    )
      ctx.addIssue({
        code: "custom",
        path: ["actual_duration_seconds"],
        message: "Duration inconsistent with completion",
      });
  });
export const questionSchema = z.object({
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).length(4),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(4000),
});
export const difficulty = z.enum(["easy", "medium", "hard"]);
export const generateSchema = z.object({
  topic_id: topicId,
  document_ids: z.array(uuid).min(1).max(4),
  question_count: z.number().int().min(1).max(50).default(5),
  difficulty: difficulty.default("medium"),
});
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  topic_id: topicId.optional(),
  is_completed: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z
    .enum(["created_at:asc", "created_at:desc"])
    .default("created_at:desc"),
});
export const fileLimits: Record<string, number> = {
  "application/pdf": 20 * 1024 * 1024,
  "image/jpeg": 10 * 1024 * 1024,
  "image/png": 10 * 1024 * 1024,
  "image/webp": 10 * 1024 * 1024,
  "text/plain": 5 * 1024 * 1024,
  "text/markdown": 5 * 1024 * 1024,
};
