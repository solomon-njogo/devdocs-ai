/**
 * Project list and project detail (with linked docs).
 * Requires authentication; uses userId from JWT.
 */

import { Router, Request, Response } from "express";
import {
  getProjectsByUserId,
  getProjectById,
  deleteProjectById,
  getDocsByProjectId,
  getDocById,
  insertProjectDoc,
  updateProjectDoc,
  deleteProjectDoc,
} from "../db/index.js";
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

projectRoutes.delete("/projects/:id", async (req: Request, res: Response) => {
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
    const ok = await deleteProjectById(id, userId);
    if (!ok) {
      res.status(500).json({
        code: "DELETE_FAILED",
        message: "We couldn't delete the project. Please try again.",
      });
      return;
    }
    res.status(204).send();
  } catch (err) {
    logger.error("Delete project failed", { error: err });
    res.status(500).json({
      code: "DELETE_FAILED",
      message: "We couldn't delete the project. Please try again.",
    });
  }
});

const DOC_TYPES = ["prd", "user_story", "user_journey"] as const;

projectRoutes.post("/projects/:projectId/docs", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    const { projectId } = req.params;
    if (!userId || !projectId) {
      res.status(400).json({ code: "INVALID_INPUT", message: "Project id required." });
      return;
    }
    const project = await getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found." });
      return;
    }
    const body = req.body as { type?: string; path?: string; content?: string };
    const { type, path, content } = body;
    if (
      !type ||
      !DOC_TYPES.includes(type as (typeof DOC_TYPES)[number]) ||
      typeof path !== "string" ||
      !path.trim() ||
      typeof content !== "string"
    ) {
      res.status(400).json({
        code: "INVALID_INPUT",
        message: "Please provide type (prd, user_story, or user_journey), path, and content.",
      });
      return;
    }
    const doc = await insertProjectDoc(projectId, {
      type: type as "prd" | "user_story" | "user_journey",
      path: path.trim(),
      content: content.trim(),
    });
    if (!doc) {
      res.status(500).json({
        code: "CREATE_FAILED",
        message: "We couldn't create the document. Please try again.",
      });
      return;
    }
    res.status(201).json(doc);
  } catch (err) {
    logger.error("Create doc failed", { error: err });
    res.status(500).json({
      code: "CREATE_FAILED",
      message: "We couldn't create the document. Please try again.",
    });
  }
});

projectRoutes.patch("/projects/:projectId/docs/:docId", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    const { projectId, docId } = req.params;
    if (!userId || !projectId || !docId) {
      res.status(400).json({ code: "INVALID_INPUT", message: "Project and document id required." });
      return;
    }
    const project = await getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found." });
      return;
    }
    const existing = await getDocById(docId, projectId);
    if (!existing) {
      res.status(404).json({ code: "NOT_FOUND", message: "Document not found." });
      return;
    }
    const body = req.body as { content?: string; path?: string; type?: string };
    const payload: { content?: string; path?: string; type?: "prd" | "user_story" | "user_journey" } = {};
    if (body.content !== undefined) payload.content = typeof body.content === "string" ? body.content : "";
    if (body.path !== undefined) payload.path = typeof body.path === "string" ? body.path.trim() : "";
    if (body.type !== undefined && DOC_TYPES.includes(body.type as (typeof DOC_TYPES)[number])) {
      payload.type = body.type as "prd" | "user_story" | "user_journey";
    }
    if (Object.keys(payload).length === 0) {
      res.json(existing);
      return;
    }
    const doc = await updateProjectDoc(docId, projectId, payload);
    if (!doc) {
      res.status(500).json({
        code: "UPDATE_FAILED",
        message: "We couldn't update the document. Please try again.",
      });
      return;
    }
    res.json(doc);
  } catch (err) {
    logger.error("Update doc failed", { error: err });
    res.status(500).json({
      code: "UPDATE_FAILED",
      message: "We couldn't update the document. Please try again.",
    });
  }
});

projectRoutes.delete("/projects/:projectId/docs/:docId", async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    const { projectId, docId } = req.params;
    if (!userId || !projectId || !docId) {
      res.status(400).json({ code: "INVALID_INPUT", message: "Project and document id required." });
      return;
    }
    const project = await getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found." });
      return;
    }
    const existing = await getDocById(docId, projectId);
    if (!existing) {
      res.status(404).json({ code: "NOT_FOUND", message: "Document not found." });
      return;
    }
    const ok = await deleteProjectDoc(docId, projectId);
    if (!ok) {
      res.status(500).json({
        code: "DELETE_FAILED",
        message: "We couldn't delete the document. Please try again.",
      });
      return;
    }
    res.status(204).send();
  } catch (err) {
    logger.error("Delete doc failed", { error: err });
    res.status(500).json({
      code: "DELETE_FAILED",
      message: "We couldn't delete the document. Please try again.",
    });
  }
});
