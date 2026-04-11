/**
 * CIE — Codebase Intelligence Engine.
 * Public API for indexing repositories and assembling context.
 * See README.md for scope and dependencies.
 */

import { logger } from "../../logger/index.js";
import { readFile } from "../github/index.js";
import { updateCieStatus, deleteChunksByProject, deleteIndexedFilesByProject, deleteSymbolsByProject, deleteFileDependenciesByProject } from "../../db/index.js";
import { walkRepository } from "./ingestion/file-walker.js";
import { chunkFile } from "./chunking/semantic-chunker.js";
import { embedChunks } from "./embedding/batch-embedder.js";
import { storeFileChunks, finalizeIndex, markIndexError } from "./storage/chunk-store.js";
import { assembleContext } from "./retrieval/context-assembler.js";

export type { AssembledContext } from "./retrieval/context-assembler.js";

export interface IndexResult {
  filesIndexed: number;
  chunksStored: number;
  errors: string[];
}

/**
 * Full repository indexing pipeline:
 * walk → read → chunk → embed → store.
 * Sets cie_status on the project throughout the process.
 */
export async function indexRepository(
  projectId: string,
  repoId: string,
  token: string,
  branch = "main"
): Promise<IndexResult> {
  const errors: string[] = [];
  let filesIndexed = 0;
  let totalChunks = 0;

  try {
    await updateCieStatus(projectId, "indexing");

    // Clear previous index data
    await Promise.all([
      deleteChunksByProject(projectId),
      deleteIndexedFilesByProject(projectId),
      deleteSymbolsByProject(projectId),
      deleteFileDependenciesByProject(projectId),
    ]);

    const files = await walkRepository(repoId, token, branch);
    logger.info("CIE: indexing started", { projectId, repoId, fileCount: files.length });

    // Process files in small batches to control memory / API concurrency
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (file) => {
          try {
            const content = await readFile(repoId, file.path, token);
            if (!content) return;

            const rawChunks = chunkFile(content, file.language ?? "unknown");
            if (rawChunks.length === 0) return;

            const embedded = await embedChunks(rawChunks);
            const stored = await storeFileChunks(projectId, file, embedded);
            totalChunks += stored;
            filesIndexed++;
          } catch (err) {
            const msg = `Failed to index ${file.path}: ${err instanceof Error ? err.message : String(err)}`;
            errors.push(msg);
            logger.warn("CIE: file indexing failed", { filePath: file.path, error: err });
          }
        })
      );
    }

    await finalizeIndex(projectId, totalChunks);
    logger.info("CIE: indexing complete", { projectId, filesIndexed, totalChunks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markIndexError(projectId, msg);
    logger.error("CIE: indexing failed", { projectId, error: err });
    throw err;
  }

  return { filesIndexed, chunksStored: totalChunks, errors };
}

export { assembleContext };
