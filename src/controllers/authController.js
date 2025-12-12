// src/controllers/authController.js
import { signJwt } from "../utils/jwt.js";

// POST /auth/dev-token
// Body: { "userId": 1, "role": "admin" }
export async function devTokenHandler(req, res) {
  try {
    const { userId, role } = req.body ?? {};

    if (typeof userId !== "number") {
      return res
        .status(400)
        .json({ error: "'userId' must be a number" });
    }

    if (role !== "user" && role !== "admin") {
      return res
        .status(400)
        .json({ error: "'role' must be 'user' or 'admin'" });
    }

    const token = signJwt({ userId, role });

    return res.status(200).json({
      token,
      payload: { userId, role },
    });
  } catch (err) {
    console.error("devTokenHandler error:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
}
