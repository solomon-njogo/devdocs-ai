/**
 * CIE — Codebase Intelligence Engine.
 * Public API for indexing repositories and assembling context.
 * See README.md for scope and dependencies.
 */

import { logger } from "../../logger/index.js";
import { readFile } from "../github/index.js";
import {
  updateCieStatus,
  getIndexedFileShas,
  deleteRemovedFiles,
  getIndexedFileId,
  getChunkEmbeddingsByHash,
  countChunksByProject,
} from "../../db/index.js";
import { walkRepository } from "./ingestion/file-walker.js";
import { chunkFile } from "./chunking/semantic-chunker.js";
import { embedChunksWithReuse } from "./embedding/batch-embedder.js";
import { storeFileChunks, finalizeIndex, markIndexError } from "./storage/chunk-store.js";
import { assembleContext } from "./retrieval/context-assembler.js";

export type { AssembledContext } from "./retrieval/context-assembler.js";

export interface IndexResult {
  filesIndexed: number;
  filesSkipped: number;
  filesRemoved: number;
  chunksStored: number;
  chunksReused: number;
  chunksEmbedded: number;
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
  let filesSkipped = 0;
  let filesRemoved = 0;
  let chunksStored = 0;
  let chunksReused = 0;
  let chunksEmbedded = 0;

  try {
    await updateCieStatus(projectId, "indexing");

    const files = await walkRepository(repoId, token, branch);

    // Load prior state so we can skip unchanged files (sha-match) and prune
    // files that no longer exist in the current tree.
    const priorShas = await getIndexedFileShas(projectId);
    filesRemoved = await deleteRemovedFiles(
      projectId,
      files.map((f) => f.path)
    );

    // Partition walked files: skip those whose blob SHA matches what we
    // already have in indexed_files. Only `changed` files go through
    // read → chunk → embed → store.
    const changed = files.filter((f) => priorShas.get(f.path) !== f.sha);
    filesSkipped = files.length - changed.length;

    logger.info("CIE: indexing started", {
      projectId,
      repoId,
      fileCount: files.length,
      changedCount: changed.length,
      skippedCount: filesSkipped,
      removedCount: filesRemoved,
    });

    const BATCH_SIZE = Math.max(1, Number(process.env.CIE_FILE_BATCH_SIZE ?? 15));
    for (let i = 0; i < changed.length; i += BATCH_SIZE) {
      const batch = changed.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (file) => {
          try {
            const content = await readFile(repoId, file.path, token);
            if (!content) return;

            const rawChunks = chunkFile(content, file.language ?? "unknown");
            if (rawChunks.length === 0) return;

            // Chunk-level dedup: reuse embeddings from any prior run whose
            // content_hash still matches a new chunk. Only new/changed chunks
            // are sent to the embedding API.
            const existingFileId = await getIndexedFileId(projectId, file.path);
            const existingByHash = existingFileId
              ? await getChunkEmbeddingsByHash(existingFileId)
              : new Map<string, number[]>();

            const { chunks: embedded, embedded: embCount, reused: reuseCount } =
              await embedChunksWithReuse(rawChunks, existingByHash);

            const stored = await storeFileChunks(projectId, file, embedded);
            chunksStored += stored;
            chunksEmbedded += embCount;
            chunksReused += reuseCount;
            filesIndexed++;
          } catch (err) {
            const msg = `Failed to index ${file.path}: ${err instanceof Error ? err.message : String(err)}`;
            errors.push(msg);
            logger.warn("CIE: file indexing failed", { filePath: file.path, error: err });
          }
        })
      );
    }

    // Reflect the true total chunk count in cie_chunk_count (including chunks
    // from skipped files that weren't touched this run).
    const totalChunkCount = await countChunksByProject(projectId);
    await finalizeIndex(projectId, totalChunkCount);
    logger.info("CIE: indexing complete", {
      projectId,
      filesIndexed,
      filesSkipped,
      filesRemoved,
      chunksStored,
      chunksEmbedded,
      chunksReused,
      totalChunkCount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markIndexError(projectId, msg);
    logger.error("CIE: indexing failed", { projectId, error: err });
    throw err;
  }

  return {
    filesIndexed,
    filesSkipped,
    filesRemoved,
    chunksStored,
    chunksEmbedded,
    chunksReused,
    errors,
  };
}

export { assembleContext };
