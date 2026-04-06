/**
 * CIE routes: trigger indexing and check status.
 * Requires authentication.
 */

import { Router, Request, Response } from "express";
import type { RequestWithUser } from "../shared/index.js";
import { getProjectById } from "../db/index.js";
import { inngest } from "../inngest/client.js";
import { logger } from "../logger/index.js";

export const cieRoutes = Router();

/** POST /api/projects/:id/index — trigger CIE indexing for a project. */
cieRoutes.post("/projects/:id/index", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
      return;
    }

    const project = await getProjectById(id, userId);
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found." });
      return;
    }

    if (!project.repoId) {
      res.status(400).json({
        code: "NO_REPO",
        message: "This project has no linked repository to index.",
      });
      return;
    }

    await inngest.send({
      name: "cie/index-requested",
      data: {
        projectId: project.id,
        repoId: project.repoId,
        branch: project.repoBranch,
      },
    });

    logger.info("CIE index requested", { projectId: project.id, repoId: project.repoId });
    res.json({ message: "Indexing started. Check project status for progress." });
  } catch (err) {
    logger.error("CIE index trigger failed", { error: err });
    res.status(500).json({
      code: "INDEX_FAILED",
      message: "We couldn't start indexing. Please try again.",
    });
  }
});
