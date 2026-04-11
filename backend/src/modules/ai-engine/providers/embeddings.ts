/**
 * Embedding provider: generates vector embeddings via OpenAI or OpenRouter.
 * Uses OPENAI_API_KEY with OpenAI endpoint when available;
 * falls back to OPENROUTER_API_KEY with OpenRouter endpoint.
 */

import { logger } from "../../../logger/index.js";

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";
const OPENAI_DEFAULT_MODEL = "text-embedding-3-small";
const OPENROUTER_DEFAULT_MODEL = "openai/text-embedding-3-small";
const BATCH_SIZE = 100;

interface EmbeddingConfig {
  url: string;
  apiKey: string;
  model: string;
}

function getConfig(): EmbeddingConfig {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();

  if (openaiKey) {
    return {
      url: OPENAI_EMBEDDINGS_URL,
      apiKey: openaiKey,
      model: process.env.EMBEDDING_MODEL?.trim() || OPENAI_DEFAULT_MODEL,
    };
  }

  if (openrouterKey) {
    return {
      url: OPENROUTER_EMBEDDINGS_URL,
      apiKey: openrouterKey,
      model: process.env.EMBEDDING_MODEL?.trim() || OPENROUTER_DEFAULT_MODEL,
    };
  }

  throw new Error("No embedding API key set (OPENAI_API_KEY or OPENROUTER_API_KEY)");
}

/** Generate an embedding vector for a single text string. */
export async function embed(text: string): Promise<number[]> {
  const results = await embedBatch([text]);
  return results[0];
}

/** Generate embeddings for a batch of texts. Returns one vector per input, in order. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const cfg = getConfig();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ input: batch, model: cfg.model }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Embedding API error", { status: res.status, body: body.slice(0, 500) });
      throw new Error(`Embedding request failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };
    const sorted = data.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((d) => d.embedding));
  }

  return allEmbeddings;
}
