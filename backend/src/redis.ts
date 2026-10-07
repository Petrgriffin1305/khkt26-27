import { Redis } from "ioredis";

export function createRedis(url: string) {
  const redis = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  });
  redis.on("error", (err: Error) => {
    console.warn("[Redis Warning] Redis unavailable, retrying:", err.message);
  });
  return redis;
}
