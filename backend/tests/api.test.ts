import { beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "../src/app.js";
import { issueTokens, hashToken } from "../src/auth.js";
vi.mock("../src/storage.js", () => ({
  uploadFile: vi.fn().mockResolvedValue({}),
  deleteFile: vi.fn().mockResolvedValue({}),
  storageHealth: vi.fn().mockResolvedValue({}),
  matchesMime: (buffer: Buffer, mime: string) =>
    mime === "text/plain" && !buffer.includes(0),
  documentDto: async (d: { id: string; name: string }) => ({
    ...d,
    url: `https://storage.example/${d.id}`,
    thumbnail_url: null,
  }),
  readFile: vi.fn().mockResolvedValue(Buffer.from("study material")),
}));
vi.mock("../src/ai.js", () => ({
  generateQuestions: vi.fn().mockResolvedValue([
    {
      question: "AI question",
      options: ["A", "B", "C", "D"],
      correct_index: 1,
      explanation: "Explanation",
    },
  ]),
}));
const pg = new PGlite();
const server = new PGLiteSocketServer({
  db: pg,
  host: "127.0.0.1",
  port: 15432,
  maxConnections: 1,
});
const db = new PrismaClient();
const redis = new RedisMock();
let app: Awaited<ReturnType<typeof buildApp>>;
let headers: Record<string, string>;
let stranger: Record<string, string>;
let userId: string;
let questionId: string;
let sessionId: string;
const session = () => ({
  client_id: randomUUID(),
  goal_text: "Study biology",
  topic_id: "biology",
  target_duration_seconds: 60,
  actual_duration_seconds: 60,
  distraction_attempts: 2,
  quiz_score: 0,
  total_quiz_questions: 0,
  is_completed: true,
  apps_blocked: ["com.example.app"],
  documents: [],
});
beforeAll(async () => {
  await pg.exec(
    readFileSync(
      new URL(
        "../prisma/migrations/20261004000000_initial/migration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await server.start();
  app = await buildApp({ db, redis: redis as unknown as Redis, logger: false });
  await app.ready();
  await db.topic.create({
    data: { id: "biology", name: "Sinh học", icon: "🧬" },
  });
  const user = await db.user.create({
    data: { email: "owner@example.com", name: "Owner" },
  });
  userId = user.id;
  const other = await db.user.create({
    data: { email: "other@example.com", name: "Other" },
  });
  headers = {
    authorization: `Bearer ${(await issueTokens(db, user)).access_token}`,
  };
  stranger = {
    authorization: `Bearer ${(await issueTokens(db, other)).access_token}`,
  };
  questionId = (
    await db.quizQuestion.create({
      data: {
        topic_id: "biology",
        question: "Question",
        options: ["A", "B", "C", "D"],
        correct_index: 1,
        explanation: "Explanation",
      },
    })
  ).id;
});
beforeEach(async () => {
  await redis.flushall();
});
afterAll(async () => {
  await app?.close();
  await db.$disconnect();
  await server.stop();
  await pg.close();
  redis.disconnect();
});
it("registers, logs in, rotates refresh tokens, rejects replay and revokes on logout", async () => {
  const payload = {
    email: "new@example.com",
    name: "Nguyễn Văn A",
    password: "Secure@123",
  };
  const registered = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload,
  });
  expect(registered.statusCode).toBe(201);
  const body = registered.json();
  expect(body.user.password_hash).toBeUndefined();
  expect(
    await db.refreshToken.findUnique({
      where: { token_hash: hashToken(body.tokens.refresh_token) },
    }),
  ).toBeTruthy();
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload,
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: payload.email, password: payload.password },
      })
    ).statusCode,
  ).toBe(200);
  const refreshed = await app.inject({
    method: "POST",
    url: "/api/v1/auth/refresh",
    payload: { refresh_token: body.tokens.refresh_token },
  });
  expect(refreshed.statusCode).toBe(200);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refresh_token: body.tokens.refresh_token },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: { authorization: `Bearer ${refreshed.json().access_token}` },
      })
    ).statusCode,
  ).toBe(204);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refresh_token: refreshed.json().refresh_token },
      })
    ).statusCode,
  ).toBe(401);
});
it("returns problem details for invalid input, unauthenticated and invalid credentials", async () => {
  const invalid = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { email: "bad" },
  });
  expect(invalid.statusCode).toBe(400);
  expect(invalid.json().errors.length).toBeGreaterThan(0);
  const denied = await app.inject("/api/v1/users/me");
  expect(denied.statusCode).toBe(401);
  expect(denied.headers["content-type"]).toContain("application/problem+json");
  expect(denied.headers["x-frame-options"]).toBe("DENY");
  expect(denied.headers["x-request-id"]).toBeTruthy();
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "missing@example.com", password: "Wrong@123" },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/oauth/google",
        payload: { id_token: "invalid" },
      })
    ).statusCode,
  ).toBe(503);
});
it("limits auth requests to ten per minute", async () => {
  for (let i = 0; i < 10; i++)
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/register",
          payload: {},
        })
      ).statusCode,
    ).toBe(400);
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {},
  });
  expect(response.statusCode).toBe(429);
  expect(response.json().status).toBe(429);
});
it("reads and updates profile, lists topics", async () => {
  expect(
    (await app.inject({ url: "/api/v1/users/me", headers })).json().id,
  ).toBe(userId);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/api/v1/users/me",
        headers,
        payload: { name: "Tên mới" },
      })
    ).json().name,
  ).toBe("Tên mới");
  expect(
    (await app.inject({ url: "/api/v1/topics", headers })).json().topics[0]
      .question_count,
  ).toBe(1);
});
it("saves idempotently, lists pages, hides other users sessions", async () => {
  const payload = session();
  const first = await app.inject({
    method: "POST",
    url: "/api/v1/sessions",
    headers,
    payload,
  });
  expect(first.statusCode).toBe(201);
  sessionId = first.json().id;
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/sessions",
        headers,
        payload,
      })
    ).json().id,
  ).toBe(sessionId);
  expect(
    await db.studySession.count({ where: { client_id: payload.client_id } }),
  ).toBe(1);
  expect(
    (
      await app.inject({
        url: `/api/v1/sessions/${sessionId}`,
        headers: stranger,
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (await app.inject({ url: "/api/v1/sessions", headers: stranger })).json()
      .data,
  ).toEqual([]);
  expect(
    (
      await app.inject({
        url: "/api/v1/sessions?is_completed=true&limit=1",
        headers,
      })
    ).json().pagination.total,
  ).toBeGreaterThan(0);
  expect(
    (await app.inject({ url: "/api/v1/sessions?page=0", headers })).statusCode,
  ).toBe(400);
  const stats = await app.inject({
    url: "/api/v1/sessions/stats?period=all",
    headers,
  });
  expect(stats.statusCode).toBe(200);
  expect(stats.json().total_focus_time_seconds).toBeGreaterThan(0);
});
it("rejects documents absent from the owner account", async () => {
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/sessions",
        headers,
        payload: {
          ...session(),
          documents: [
            { id: randomUUID(), name: "doc", url: "https://example.com/doc" },
          ],
        },
      })
    ).statusCode,
  ).toBe(404);
});
it("scores on server and retries answers without duplication", async () => {
  expect(
    (
      await app.inject({ url: "/api/v1/quizzes?topic_id=biology", headers })
    ).json().questions[0].id,
  ).toBe(questionId);
  const payload = {
    session_id: sessionId,
    question_id: questionId,
    selected_index: 1,
  };
  const answer = await app.inject({
    method: "POST",
    url: "/api/v1/quizzes/answer",
    headers,
    payload,
  });
  expect(answer.statusCode).toBe(201);
  expect(answer.json().is_correct).toBe(true);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/quizzes/answer",
        headers,
        payload: { ...payload, selected_index: 0 },
      })
    ).json().id,
  ).toBe(answer.json().id);
  const row = await db.studySession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  expect(row.quiz_score).toBe(1);
  expect(row.total_quiz_questions).toBe(1);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/quizzes/answer",
        headers: stranger,
        payload,
      })
    ).statusCode,
  ).toBe(404);
});
it("uploads multipart text, generates private questions, enforces ownership and deletes", async () => {
  const boundary = "test-boundary";
  const payload = `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nStudy notes\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="notes.txt"\r\nContent-Type: text/plain\r\n\r\nStudy material\r\n--${boundary}--\r\n`;
  const uploaded = await app.inject({
    method: "POST",
    url: "/api/v1/documents/upload",
    headers: {
      ...headers,
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload,
  });
  expect(uploaded.statusCode).toBe(201);
  const doc = uploaded.json();
  expect(doc.name).toBe("Study notes");
  const body = {
    topic_id: "biology",
    document_ids: [doc.id],
    question_count: 1,
    difficulty: "medium",
  };
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/quizzes/generate",
        headers: stranger,
        payload: body,
      })
    ).statusCode,
  ).toBe(404);
  const generated = await app.inject({
    method: "POST",
    url: "/api/v1/quizzes/generate",
    headers,
    payload: body,
  });
  expect(generated.statusCode).toBe(200);
  expect(generated.json().generated_questions).toHaveLength(1);
  expect(
    (
      await app.inject({
        url: "/api/v1/quizzes?topic_id=biology",
        headers: stranger,
      })
    ).json().questions,
  ).toHaveLength(1);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/api/v1/documents/${doc.id}`,
        headers: stranger,
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/api/v1/documents/${doc.id}`,
        headers,
      })
    ).statusCode,
  ).toBe(204);
});
it("checks dependency readiness", async () => {
  const response = await app.inject("/health");
  expect(response.statusCode).toBe(200);
  expect(response.json().services).toEqual({
    database: "up",
    redis: "up",
    s3: "up",
  });
});

