// src/middleware/redisRateLimit.js
import redisClient from "../lib/redisClient.js";

const WINDOW_SECONDS = 60;   // 1 minute
const MAX_REQUESTS = 10;     // 10 / minute / IP
const KEY_PREFIX = "ratelimit:";

export async function redisRateLimit(req, res, next) {
  try {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      "unknown";

    const key = `${KEY_PREFIX}${ip}`;

    // 1️⃣ Increment counter
    const currentCount = await redisClient.incr(key);

    if (currentCount === 1) {
      // first request in this window → set TTL
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (currentCount > MAX_REQUESTS) {
      const ttl = await redisClient.ttl(key); // seconds until reset
      res.setHeader("Retry-After", ttl.toString());
      return res.status(429).json({
        error: "Too many requests, please try again later.",
        resetInSeconds: ttl,
      });
    }

    // under the limit
    return next();
  } catch (err) {
    console.error("Rate limit middleware error:", err);
    // Fail-open: if Redis is down, don’t block all users
    return next();
  }
}
