/**
 * Persists indexed files and code chunks to Supabase via the db layer.
 */

import {
  upsertIndexedFile,
  replaceChunksForFile,
  updateCieStatus,
} from "../../../db/index.js";
import { logger } from "../../../logger/index.js";
import type { WalkedFile } from "../ingestion/file-walker.js";
import type { EmbeddedChunk } from "../embedding/batch-embedder.js";

export interface StoreResult {
  filesStored: number;
  chunksStored: number;
}

/** Store a single file's chunks and update the indexed_files record. */
export async function storeFileChunks(
  projectId: string,
  file: WalkedFile,
  chunks: EmbeddedChunk[]
): Promise<number> {
  const fileId = await upsertIndexedFile({
    projectId,
    filePath: file.path,
    language: file.language,
    fileSha: file.sha,
    sizeBytes: file.size,
    chunkCount: chunks.length,
  });

  if (!fileId) {
    logger.error("Failed to upsert indexed file", { projectId, filePath: file.path });
    return 0;
  }

  return replaceChunksForFile(
    projectId,
    fileId,
    chunks.map((c) => ({
      filePath: file.path,
      language: file.language ?? "unknown",
      chunkType: c.chunkType,
      symbolName: c.symbolName,
      parentSymbol: c.parentSymbol,
      content: c.content,
      contentHash: c.contentHash,
      startLine: c.startLine,
      endLine: c.endLine,
      tokenCount: Math.ceil(c.content.length / 4),
      embedding: c.embedding,
    }))
  );
}

/** Mark project CIE status as indexed with final counts. */
export async function finalizeIndex(projectId: string, chunkCount: number): Promise<void> {
  await updateCieStatus(projectId, "indexed", {
    chunkCount,
    indexedAt: new Date().toISOString(),
    error: null,
  });
}

/** Mark project CIE status as error. */
export async function markIndexError(projectId: string, error: string): Promise<void> {
  await updateCieStatus(projectId, "error", { error });
}
