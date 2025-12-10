// src/server.js
import "dotenv/config";

import app from "./app.js";
import { PORT, BASE_URL } from "./config/env.js";

app.listen(PORT, () => {
  console.log(`URL Shortener API listening on ${BASE_URL}`);
});
