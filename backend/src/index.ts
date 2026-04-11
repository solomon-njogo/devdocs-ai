import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: rootEnv, processEnv: process.env });

import express, { Request } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { serve } from "inngest/express";
import { logger } from "./logger/index.js";
import { inngest, indexRepositoryFn, generateDocsFn } from "./inngest/index.js";
import { docGeneratorRoutes } from "./routes/index.js";
import { authRoutes } from "./routes/auth.js";
import { requireAuth } from "./routes/auth-middleware.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { projectRoutes } from "./routes/projects.js";
import { cieRoutes } from "./routes/cie.js";
import { docsSearchRoutes } from "./routes/docs-search.js";
import { ensureSessionId } from "./routes/session.js";
import { webhookRoutes } from "./routes/webhooks.js";

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = FRONTEND_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

// In development, also allow common network IPs (192.168.x.x, 10.x.x.x) on port 3000
const isDev = process.env.NODE_ENV !== "production";
const corsOrigin: cors.CorsOptions["origin"] = isDev
  ? (origin, cb) => {
      const allowed =
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):3000$/.test(origin);
      cb(null, allowed ? origin || true : false);
    }
  : allowedOrigins.length > 1
    ? allowedOrigins
    : allowedOrigins[0];

app.use(cors({ origin: corsOrigin, credentials: true }));
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

app.use("/api/inngest", serve({ client: inngest, functions: [indexRepositoryFn, generateDocsFn] }));

app.use("/api", authRoutes);
app.use("/api", requireAuth, onboardingRoutes);
app.use("/api", requireAuth, projectRoutes);
app.use("/api", requireAuth, cieRoutes);
app.use("/api", docGeneratorRoutes);
app.use("/api", docsSearchRoutes);
app.use("/api", webhookRoutes);

app.listen(PORT, () => {
  logger.info("DevDocs API listening", {
    port: PORT,
    url: `http://localhost:${PORT}`,
  });
});
