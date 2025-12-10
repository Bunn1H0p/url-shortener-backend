// src/services/urlService.js

import prisma from "../lib/prisma.js";
import { encodeBase62 } from "../utils/base62.js";
import { BASE_URL } from "../config/env.js";

export async function createShortUrl(rawUrl, expiresInDays = null) {
  let longUrl;
  try {
    longUrl = new URL(rawUrl).toString();
  } catch (err) {
    const error = new Error("Invalid URL format");
    error.status = 400;
    throw error;
  }

  // Compute expiresAt if expiresInDays is provided
  let expiresAt = null;
  if (expiresInDays != null) {
    const days = Number(expiresInDays);
    if (Number.isNaN(days) || days <= 0) {
      const error = new Error("'expiresInDays' must be a positive number");
      error.status = 400;
      throw error;
    }

    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    expiresAt = new Date(now.getTime() + days * msInDay);
  }

  // Create row first (id auto-incremented)
  const created = await prisma.url.create({
    data: {
      longUrl,
      expiresAt, // may be null
    },
  });

  const shortCode = encodeBase62(created.id);

  const updated = await prisma.url.update({
    where: { id: created.id },
    data: { shortCode },
  });

  return {
    id: updated.id,
    shortCode: updated.shortCode,
    longUrl: updated.longUrl,
    shortUrl: `${BASE_URL}/${updated.shortCode}`,
    expiresAt: updated.expiresAt,
    clickCount: updated.clickCount,
  };
}

export async function getUrlByCode(shortCode) {
  const record = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (!record) {
    const error = new Error("Short URL not found");
    error.status = 404;
    throw error;
  }

  // Check expiration
  if (record.expiresAt && record.expiresAt <= new Date()) {
    const error = new Error("Short URL has expired");
    error.status = 410; // 410 Gone
    throw error;
  }

  return record;
}

export async function incrementClickCount(id) {
  await prisma.url.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  });
}

export async function getUrlDetails(shortCode) {
  const record = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (!record) {
    const error = new Error("Short URL not found");
    error.status = 404;
    throw error;
  }

  // Apply same expiration rule here
  if (record.expiresAt && record.expiresAt <= new Date()) {
    const error = new Error("Short URL has expired");
    error.status = 410;
    throw error;
  }

  return {
    id: record.id,
    shortCode: record.shortCode,
    longUrl: record.longUrl,
    createdAt: record.createdAt,
    clickCount: record.clickCount,
    shortUrl: `${BASE_URL}/${record.shortCode}`,
    expiresAt: record.expiresAt,
  };
}
