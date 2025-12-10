// src/routes/urlRoutes.js
import { Router } from "express";
import {
  shortenUrlHandler,
  redirectHandler,
  getUrlDetailsHandler,
} from "../controllers/urlController.js";
import { redisRateLimit } from "../middleware/redisRateLimit.js";

const router = Router();

// Apply Redis rate limiting to URL creation endpoint
router.post("/shorten", redisRateLimit, shortenUrlHandler);

router.get("/api/url/:code", getUrlDetailsHandler);
// this must come after /api/url route
router.get("/:code", redirectHandler);

export default router;
