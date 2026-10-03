import "dotenv/config";
import { mkdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
process.env.NODE_ENV = "development";
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:15433/postgres?connection_limit=1&sslmode=disable";
process.env.REDIS_URL = "redis://127.0.0.1:6379";
process.env.STORAGE_DRIVER = "local";
await mkdir(".local-data", { recursive: true });
// Keep the local secret so mobile refresh tokens survive a backend restart.
try {
  process.env.JWT_SECRET = await readFile(".local-data/jwt-secret", "utf8");
} catch {
  const { writeFile } = await import("node:fs/promises");
  process.env.JWT_SECRET = randomBytes(32).toString("hex");
  await writeFile(".local-data/jwt-secret", process.env.JWT_SECRET, {
    mode: 0o600,
  });
}
const pg = await PGlite.create(".local-data/database");
await pg.exec(
  "CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)",
);
const migration = "20261004000000_initial";
const applied = await pg.query(
  "SELECT name FROM local_migrations WHERE name=$1",
  [migration],
);
if (!applied.rows.length) {
  await pg.exec(
    await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"),
  );
  await pg.query("INSERT INTO local_migrations(name) VALUES ($1)", [migration]);
}
const socket = new PGLiteSocketServer({
  db: pg,
  host: "127.0.0.1",
  port: 15433,
  maxConnections: 10,
});
await socket.start();
await import("../prisma/seed.js");
const db = new PrismaClient();
const redis = new RedisMock();
const { buildApp } = await import("../src/app.js");
const app = await buildApp({ db, redis: redis as unknown as Redis });
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
console.log(
  "Backend local: PostgreSQL PGlite + Redis giả lập + tài liệu lưu trên máy. Chỉ dùng phát triển.",
);
const stop = async () => {
  await app.close();
  await db.$disconnect();
  redis.disconnect();
  await socket.stop();
  await pg.close();
  process.exit(0);
};
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void stop();
  });
