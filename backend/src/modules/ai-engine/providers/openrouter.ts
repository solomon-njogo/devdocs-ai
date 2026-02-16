/**
 * OpenRouter provider: chat completions via process.env.OPENROUTER_API_KEY.
 * No secrets in prompt text; 429 retry with backoff; errors logged and rethrown.
 */

import { logger } from "../../../logger/index.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

/** Default 2 retries (3 total attempts). Env OPENROUTER_MAX_RETRIES overrides; clamped to 1–3. */
function getMaxRetries(): number {
  const raw = process.env.OPENROUTER_MAX_RETRIES;
  if (raw === undefined || raw === "") return 2;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 2;
  return Math.min(3, Math.max(1, n));
}

function getRetryDelayMs(attempt: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, MAX_DELAY_MS);
}

/** Error code for rate-limit exhaustion so callers can detect and e.g. return HTTP 429. */
export const RATE_LIMIT_EXHAUSTED = "RATE_LIMIT_EXHAUSTED";

function throwRateLimitExhausted(attempts: number): never {
  const err = new Error(
    `OpenRouter rate limit (429) persisted after ${attempts} attempts`
  ) as Error & { code: string };
  err.code = RATE_LIMIT_EXHAUSTED;
  throw err;
}

export interface CompleteOptions {
  maxTokens?: number;
}

/**
 * Call OpenRouter chat completions with the given prompt. Returns the assistant
 * message content as markdown. Throws if OPENROUTER_API_KEY is missing or on
 * API failure; retries on 429.
 */
export async function complete(
  prompt: string,
  options?: CompleteOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  const maxTokens = options?.maxTokens ?? 4096;

  const body = {
    model,
    messages: [{ role: "user" as const, content: prompt }],
    max_tokens: maxTokens,
  };

  const maxRetries = getMaxRetries();
  const totalAttempts = maxRetries + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = getRetryDelayMs(attempt);
          logger.warn("OpenRouter rate limited (429), retrying", {
            attempt: attempt + 1,
            maxRetries,
            nextRetryDelayMs: delayMs,
          });
          await sleep(delayMs);
          continue;
        }
        throwRateLimitExhausted(totalAttempts);
      }

      if (!res.ok) {
        const text = await res.text();
        logger.error("OpenRouter API error", {
          status: res.status,
          statusText: res.statusText,
          body: text.slice(0, 500),
        });
        throw new Error(`OpenRouter request failed: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        logger.error("OpenRouter: unexpected response shape", {
          hasChoices: Array.isArray(data?.choices),
          firstChoice: data?.choices?.[0],
        });
        throw new Error("OpenRouter returned no content");
      }
      return content;
    } catch (err) {
      lastError = err;
      if ((err as { code?: string })?.code === RATE_LIMIT_EXHAUSTED) {
        throw err;
      }
      if (attempt < maxRetries && isRetryable(err)) {
        const delayMs = getRetryDelayMs(attempt);
        logger.warn("OpenRouter request failed, retrying", {
          attempt: attempt + 1,
          maxRetries,
          nextRetryDelayMs: delayMs,
          error: err instanceof Error ? err.message : String(err),
        });
        await sleep(delayMs);
        continue;
      }
      if (attempt >= maxRetries && isRateLimitError(err)) {
        throwRateLimitExhausted(totalAttempts);
      }
      throw err;
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return m.includes("429") || m.includes("rate") || m.includes("timeout") || m.includes("econnreset");
  }
  return false;
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return m.includes("429") || m.includes("rate");
  }
  return false;
}
