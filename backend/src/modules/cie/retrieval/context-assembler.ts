/**
 * Assembles LLM context from the vector index.
 * Given a focus query, retrieves the most relevant code chunks
 * and concatenates them into a single prompt-ready string.
 */

import { embed } from "../../ai-engine/index.js";
import { vectorSearchChunks } from "../../../db/index.js";
import { logger } from "../../../logger/index.js";

export interface AssembledContext {
  prompt: string;
  chunkCount: number;
  filePaths: string[];
}

const MAX_CONTEXT_CHARS = 12_000;

/**
 * Build an LLM-ready context string from the code chunks most relevant
 * to the given query.
 */
export async function assembleContext(
  projectId: string,
  query: string
): Promise<AssembledContext> {
  const queryEmbedding = await embed(query);
  const chunks = await vectorSearchChunks(projectId, queryEmbedding, 30);

  if (chunks.length === 0) {
    logger.warn("Context assembly: no chunks found", { projectId, query });
    return { prompt: "(No codebase context available.)", chunkCount: 0, filePaths: [] };
  }

  const parts: string[] = [];
  const filePaths = new Set<string>();
  let totalChars = 0;

  for (const chunk of chunks) {
    if (totalChars + chunk.content.length > MAX_CONTEXT_CHARS) break;
    parts.push(`--- ${chunk.filePath} ---\n${chunk.content}`);
    filePaths.add(chunk.filePath);
    totalChars += chunk.content.length;
  }

  return {
    prompt: parts.join("\n\n"),
    chunkCount: parts.length,
    filePaths: [...filePaths],
  };
}
