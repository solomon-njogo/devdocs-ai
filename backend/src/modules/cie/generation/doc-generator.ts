/**
 * Generates a single documentation page from a DocJob.
 * Assembles codebase context, builds a prompt with layer rules,
 * calls the LLM, embeds the result, and upserts to docs_pages.
 */

import type { DocJob } from "../../../shared/index.js";
import { complete, embed } from "../../ai-engine/index.js";
import { assembleContext } from "../retrieval/context-assembler.js";
import { upsertDocsPage } from "../../../db/index.js";
import { LAYER_RULES, OUTPUT_LANGUAGE_ENGLISH_ONLY } from "./prompt-templates.js";
import { logger } from "../../../logger/index.js";

function buildLinkInstruction(job: DocJob): string {
  const lines: string[] = [];

  lines.push("INTERNAL LINKS:");
  if (job.projectSlug) {
    lines.push(`When linking to other documentation pages, use absolute paths: /docs/${job.projectSlug}/<slug>`);
  } else {
    lines.push("When linking to other documentation pages, use relative slug paths: ./<slug>");
  }

  if (job.siblingPages?.length) {
    lines.push("Available pages you can link to:");
    for (const p of job.siblingPages) {
      if (p.slug === job.slug) continue;
      const prefix = job.projectSlug ? `/docs/${job.projectSlug}/${p.slug}` : `./${p.slug}`;
      lines.push(`  - [${p.title}](${prefix}) (${p.layer})`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate one doc page from a planned job. Idempotent (upserts by project_id + slug).
 */
export async function generateDocPage(job: DocJob): Promise<void> {
  const ctx = await assembleContext(job.projectId, job.focusQuery);

  const linkInstruction = buildLinkInstruction(job);

  const prompt = [
    "You are generating documentation for a software project.",
    OUTPUT_LANGUAGE_ENGLISH_ONLY,
    "",
    `Document to generate: ${job.title}`,
    `Slug: ${job.slug}`,
    "",
    LAYER_RULES[job.layer],
    "",
    linkInstruction,
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
