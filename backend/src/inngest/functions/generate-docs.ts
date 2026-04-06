/**
 * Inngest function: generate documentation after indexing.
 * Triggered by "cie/indexed" event.
 * Plans doc jobs via the Diátaxis router, generates each, and upserts to docs_pages.
 */

import { inngest } from "../client.js";
import { planDocJobs } from "../../modules/cie/generation/diataxis-router.js";
import { generateDocPage } from "../../modules/cie/generation/doc-generator.js";
import { getProjectById } from "../../db/index.js";
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

    const jobs = await step.run("plan-doc-jobs", () =>
      planDocJobs(projectId)
    );

    logger.info("Generate docs: planned jobs", { projectId, jobCount: jobs.length });

    const siblingPages = jobs.map((j) => ({
      slug: j.slug,
      title: j.title,
      layer: j.layer as DiátaxisLayer,
    }));

    for (const job of jobs) {
      job.projectSlug = project?.slug ?? undefined;
      job.siblingPages = siblingPages;
      const stepId = `generate-${job.slug.replace(/\//g, "-")}`;
      await step.run(stepId, () => generateDocPage(job));
    }

    return { generated: jobs.length };
  }
);
