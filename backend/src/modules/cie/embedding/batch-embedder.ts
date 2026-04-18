/**
 * Batch-embeds code chunks via ai-engine embedding provider.
 * Adds embedding vectors to chunk objects in-place.
 */

import { embedBatch } from "../../ai-engine/index.js";
import { logger } from "../../../logger/index.js";
import type { RawChunk } from "../chunking/semantic-chunker.js";

export interface EmbeddedChunk extends RawChunk {
  embedding: number[] | null;
}

function buildEmbeddingInput(c: RawChunk): string {
  const label = c.symbolName ? `${c.chunkType} ${c.symbolName}: ` : "";
  return (label + c.content).slice(0, 2000);
}

/**
 * Embed an array of raw chunks. Returns the same chunks with `embedding` added.
 * Truncates chunk content to ~2000 chars for the embedding input to save tokens.
 *
 * Throws on terminal embedding failure (after retries in the provider). The
 * caller is expected to catch per-file and mark the file as errored so we
 * don't persist un-searchable chunks with `embedding: null`.
 */
export async function embedChunks(chunks: RawChunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return [];

  const texts = chunks.map(buildEmbeddingInput);

  try {
    const vectors = await embedBatch(texts);
    return chunks.map((c, i) => ({ ...c, embedding: vectors[i] ?? null }));
  } catch (err) {
    logger.error("Batch embedding failed", { error: err, chunkCount: chunks.length });
    throw err;
  }
}

/**
 * Embed chunks, reusing any cached embeddings keyed by content_hash. Only
 * chunks whose hash is not in `existingByHash` get sent to the embedding API.
 * This is how we avoid paying to re-embed identical code when a single file
 * has changed but most of its chunks haven't.
 */
export async function embedChunksWithReuse(
  chunks: RawChunk[],
  existingByHash: Map<string, number[]>
): Promise<{ chunks: EmbeddedChunk[]; embedded: number; reused: number }> {
  if (chunks.length === 0) return { chunks: [], embedded: 0, reused: 0 };

  const toEmbedIdx: number[] = [];
  const result: EmbeddedChunk[] = new Array(chunks.length);
  let reused = 0;

  for (let i = 0; i < chunks.length; i++) {
    const cached = existingByHash.get(chunks[i].contentHash);
    if (cached) {
      result[i] = { ...chunks[i], embedding: cached };
      reused++;
    } else {
      toEmbedIdx.push(i);
    }
  }

  if (toEmbedIdx.length === 0) {
    return { chunks: result, embedded: 0, reused };
  }

  const texts = toEmbedIdx.map((i) => buildEmbeddingInput(chunks[i]));
  try {
    const vectors = await embedBatch(texts);
    for (let k = 0; k < toEmbedIdx.length; k++) {
      const i = toEmbedIdx[k];
      result[i] = { ...chunks[i], embedding: vectors[k] ?? null };
    }
    return { chunks: result, embedded: toEmbedIdx.length, reused };
  } catch (err) {
    logger.error("Batch embedding failed", { error: err, chunkCount: toEmbedIdx.length });
    throw err;
  }
}
