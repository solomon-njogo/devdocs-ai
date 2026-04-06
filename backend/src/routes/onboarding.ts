/**
 * Onboarding route handlers: new idea and review repo.
 * Creates project and project_docs; returns project in response.
 * Requires authentication; uses userId from JWT.
 */

import { Router, Request, Response } from "express";
import type { NewIdeaRequest, ReviewRepoRequest } from "../shared/index.js";
import { generateDocsFromIdea, reviewAndPushDocs } from "../modules/doc-generator/index.js";
import { getRepoMetadata, listUserRepositories } from "../modules/github/index.js";
import { getTokenFromRequest } from "./auth.js";
import {
  createProject,
  setRepoToken,
  insertProjectDocs,
} from "../db/index.js";
import type { RequestWithUser } from "../shared/index.js";
import { logger } from "../logger/index.js";

export const onboardingRoutes = Router();

onboardingRoutes.get("/onboarding/github-repos", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    if (!userId) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
      return;
    }
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Please connect your GitHub account first.",
      });
      return;
    }
    const repos = await listUserRepositories(token);
    res.json({ repos });
  } catch (err) {
    logger.error("Onboarding github-repos list failed", { error: err });
    res.status(500).json({
      code: "GITHUB_LIST_FAILED",
      message: "We couldn't load your repositories from GitHub. Please try again.",
    });
  }
});

/** Map GeneratedDocItem type/path to project_docs shape. */
function toProjectDocItem(
  type: string,
  path: string,
  content: string
): { type: "prd" | "user_story" | "user_journey"; path: string; content: string } {
  const normalizedType =
    type === "user-story"
      ? "user_story"
      : type === "user-journey"
        ? "user_journey"
        : "prd";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return { type: normalizedType, path: normalizedPath, content };
}

onboardingRoutes.post("/onboarding/idea", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    if (!userId) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
      return;
    }
    const body = req.body as NewIdeaRequest;
    const { projectName, description } = body;
    if (!projectName?.trim() || !description?.trim()) {
      logger.warn("Onboarding idea: missing project name or description");
      res.status(400).json({
        code: "INVALID_INPUT",
        message: "Please provide a project name and description.",
      });
      return;
    }
    const result = await generateDocsFromIdea(body);
    const project = await createProject({
      userId,
      name: body.projectName,
      description: body.description?.trim() || null,
      type: "new_idea",
      features: body.features?.trim() || null,
      requirements: body.requirements?.trim() || null,
    });
    const docsForDb = result.docs.map((d) =>
      toProjectDocItem(d.type, d.path, d.content)
    );
    await insertProjectDocs(project.id, docsForDb);
    res.json({
      project,
      projectName: result.projectName,
      docs: result.docs,
    });
  } catch (err) {
    logger.error("Onboarding idea: document generation failed", { error: err });
    if ((err as { code?: string }).code === "RATE_LIMIT_EXHAUSTED") {
      res.status(429).json({
        code: "RATE_LIMIT_EXHAUSTED",
        message: "Service is busy. Please try again in a moment.",
      });
      return;
    }
    res.status(500).json({
      code: "GENERATION_FAILED",
      message: "We couldn't generate the documents. Please try again.",
    });
  }
});

onboardingRoutes.post("/onboarding/review-repo", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    if (!userId) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
      return;
    }
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
      logger.warn("Onboarding review-repo: missing repoId");
      res.status(400).json({
        code: "INVALID_INPUT",
        message: "Please provide a repository (e.g. owner/repo).",
      });
      return;
    }
    const { name: repoName, description: repoDescription } = await getRepoMetadata(
      repoId.trim(),
      token
    );
    const trimmedRepoId = repoId.trim();
    const [repoOwner, repoNamePart] = trimmedRepoId.includes("/")
      ? trimmedRepoId.split("/")
      : [null, null];
    const project = await createProject({
      userId,
      name: repoName,
      description: repoDescription,
      type: "existing",
      repoId: trimmedRepoId,
      repoOwner: repoOwner ?? null,
      repoName: repoNamePart ?? null,
    });
    const result = await reviewAndPushDocs(repoId.trim(), token);
    await setRepoToken(repoId.trim(), token, project.id);
    await insertProjectDocs(project.id, result.docs);
    res.json({
      project,
      repoId: result.repoId,
      paths: result.paths,
      summary: result.summary,
    });
  } catch (err) {
    logger.error("Onboarding review-repo failed", { error: err });
    if ((err as { code?: string }).code === "RATE_LIMIT_EXHAUSTED") {
      res.status(429).json({
        code: "RATE_LIMIT_EXHAUSTED",
        message: "Service is busy. Please try again in a moment.",
      });
      return;
    }
    res.status(500).json({
      code: "REVIEW_FAILED",
      message: "We couldn't review the repository or push docs. Please try again.",
    });
  }
});
