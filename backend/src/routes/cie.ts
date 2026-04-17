/**
 * CIE routes: trigger indexing and check status.
 * Requires authentication.
 *
 * Runs indexing + doc generation directly (no Inngest dev server needed).
 * Falls back to Inngest when INNGEST_EVENT_KEY is configured.
 */

import { Router, Request, Response } from "express";
import type { RequestWithUser } from "../shared/index.js";
import { getProjectById, getRepoToken, updateCieStatus } from "../db/index.js";
import { indexRepository } from "../modules/cie/index.js";
import { planDocJobs } from "../modules/cie/generation/diataxis-router.js";
import { finalizeGeneratedDocLinks, generateDocPage } from "../modules/cie/generation/doc-generator.js";
import { regenerateIdeaDocs } from "../modules/cie/generation/regenerate-idea.js";
import { inngest } from "../inngest/client.js";
import { logger } from "../logger/index.js";

export const cieRoutes = Router();

/**
 * Run the full index → generate pipeline in-process.
 * Fire-and-forget: errors are logged and reflected in cie_status.
 */
async function runPipelineDirect(
  projectId: string,
  repoId: string | null | undefined,
  branch: string
): Promise<void> {
  
  if (repoId && repoId !== "none") {
    const token = await getRepoToken(repoId);
    if (!token) {
      logger.error("Pipeline: no token available", { projectId, repoId });
      return;
    }

    logger.info("Pipeline: starting indexing", { projectId, repoId, branch });
    const result = await indexRepository(projectId, repoId, token, branch);
    logger.info("Pipeline: indexing complete", {
      projectId,
      filesIndexed: result.filesIndexed,
      chunks: result.chunksStored,
      errors: result.errors.length,
    });
  } else {
    logger.info("Pipeline: no repoId provided, skipping indexing phase", { projectId });
  }

  // Transition to "generating" and record how many doc pages will be written
  const project = await getProjectById(projectId);
  if (!project) return;

  if (project.type === "new_idea") {
    await regenerateIdeaDocs(project);
    await updateCieStatus(projectId, "indexed");
    logger.info("Pipeline: complete for idea", { projectId });
    return;
  }

  // Transition to "generating" and record how many doc pages will be written
  const jobs = await planDocJobs(projectId);
  await updateCieStatus(projectId, "generating", { docsPlanned: jobs.length });
  logger.info("Pipeline: generating docs", { projectId, jobCount: jobs.length });

  const generatedSlugs: string[] = [];

  for (const job of jobs) {
    try {
      job.projectSlug = project.slug ?? undefined;
      await generateDocPage(job);
      generatedSlugs.push(job.slug);
    } catch (err) {
      logger.error("Pipeline: doc generation failed for page", {
        slug: job.slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    await finalizeGeneratedDocLinks(projectId, project.slug ?? undefined);
  } catch (err) {
    logger.error("Pipeline: doc link finalization failed", {
      projectId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Mark fully complete — indexing + docs both done
  await updateCieStatus(projectId, "indexed");

  logger.info("Pipeline: complete", {
    projectId,
    docsPlanned: jobs.length,
    docsGenerated: generatedSlugs.length,
  });
}

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

    // If no repo, we can still generate docs (e.g. from idea metadata).
    // So we don't throw NO_REPO anymore.

    const useInngest = !!process.env.INNGEST_EVENT_KEY;

    if (useInngest) {
      await inngest.send({
        name: "cie/index-requested",
        data: {
          projectId: project.id,
          repoId: project.repoId ?? "none",
          branch: project.repoBranch ?? "main",
        },
      });
    } else {
      runPipelineDirect(project.id, project.repoId, project.repoBranch ?? "main").catch(
        (err) => logger.error("Background pipeline failed", { projectId: project.id, error: err })
      );
    }

    logger.info("CIE index requested", { projectId: project.id, repoId: project.repoId, mode: useInngest ? "inngest" : "direct" });
    res.json({ message: "Indexing started. Check project status for progress." });
  } catch (err) {
    logger.error("CIE index trigger failed", { error: err });
    res.status(500).json({
      code: "INDEX_FAILED",
      message: "We couldn't start indexing. Please try again.",
    });
  }
});
