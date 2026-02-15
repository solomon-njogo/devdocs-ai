/**
 * Onboarding route handlers: new idea and review repo.
 */

import { Router, Request, Response } from "express";
import type { NewIdeaRequest, ReviewRepoRequest } from "../shared/index.js";
import { generateDocsFromIdea, reviewAndPushDocs } from "../modules/doc-generator/index.js";
import { getTokenFromRequest } from "./auth.js";
import { setRepoToken } from "../db/index.js";

export const onboardingRoutes = Router();

onboardingRoutes.post("/onboarding/idea", async (req: Request, res: Response) => {
  try {
    const body = req.body as NewIdeaRequest;
    const { projectName, description } = body;
    if (!projectName?.trim() || !description?.trim()) {
      res.status(400).json({
        code: "INVALID_INPUT",
        message: "Please provide a project name and description.",
      });
      return;
    }
    const result = await generateDocsFromIdea(body);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      code: "GENERATION_FAILED",
      message: "We couldn't generate the documents. Please try again.",
    });
  }
});

onboardingRoutes.post("/onboarding/review-repo", async (req: Request, res: Response) => {
  try {
    const token = getTokenFromRequest(req) ?? req.headers.authorization?.replace("Bearer ", "") ?? "";
    if (!token) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Please connect your GitHub account first.",
      });
      return;
    }
    const { repoId } = req.body as ReviewRepoRequest;
    if (!repoId?.trim()) {
      res.status(400).json({
        code: "INVALID_INPUT",
        message: "Please provide a repository (e.g. owner/repo).",
      });
      return;
    }
    const result = await reviewAndPushDocs(repoId, token);
    await setRepoToken(repoId, token);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      code: "REVIEW_FAILED",
      message: "We couldn't review the repository or push docs. Please try again.",
    });
  }
});
