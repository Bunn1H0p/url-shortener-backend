// src/lib/redisClient.js
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

// connect in background
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err);
});

export default redisClient;
