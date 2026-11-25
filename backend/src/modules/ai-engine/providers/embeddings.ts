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
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse Retry-After header. Supports both delta-seconds and HTTP-date forms;
 * returns milliseconds, or null when unparseable.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(MAX_BACKOFF_MS, asSeconds * 1000);
  }
  const asDate = Date.parse(header);
  if (Number.isFinite(asDate)) {
    const delta = asDate - Date.now();
    if (delta > 0) return Math.min(MAX_BACKOFF_MS, delta);
  }
  return null;
}

/**
 * Call the embeddings endpoint with retry on 429 and 5xx responses.
 * Exponential backoff with jitter; honours Retry-After when provided.
 */
async function fetchEmbeddingsWithRetry(cfg: EmbeddingConfig, batch: string[]): Promise<number[][]> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(cfg.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({ input: batch, model: cfg.model }),
      });
    } catch (err) {
      // Network error — backoff and retry
      lastError = err;
      const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt) + Math.random() * 250;
      logger.warn("Embedding network error, retrying", { attempt: attempt + 1, delayMs: Math.round(delay) });
      await sleep(delay);
      continue;
    }

    if (res.ok) {
      const data = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
      };
      const sorted = data.data.sort((a, b) => a.index - b.index);
      return sorted.map((d) => d.embedding);
    }

    const retriable = res.status === 429 || res.status >= 500;
    const body = await res.text();

    if (!retriable || attempt === MAX_RETRIES - 1) {
      logger.error("Embedding API error", { status: res.status, body: body.slice(0, 500), attempt: attempt + 1 });
      throw new Error(`Embedding request failed: ${res.status}`);
    }

    const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
    const backoff = retryAfter ?? Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt);
    const delay = backoff + Math.random() * 250;
    logger.warn("Embedding API retriable error, backing off", {
      status: res.status,
      attempt: attempt + 1,
      delayMs: Math.round(delay),
    });
    await sleep(delay);
  }

  // Should be unreachable — last attempt either returns or throws above.
  throw lastError instanceof Error ? lastError : new Error("Embedding request failed after retries");
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
    const embeddings = await fetchEmbeddingsWithRetry(cfg, batch);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
