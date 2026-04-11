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

/**
 * Embed an array of raw chunks. Returns the same chunks with `embedding` added.
 * Truncates chunk content to ~500 chars for the embedding input to save tokens.
 */
export async function embedChunks(chunks: RawChunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return [];

  const texts = chunks.map((c) => {
    const label = c.symbolName ? `${c.chunkType} ${c.symbolName}: ` : "";
    return (label + c.content).slice(0, 2000);
  });

  try {
    const vectors = await embedBatch(texts);
    return chunks.map((c, i) => ({ ...c, embedding: vectors[i] ?? null }));
  } catch (err) {
    logger.error("Batch embedding failed; storing chunks without embeddings", { error: err });
    return chunks.map((c) => ({ ...c, embedding: null }));
  }
}
