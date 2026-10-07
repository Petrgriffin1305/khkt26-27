import { expect, it, vi } from "vitest";
import { createRedis } from "../src/redis.js";

it("defers connecting and handles failed commands when Redis is unavailable", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  const redis = createRedis("redis://127.0.0.1:1");
  try {
    expect(redis.status).toBe("wait");
    await expect(redis.ping()).rejects.toThrow();
    expect(warning).toHaveBeenCalledWith(
      "[Redis Warning] Redis unavailable, retrying:", expect.any(String),
    );
    // A subsequent failure must also settle rather than hang or kill the process.
    await expect(redis.ping()).rejects.toThrow();
  } finally {
    redis.disconnect();
    warning.mockRestore();
  }
});
