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
  avgSimilarity: number;
  weakContext: boolean;
}

const MAX_CONTEXT_CHARS = 12_000;
const DEFAULT_MIN_SIMILARITY = 0.50; // Lowered to allow lexical reranker to work on broader candidates
const DEFAULT_MIN_CHUNKS = 3;
const MAX_CHUNKS_PER_FILE = 3;

function parseNumberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length >= 3);
}

function lexicalScore(content: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const text = content.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (text.includes(term)) hits += 1;
  }
  return hits / terms.length;
}

/**
 * Build an LLM-ready context string from the code chunks most relevant
 * to the given query.
 */
export async function assembleContext(
  projectId: string,
  query: string
): Promise<AssembledContext> {
  const minSimilarity = parseNumberEnv(process.env.CIE_MIN_CHUNK_SIMILARITY, DEFAULT_MIN_SIMILARITY);
  const minChunks = parseNumberEnv(process.env.CIE_MIN_CONTEXT_CHUNKS, DEFAULT_MIN_CHUNKS);
  const queryEmbedding = await embed(query);
  const rawChunks = await vectorSearchChunks(projectId, queryEmbedding, 30, minSimilarity);

  const terms = tokenize(query);
  const reranked = rawChunks
    .map((chunk) => ({
      ...chunk,
      rerankScore: (chunk.similarity * 0.7) + (lexicalScore(chunk.content, terms) * 0.3),
    }))
    .sort((a, b) => b.rerankScore - a.rerankScore);

  const chunks: typeof reranked = [];
  const fileCounts = new Map<string, number>();
  for (const chunk of reranked) {
    const seen = fileCounts.get(chunk.filePath) ?? 0;
    if (seen >= MAX_CHUNKS_PER_FILE) continue;
    fileCounts.set(chunk.filePath, seen + 1);
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    logger.warn("Context assembly: no chunks found", { projectId, query, minSimilarity });
    return {
      prompt: "(Insufficient evidence from indexed codebase. Use TODO markers instead of assumptions.)",
      chunkCount: 0,
      filePaths: [],
      avgSimilarity: 0,
      weakContext: true,
    };
  }

  const parts: string[] = [];
  const filePaths = new Set<string>();
  let totalChars = 0;
  let similarityTotal = 0;

  for (const chunk of chunks) {
    if (totalChars + chunk.content.length > MAX_CONTEXT_CHARS) break;
    parts.push(`--- ${chunk.filePath} ---\n${chunk.content}`);
    filePaths.add(chunk.filePath);
    totalChars += chunk.content.length;
    similarityTotal += chunk.similarity;
  }

  const avgSimilarity = parts.length > 0 ? similarityTotal / parts.length : 0;
  const weakContext = parts.length < minChunks;

  if (weakContext) {
    logger.warn("Context assembly: weak context", {
      projectId,
      query,
      selectedChunks: parts.length,
      minChunks,
      avgSimilarity,
    });
  }

  logger.info("metric.rag_context", {
    projectId,
    selectedChunks: parts.length,
    avgSimilarity,
    minSimilarity,
    weakContext,
  });

  return {
    prompt: parts.join("\n\n"),
    chunkCount: parts.length,
    filePaths: [...filePaths],
    avgSimilarity,
    weakContext,
  };
}
