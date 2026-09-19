import Redis from "ioredis";

const CACHE_TTL = 20 * 60; // 20 minutes in seconds

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  }
  return redis;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    if (client.status !== "ready") await client.connect();
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("[Redis] cache read error:", err);
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = CACHE_TTL): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    if (client.status !== "ready") await client.connect();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("[Redis] cache write error:", err);
  }
}

export function cacheKey(prefix: string, query: string): string {
  return `${prefix}:${query.toLowerCase().trim().replace(/\s+/g, "-")}`;
}
