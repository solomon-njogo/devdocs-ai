/**
 * Generates a single documentation page from a DocJob.
 * Assembles codebase context, builds a prompt with layer rules,
 * calls the LLM, embeds the result, and upserts to docs_pages.
 */

import type { DocJob } from "../../../shared/index.js";
import { complete, embed } from "../../ai-engine/index.js";
import { assembleContext } from "../retrieval/context-assembler.js";
import { upsertDocsPage } from "../../../db/index.js";
import { LAYER_RULES } from "./prompt-templates.js";
import { logger } from "../../../logger/index.js";

/**
 * Generate one doc page from a planned job. Idempotent (upserts by project_id + slug).
 */
export async function generateDocPage(job: DocJob): Promise<void> {
  const ctx = await assembleContext(job.projectId, job.focusQuery);

  const prompt = [
    "You are generating documentation for a software project.",
    `Document to generate: ${job.title}`,
    `Slug: ${job.slug}`,
    "",
    LAYER_RULES[job.layer],
    "",
    "CODEBASE CONTEXT:",
    ctx.prompt,
  ].join("\n");

  const content = await complete(prompt, { maxTokens: 4000 });

  const summary =
    content
      .split("\n")
      .find((l) => l.trim().length > 40)
      ?.slice(0, 300) ?? "";

  let docEmbedding: number[] | null = null;
  try {
    docEmbedding = await embed(`${job.title} ${content.slice(0, 500)}`);
  } catch (err) {
    logger.warn("Doc embedding failed; storing without embedding", { slug: job.slug, error: err });
  }

  await upsertDocsPage({
    projectId: job.projectId,
    slug: job.slug,
    title: job.title,
    content,
    summary,
    layer: job.layer,
    isAuto: true,
    sourceFiles: job.sourceFiles,
    embedding: docEmbedding,
  });

  logger.info("Doc page generated", { projectId: job.projectId, slug: job.slug, layer: job.layer });
}
