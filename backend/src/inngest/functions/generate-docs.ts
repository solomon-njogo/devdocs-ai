/**
 * Inngest function: generate documentation after indexing.
 * Triggered by "cie/indexed" event.
 * Plans doc jobs via the Diátaxis router, generates each, and upserts to docs_pages.
 */

import { inngest } from "../client.js";
import { planDocJobs } from "../../modules/cie/generation/diataxis-router.js";
import { finalizeGeneratedDocLinks, generateDocPage } from "../../modules/cie/generation/doc-generator.js";
import { regenerateIdeaDocs } from "../../modules/cie/generation/regenerate-idea.js";
import { runWithConcurrency } from "../../modules/cie/generation/concurrency.js";
import { getProjectById, updateCieStatus } from "../../db/index.js";
import { logger } from "../../logger/index.js";
import type { DiátaxisLayer } from "../../shared/index.js";

export const generateDocsFn = inngest.createFunction(
  {
    id: "generate-docs",
    concurrency: { limit: 3 },
    triggers: [{ event: "cie/indexed" }],
  },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    const project = await step.run("lookup-project", () =>
      getProjectById(projectId)
    );

    if (!project) return;

    if (project.type === "new_idea") {
      await step.run("regenerate-idea-docs", () =>
        regenerateIdeaDocs(project)
      );
      
      await step.run("mark-indexed", () => 
        updateCieStatus(projectId, "indexed")
      );
      
      return { generated: 3 };
    }

    const jobs = await step.run("plan-doc-jobs", () =>
      planDocJobs(projectId)
    );

    logger.info("Generate docs: planned jobs", { projectId, jobCount: jobs.length });

    // Mirror the direct route: transition to "generating" and record page count
    // so the progress UI works when Inngest is driving the pipeline.
    await step.run("mark-generating", () =>
      updateCieStatus(projectId, "generating", { docsPlanned: jobs.length })
    );

    const siblingPages = jobs.map((j) => ({
      slug: j.slug,
      title: j.title,
      layer: j.layer as DiátaxisLayer,
    }));

    for (const job of jobs) {
      job.projectSlug = project?.slug ?? undefined;
      job.siblingPages = siblingPages;
    }

    const concurrency = Math.max(1, Number(process.env.DOC_GEN_CONCURRENCY ?? 3));
    const results = await runWithConcurrency(jobs, concurrency, (job) => {
      const stepId = `generate-${job.slug.replace(/\//g, "-")}`;
      return step.run(stepId, () => generateDocPage(job));
    });

    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) {
      logger.warn("Generate docs: some pages failed", { projectId, failed, total: jobs.length });
    }

    await step.run("finalize-doc-links", () =>
      finalizeGeneratedDocLinks(projectId, project?.slug ?? undefined)
    );

    await step.run("mark-indexed", () => updateCieStatus(projectId, "indexed"));

    return { generated: jobs.length - failed, failed };
  }
);
