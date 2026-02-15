import express, { Request } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { docGeneratorRoutes } from "./routes/index.js";
import { authRoutes } from "./routes/auth.js";
import { onboardingRoutes } from "./routes/onboarding.js";
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "devdocs-api" });
});

app.use("/api", authRoutes);
app.use("/api", onboardingRoutes);
app.use("/api", docGeneratorRoutes);
app.use("/api", webhookRoutes);

app.listen(PORT, () => {
  console.log(`DevDocs API running at http://localhost:${PORT}`);
});
