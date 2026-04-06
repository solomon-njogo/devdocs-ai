/**
 * Public docs search endpoint: hybrid FTS + vector search.
 * No auth required — uses public project data only.
 */

import { Router, Request, Response } from "express";
import { getProjectBySlug, ftsSearchDocs, vectorSearchDocs } from "../db/index.js";
import { embed } from "../modules/ai-engine/index.js";
import { logger } from "../logger/index.js";

export const docsSearchRoutes = Router();

/**
 * GET /api/docs/search?project_id=UUID&q=query
 * Returns merged FTS + semantic results, deduplicated.
 */
docsSearchRoutes.get("/docs/search", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) ?? "";
    const projectId = (req.query.project_id as string) ?? "";
    const projectSlug = (req.query.project_slug as string) ?? "";

    if (!q.trim()) {
      res.json({ results: [] });
      return;
    }

    let resolvedProjectId = projectId;
    if (!resolvedProjectId && projectSlug) {
      const project = await getProjectBySlug(projectSlug);
      if (project) resolvedProjectId = project.id;
    }

    if (!resolvedProjectId) {
      res.json({ results: [] });
      return;
    }

    const [ftsResults, queryEmbedding] = await Promise.all([
      ftsSearchDocs(resolvedProjectId, q, 8),
      embed(q).catch(() => null),
    ]);

    let vecResults: typeof ftsResults = [];
    if (queryEmbedding) {
      vecResults = await vectorSearchDocs(resolvedProjectId, queryEmbedding, 8);
    }

    const seen = new Set<string>();
    const merged: typeof ftsResults = [];
    for (const row of [...ftsResults, ...vecResults]) {
      if (!seen.has(row.slug)) {
        seen.add(row.slug);
        merged.push(row);
      }
    }

    res.json({ results: merged.slice(0, 10) });
  } catch (err) {
    logger.error("Docs search failed", { error: err });
    res.json({ results: [] });
  }
});
