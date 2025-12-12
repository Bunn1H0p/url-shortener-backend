// src/routes/authRoutes.js
import express from "express";
import { devTokenHandler } from "../controllers/authController.js";

const router = express.Router();

// DEV ONLY – remove / protect in production
router.post("/auth/dev-token", devTokenHandler);

export default router;
