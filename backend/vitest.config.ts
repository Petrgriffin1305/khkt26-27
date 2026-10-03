import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      DATABASE_URL:
        "postgresql://postgres:postgres@127.0.0.1:15432/postgres?connection_limit=1&sslmode=disable",
      REDIS_URL: "redis://127.0.0.1:6379",
      JWT_SECRET: "test-only-secret-at-least-32-characters-long",
      S3_BUCKET: "test-documents",
      NODE_ENV: "test",
      OPENAI_API_KEY: "test-placeholder-no-real-request",
    },
  },
});
