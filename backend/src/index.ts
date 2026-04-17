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
const isProduction = process.env.NODE_ENV === "production";
/** Default UI origin; always merged into CORS so empty/wrong FRONTEND_ORIGIN on Vercel cannot drop headers. */
const defaultFrontendOrigin = isProduction
  ? "https://devdocs-ai-frontend.vercel.app"
  : "http://localhost:3000";
const fromEnv = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([defaultFrontendOrigin, ...fromEnv]));

const corsOrigin: cors.CorsOptions["origin"] = (origin, cb) => {
  if (!origin) {
    cb(null, true);
    return;
  }
  if (allowedOrigins.includes(origin)) {
    cb(null, true);
    return;
  }
  if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):3000$/.test(origin)) {
    cb(null, true);
    return;
  }
  logger.warn("CORS rejected origin", { origin });
  cb(null, false);
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
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
