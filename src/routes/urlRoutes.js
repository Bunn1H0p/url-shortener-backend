// src/routes/urlRoutes.js
import { Router } from "express";
import {
  shortenUrlHandler,
  redirectHandler,
  getUrlDetailsHandler,
} from "../controllers/urlController.js";
import {
  limitCreateShortUrl,
  limitRedirect,
} from "../middleware/redisRateLimit.js";

const router = Router();

console.log("shortenUrlHandler type:", typeof shortenUrlHandler);
console.log("redirectHandler type:", typeof redirectHandler);
console.log("getUrlDetailsHandler type:", typeof getUrlDetailsHandler);

// Details route first so it doesn't get captured by "/:code"
router.get("/details/:code", getUrlDetailsHandler);

// Rate-limited creation of short URLs
router.post("/shorten", limitCreateShortUrl, shortenUrlHandler);

// Rate-limited redirect
router.get("/:code", limitRedirect, redirectHandler);

export default router;
