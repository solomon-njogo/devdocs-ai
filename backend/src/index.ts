import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: rootEnv });
dotenv.config();

import express, { Request } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { logger } from "./logger/index.js";
import { docGeneratorRoutes } from "./routes/index.js";
import { authRoutes } from "./routes/auth.js";
import { requireAuth } from "./routes/auth-middleware.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { projectRoutes } from "./routes/projects.js";
import { ensureSessionId } from "./routes/session.js";
import { webhookRoutes } from "./routes/webhooks.js";

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(cookieParser());
app.use(ensureSessionId);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "devdocs-api" });
});

app.use("/api", authRoutes);
app.use("/api", requireAuth, onboardingRoutes);
app.use("/api", requireAuth, projectRoutes);
app.use("/api", docGeneratorRoutes);
app.use("/api", webhookRoutes);

app.listen(PORT, () => {
  logger.info("DevDocs API listening", {
    port: PORT,
    url: `http://localhost:${PORT}`,
  });
});
