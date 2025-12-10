// src/services/urlService.js
import prisma from "../lib/prisma.js";
import { encodeBase62 } from "../utils/base62.js";
import { BASE_URL } from "../config/env.js";

export async function createShortUrl(rawUrl) {
  let longUrl;
  try {
    longUrl = new URL(rawUrl).toString();
  } catch (err) {
    const error = new Error("Invalid URL format");
    error.status = 400;
    throw error;
  }

  const created = await prisma.url.create({
    data: {
      longUrl,
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

  return {
    id: record.id,
    shortCode: record.shortCode,
    longUrl: record.longUrl,
    createdAt: record.createdAt,
    clickCount: record.clickCount,
    shortUrl: `${BASE_URL}/${record.shortCode}`,
  };
}
