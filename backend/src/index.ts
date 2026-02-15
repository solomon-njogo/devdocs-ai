import express from "express";
import { docGeneratorRoutes } from "./routes/index.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "devdocs-api" });
});

app.use("/api", docGeneratorRoutes);

app.listen(PORT, () => {
  console.log(`DevDocs API running at http://localhost:${PORT}`);
});
