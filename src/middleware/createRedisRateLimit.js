// src/middleware/createRedisRateLimit.js
import redisClient from "../lib/redisClient.js";

/**
 * Factory to create a Redis-backed rate limit middleware.
 *
 * @param {object} options
 * @param {number} options.windowSeconds - size of window in seconds
 * @param {number} options.maxRequests - max requests per window per IP
 * @param {string} options.keyPrefix - prefix for Redis keys
 */
export function createRedisRateLimit({
  windowSeconds,
  maxRequests,
  keyPrefix,
}) {
  // IMPORTANT: this returns the actual middleware function
  return async function redisRateLimit(req, res, next) {
    try {
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        "unknown";

      // method included in key => separate buckets per method
      const key = `${keyPrefix}${req.method}:${ip}`;

      const currentCount = await redisClient.incr(key);

      if (currentCount === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      if (currentCount > maxRequests) {
        const ttl = await redisClient.ttl(key);
        res.setHeader("Retry-After", ttl.toString());
        return res.status(429).json({
          error: "Too many requests, please try again later.",
          resetInSeconds: ttl,
        });
      }

      return next();
    } catch (err) {
      console.error("Rate limit middleware error:", err);
      // fail-open
      return next();
    }
  };
}
