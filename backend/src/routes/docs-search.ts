/**
 * Public docs search endpoint: hybrid FTS + vector search.
 * No auth required — uses public project data only.
 */

import { Router, Request, Response } from "express";
import { getProjectBySlug, ftsSearchDocs, vectorSearchDocs } from "../db/index.js";
import { embed } from "../modules/ai-engine/index.js";
import { logger } from "../logger/index.js";

export const docsSearchRoutes = Router();

const DEFAULT_VECTOR_WEIGHT = 0.6;
const DEFAULT_FTS_WEIGHT = 0.4;
const DEFAULT_VECTOR_MIN_SIMILARITY = 0.65;
const DEFAULT_FTS_MIN_RANK = 0.02;

function parseNumberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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

    const vectorMinSimilarity = parseNumberEnv(
      process.env.DOC_SEARCH_MIN_SIMILARITY,
      DEFAULT_VECTOR_MIN_SIMILARITY
    );
    const ftsMinRank = parseNumberEnv(process.env.DOC_SEARCH_MIN_RANK, DEFAULT_FTS_MIN_RANK);

    const [ftsResults, queryEmbedding] = await Promise.all([
      ftsSearchDocs(resolvedProjectId, q, 12, ftsMinRank),
      embed(q).catch(() => null),
    ]);

    let vecResults: typeof ftsResults = [];
    if (queryEmbedding) {
      vecResults = await vectorSearchDocs(resolvedProjectId, queryEmbedding, 12, vectorMinSimilarity);
    }

    const maxFtsRank = Math.max(...ftsResults.map((r) => r.rank ?? 0), 0);
    const vectorWeight = parseNumberEnv(process.env.DOC_SEARCH_VECTOR_WEIGHT, DEFAULT_VECTOR_WEIGHT);
    const ftsWeight = parseNumberEnv(process.env.DOC_SEARCH_FTS_WEIGHT, DEFAULT_FTS_WEIGHT);

    const merged = new Map<
      string,
      {
        row: (typeof ftsResults)[number];
        ftsScore: number;
        vectorScore: number;
        score: number;
      }
    >();

    for (const row of ftsResults) {
      const normalizedRank = maxFtsRank > 0 ? (row.rank ?? 0) / maxFtsRank : 0;
      const entry = merged.get(row.slug);
      const nextFts = Math.max(entry?.ftsScore ?? 0, normalizedRank);
      const vectorScore = entry?.vectorScore ?? 0;
      const score = (nextFts * ftsWeight) + (vectorScore * vectorWeight);
      merged.set(row.slug, { row: entry?.row ?? row, ftsScore: nextFts, vectorScore, score });
    }

    for (const row of vecResults) {
      const vectorScore = row.similarity ?? 0;
      const entry = merged.get(row.slug);
      const nextVector = Math.max(entry?.vectorScore ?? 0, vectorScore);
      const ftsScore = entry?.ftsScore ?? 0;
      const score = (ftsScore * ftsWeight) + (nextVector * vectorWeight);
      merged.set(row.slug, { row: entry?.row ?? row, ftsScore, vectorScore: nextVector, score });
    }

    const ranked = [...merged.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => item.row);

    logger.info("metric.docs_search", {
      projectId: resolvedProjectId,
      queryLength: q.length,
      ftsCount: ftsResults.length,
      vectorCount: vecResults.length,
      mergedCount: merged.size,
      vectorMinSimilarity,
      ftsMinRank,
    });

    res.json({ results: ranked });
  } catch (err) {
    logger.error("Docs search failed", { error: err });
    res.json({ results: [] });
  }
});
