// src/middleware/redisRateLimit.js
import { createRedisRateLimit } from "./createRedisRateLimit.js";

export const limitCreateShortUrl = createRedisRateLimit({
  windowSeconds: 60,               // 1 minute
  maxRequests: 10,                 // 10 reqs / minute / IP
  keyPrefix: "ratelimit:shorten:", // redis key prefix
});

export const limitRedirect = createRedisRateLimit({
  windowSeconds: 60,
  maxRequests: 300,
  keyPrefix: "ratelimit:redirect:",
});
