/**
 * API route handlers.
 * Routes delegate to modules — no business logic here.
 */

import { Router } from "express";
import { generateAndPushPRD } from "../modules/doc-generator/index.js";

export const docGeneratorRoutes = Router();

docGeneratorRoutes.post("/docs/generate-prd", async (req, res) => {
  try {
    const { repoId, input } = req.body as { repoId: string; input: string };
    const token = req.headers.authorization?.replace("Bearer ", "") ?? "";

    if (!repoId || !input) {
      res.status(400).json({ code: "INVALID_INPUT", message: "repoId and input required" });
      return;
    }

    const result = await generateAndPushPRD(repoId, input, token);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
