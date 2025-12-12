// src/routes/urlRoutes.js
import { Router } from "express";
import {
  shortenUrlHandler,      // should create URL + set expiresAt (if provided)
  redirectHandler,        // should enforce expiration (410/404 if expired)
  getUrlDetailsHandler,   // should return expiresAt so client can see it
  patchUrlExpiryHandler,
} from "../controllers/urlController.js";
import {
  limitCreateShortUrl,
  limitRedirect,
} from "../middleware/redisRateLimit.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Put details route first so it doesn't get captured by "/:code"
router.get("/details/:code", getUrlDetailsHandler);

// Rate-limited creation of short URLs (handles expiresInDays in body)
router.post("/shorten", authMiddleware, limitCreateShortUrl, shortenUrlHandler);

// Rate-limited redirect (internally checks if URL is expired)
router.get("/:code", limitRedirect, redirectHandler);

// Update expiry (protected)
router.patch("/expiry/:code/", authMiddleware, patchUrlExpiryHandler);

export default router;
