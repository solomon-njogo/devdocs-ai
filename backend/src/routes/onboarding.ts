/**
 * Onboarding route handlers: new idea and review repo.
 * Creates project and project_docs; returns project in response.
 */

import { Router, Request, Response } from "express";
import type { NewIdeaRequest, ReviewRepoRequest } from "../shared/index.js";
import { generateDocsFromIdea, reviewAndPushDocs } from "../modules/doc-generator/index.js";
import { getRepoMetadata } from "../modules/github/index.js";
import { getTokenFromRequest } from "./auth.js";
import {
  createProject,
  setRepoToken,
  insertProjectDocs,
} from "../db/index.js";
import type { RequestWithSession } from "./session.js";

export const onboardingRoutes = Router();

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
    const sessionId = (req as RequestWithSession).sessionId;
    if (!sessionId) {
      res.status(400).json({ code: "NO_SESSION", message: "Session required." });
      return;
    }
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
    const project = await createProject({
      sessionId,
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
    const sessionId = (req as RequestWithSession).sessionId;
    if (!sessionId) {
      res.status(400).json({ code: "NO_SESSION", message: "Session required." });
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
    const { name: repoName, description: repoDescription } = await getRepoMetadata(
      repoId.trim(),
      token
    );
    const project = await createProject({
      sessionId,
      name: repoName,
      description: repoDescription,
      type: "existing",
      repoId: repoId.trim(),
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
    res.status(500).json({
      code: "REVIEW_FAILED",
      message: "We couldn't review the repository or push docs. Please try again.",
    });
  }
});