it("authenticates websocket events and tracks the focus lifecycle", async () => {
  await expect(app.injectWS("/ws/v1?token=invalid")).rejects.toThrow();
  const ws = await app.injectWS(
    `/ws/v1?token=${headers.authorization.slice(7)}`,
  );
  const id = randomUUID();
  const exchange = (event: string, payload: unknown) =>
    new Promise<{ event: string; payload: Record<string, unknown> }>(
      (resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("WebSocket response timeout")),
          3000,
        );
        ws.once("message", (data) => {
          clearTimeout(timer);
          resolve(JSON.parse(data.toString()));
        });
        ws.send(JSON.stringify({ event, payload }));
      },
    );
  try {
    const start = await exchange("session:start", {
      session_id: id,
      topic_id: "biology",
      target_duration: 60,
    });
    expect(start.event).toBe("session:tick");
    expect(start.payload.remaining_seconds).toBe(60);
    const warning = await exchange("distraction:attempt", {
      session_id: id,
      app_id: "unknown",
      timestamp: new Date().toISOString(),
    });
    expect(warning.event).toBe("distraction:warning");
    const state = JSON.parse((await redis.get(`focus:${userId}`))!);
    expect(state.attempts).toBe(1);
    expect(state.deadline).toBeGreaterThan(Date.now());
    const mismatch = await exchange("session:end", {
      session_id: randomUUID(),
      actual_duration: 1,
      is_completed: false,
    });
    expect(mismatch.event).toBe("error");
  } finally {
    ws.terminate();
  }
});
