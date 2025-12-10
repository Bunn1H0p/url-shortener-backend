// src/controllers/urlController.js

import {
  createShortUrl,
  getUrlByCode,
  incrementClickCount,
  getUrlDetails,
} from "../services/urlService.js";
import redisClient from "../lib/redisClient.js";

const REDIRECT_CACHE_PREFIX = "url:code:";
const REDIRECT_CACHE_TTL_SECONDS = 60 * 60; // 1 hour

// POST /shorten
export async function shortenUrlHandler(req, res) {
  try {
    const { url, expiresInDays } = req.body;

    if (!url || typeof url !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'url' in body" });
    }

    // Normalize & validate expiresInDays (optional)
    let expiresDaysNum = null;
    if (expiresInDays !== undefined) {
      const n = Number(expiresInDays);
      if (!Number.isFinite(n) || n <= 0) {
        return res
          .status(400)
          .json({ error: "expiresInDays must be a positive number" });
      }
      expiresDaysNum = n;
    }

    // Service computes expiresAt and persists it
    const record = await createShortUrl(url, expiresDaysNum);

    return res.status(201).json({
      id: record.id,
      shortCode: record.shortCode,
      longUrl: record.longUrl,
      shortUrl: record.shortUrl, // already built in service using BASE_URL
      clickCount: record.clickCount,
      expiresAt: record.expiresAt,
    });
  } catch (err) {
    console.error("shortenUrlHandler error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ error: err.message || "Failed to shorten URL" });
  }
}

// GET /:code
export async function redirectHandler(req, res) {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const cacheKey = `${REDIRECT_CACHE_PREFIX}${code}`;

    // 1) Try Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      let cachedData = null;

      try {
        cachedData = JSON.parse(cached);
      } catch (e) {
        // If cache is corrupted, delete it and fall back to DB
        console.warn("Invalid JSON in cache for", cacheKey, e);
        await redisClient.del(cacheKey);
      }

      if (cachedData) {
        // If cached entry is expired, evict and return 410
        if (
          cachedData.expiresAt &&
          new Date(cachedData.expiresAt) <= new Date()
        ) {
          await redisClient.del(cacheKey);
          return res.status(410).json({ error: "Short URL has expired" });
        }

        // NOTE: we only increment clickCount when we hit the DB (cache miss).
        return res.redirect(301, cachedData.longUrl);
      }
    }

    // 2) DB lookup – service throws 404/410 if not found/expired
    const record = await getUrlByCode(code);

    // 3) Store in Redis with TTL, including expiresAt
    const payload = JSON.stringify({
      longUrl: record.longUrl,
      // store ISO string so JSON.parse + new Date() works reliably
      expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    });

    let ttlSeconds = REDIRECT_CACHE_TTL_SECONDS;

    if (record.expiresAt) {
      const msLeft = record.expiresAt.getTime() - Date.now();

      // Safety: if somehow already expired by the time we got here,
      // do not cache; just return 410.
      if (msLeft <= 0) {
        return res.status(410).json({ error: "Short URL has expired" });
      }

      const secondsLeft = Math.floor(msLeft / 1000);
      // Never cache longer than both global TTL and remaining lifetime
      ttlSeconds = Math.min(REDIRECT_CACHE_TTL_SECONDS, secondsLeft);
    }

    // IMPORTANT: store JSON payload, not just the URL
    await redisClient.setEx(cacheKey, ttlSeconds, payload);

    // 4) Increment clickCount asynchronously (only on DB hit)
    incrementClickCount(record.id).catch((err) =>
      console.error("Failed to increment click count:", err)
    );

    // 5) Redirect
    return res.redirect(301, record.longUrl);
  } catch (err) {
    console.error("redirectHandler error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ error: err.message || "Failed to redirect" });
  }
}

// GET /details/:code
export async function getUrlDetailsHandler(req, res) {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const data = await getUrlDetails(code);
    return res.json(data);
  } catch (err) {
    console.error("getUrlDetailsHandler error:", err);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ error: err.message || "Failed to fetch URL details" });
  }
}
