/**
 * Embedding provider: generates vector embeddings via OpenRouter-compatible endpoint.
 * Falls back to OpenAI embedding API format.
 */

import { logger } from "../../../logger/index.js";

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;

function getModel(): string {
  return process.env.EMBEDDING_MODEL?.trim() || DEFAULT_MODEL;
}

function getApiKey(): string {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("No embedding API key set (OPENAI_API_KEY or OPENROUTER_API_KEY)");
  return key;
}

/** Generate an embedding vector for a single text string. */
export async function embed(text: string): Promise<number[]> {
  const results = await embedBatch([text]);
  return results[0];
}

/** Generate embeddings for a batch of texts. Returns one vector per input, in order. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = getApiKey();
  const model = getModel();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: batch, model }),
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
