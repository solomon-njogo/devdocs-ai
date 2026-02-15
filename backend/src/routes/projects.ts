/**
 * Project list and project detail (with linked docs).
 */

import { Router, Request, Response } from "express";
import { getProjectsBySession, getProjectById, getDocsByProjectId } from "../db/index.js";
import type { RequestWithSession } from "./session.js";

export const projectRoutes = Router();

projectRoutes.get("/projects", async (req: Request, res: Response) => {
  try {
    const sessionId = (req as RequestWithSession).sessionId;
    if (!sessionId) {
      res.status(400).json({ code: "NO_SESSION", message: "Session required." });
      return;
    }
    const projects = await getProjectsBySession(sessionId);
    res.json(projects);
  } catch (err) {
    res.status(500).json({
      code: "LIST_FAILED",
      message: "We couldn't load your projects. Please try again.",
    });
  }
});

projectRoutes.get("/projects/:id", async (req: Request, res: Response) => {
  try {
    const sessionId = (req as RequestWithSession).sessionId;
    const { id } = req.params;
    if (!sessionId || !id) {
      res.status(400).json({ code: "INVALID_INPUT", message: "Project id required." });
      return;
    }
    const project = await getProjectById(id);
    if (!project || project.sessionId !== sessionId) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found." });
      return;
    }
    const docs = await getDocsByProjectId(project.id);
    res.json({ project, docs });
  } catch (err) {
    res.status(500).json({
      code: "FETCH_FAILED",
      message: "We couldn't load the project. Please try again.",
    });
  }
});
