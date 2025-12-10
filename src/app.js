// src/app.js
import express from "express";
import cors from "cors";
import urlRoutes from "./routes/urlRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", urlRoutes);

export default app;
