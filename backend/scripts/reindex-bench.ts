/**
 * Re-index benchmark script.
 *
 * Usage:
 *   tsx backend/scripts/reindex-bench.ts <projectId>
 *
 * Requires the same env as the backend (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GITHUB token accessible via repo_tokens row for the project, and an
 * embedding provider key). Intended for local performance testing only.
 *
 * Prints per-phase timings (walk, index, generate) plus dedup counters so we
 * can measure the impact of file_sha / content_hash / source_sha skip logic
 * between runs.
 */

import "dotenv/config";
import { getProjectById, getRepoToken, countChunksByProject } from "../src/db/index.js";
import { indexRepository } from "../src/modules/cie/index.js";
import { planDocJobs } from "../src/modules/cie/generation/diataxis-router.js";
import { finalizeGeneratedDocLinks, generateDocPage } from "../src/modules/cie/generation/doc-generator.js";
import { runWithConcurrency } from "../src/modules/cie/generation/concurrency.js";
import { logger } from "../src/logger/index.js";

function fmt(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  const m = Math.floor(ms / 60_000);
  const s = ((ms % 60_000) / 1000).toFixed(1);
  return `${m}m${s}s`;
}

async function main(): Promise<void> {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error("Usage: tsx backend/scripts/reindex-bench.ts <projectId>");
    process.exit(1);
  }

  const project = await getProjectById(projectId);
  if (!project) {
    console.error(`Project not found: ${projectId}`);
    process.exit(1);
  }
  if (!project.repoId) {
    console.error("Project has no repoId — nothing to index.");
    process.exit(1);
  }

  const token = await getRepoToken(project.repoId);
  if (!token) {
    console.error("No repo token stored for this project.");
    process.exit(1);
  }

  const branch = project.repoBranch ?? "main";

  console.log("── Re-index benchmark ──");
  console.log(`project:     ${project.name} (${project.id})`);
  console.log(`repo:        ${project.repoId}@${branch}`);
  console.log();

  const indexStart = Date.now();
  const result = await indexRepository(projectId, project.repoId, token, branch);
  const indexMs = Date.now() - indexStart;

  const totalChunks = await countChunksByProject(projectId);

  console.log("── Indexing ──");
  console.log(`wall-clock:      ${fmt(indexMs)}`);
  console.log(`files indexed:   ${result.filesIndexed}`);
  console.log(`files skipped:   ${result.filesSkipped}   (file_sha unchanged)`);
  console.log(`files removed:   ${result.filesRemoved}   (pruned from tree)`);
  console.log(`chunks embedded: ${result.chunksEmbedded}`);
  console.log(`chunks reused:   ${result.chunksReused}   (content_hash hit)`);
  console.log(`chunks stored:   ${result.chunksStored}   (rewritten this run)`);
  console.log(`chunks total:    ${totalChunks}   (including retained from skipped files)`);
  console.log(`errors:          ${result.errors.length}`);
  console.log();

  if (project.type === "new_idea") {
    console.log("Project type is new_idea — skipping Diátaxis generation phase.");
    return;
  }

  const planStart = Date.now();
  const jobs = await planDocJobs(projectId);
  const planMs = Date.now() - planStart;

  for (const job of jobs) {
    job.projectSlug = project.slug ?? undefined;
    job.siblingPages = jobs.map((j) => ({ slug: j.slug, title: j.title, layer: j.layer }));
  }

  const genStart = Date.now();
  let succeeded = 0;
  let failed = 0;
  const concurrency = Math.max(1, Number(process.env.DOC_GEN_CONCURRENCY ?? 3));
  const results = await runWithConcurrency(jobs, concurrency, async (job) => {
    await generateDocPage(job);
    return job.slug;
  });
  for (const r of results) {
    if (r.ok) succeeded++;
    else failed++;
  }
  const genMs = Date.now() - genStart;

  const finalizeStart = Date.now();
  await finalizeGeneratedDocLinks(projectId, project.slug ?? undefined);
  const finalizeMs = Date.now() - finalizeStart;

  console.log("── Generation ──");
  console.log(`planned jobs:   ${jobs.length}`);
  console.log(`plan time:      ${fmt(planMs)}`);
  console.log(`generate time:  ${fmt(genMs)}   (${concurrency} concurrent)`);
  console.log(`finalize time:  ${fmt(finalizeMs)}`);
  console.log(`succeeded:      ${succeeded}`);
  console.log(`failed:         ${failed}`);
  console.log();

  console.log("── Total ──");
  console.log(`wall-clock:     ${fmt(indexMs + planMs + genMs + finalizeMs)}`);
}

main().catch((err) => {
  logger.error("Bench failed", { error: err });
  console.error(err);
  process.exit(1);
});
