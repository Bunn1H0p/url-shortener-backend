// src/controllers/urlController.js
import {
  createShortUrl,
  getUrlByCode,
  incrementClickCount,
  getUrlDetails,
} from "../services/urlService.js";
import redisClient from "../lib/redisClient.js";

const redirectCachePrefix = "url:code:";
const redirectCacheTTLSeconds = 60 * 60; // 1 hour

export async function shortenUrlHandler(req, res) {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'url' in body" });
  }

  try {
    const result = await createShortUrl(url);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to shorten URL" });
  }
}

export async function redirectHandler(req, res) {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    // 1. cache check
    const cacheKey = `${redirectCachePrefix}${code}`;

    // 1️⃣ Check Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Optional: check expiration in cachedData (we’ll add later)
      return res.redirect(301, cachedData.longUrl);
    }

    // 2. db lookup
    const record = await getUrlByCode(code);

    // 3️⃣ Store in Redis with TTL
    const payload = JSON.stringify({
      longUrl: record.longUrl,
      // we’ll add expiresAt later
    });

    await redisClient.setEx(cacheKey, redirectCacheTTLSeconds, payload);

    // 4. click count (async)
    incrementClickCount(record.id).catch((err) =>
      console.error("Failed to increment click count:", err)
    );

    // 5. redirect
    return res.redirect(301, record.longUrl);
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to redirect" });
  }
}

export async function getUrlDetailsHandler(req, res) {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const data = await getUrlDetails(code);
    return res.json(data);
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Failed to fetch URL details" });
  }
}
