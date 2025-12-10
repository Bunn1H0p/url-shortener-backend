// src/config/env.js
import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
