/**
 * Project list and project detail (with linked docs).
 * Requires authentication; uses userId from JWT.
 */

import { Router, Request, Response } from "express";
import { getProjectsByUserId, getProjectById, getDocsByProjectId } from "../db/index.js";
import type { RequestWithUser } from "../shared/index.js";
import { logger } from "../logger/index.js";

export const projectRoutes = Router();

projectRoutes.get("/projects", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    if (!userId) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
      return;
    }
    const projects = await getProjectsByUserId(userId);
    res.json(projects);
  } catch (err) {
    logger.error("Projects list failed", { error: err });
    res.status(500).json({
      code: "LIST_FAILED",
      message: "We couldn't load your projects. Please try again.",
    });
  }
});

projectRoutes.get("/projects/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    const { id } = req.params;
    if (!userId || !id) {
      res.status(400).json({ code: "INVALID_INPUT", message: "Project id required." });
      return;
    }
    const project = await getProjectById(id, userId);
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found." });
      return;
    }
    const docs = await getDocsByProjectId(project.id);
    res.json({ project, docs });
  } catch (err) {
    logger.error("Project fetch failed", { error: err });
    res.status(500).json({
      code: "FETCH_FAILED",
      message: "We couldn't load the project. Please try again.",
    });
  }
});
