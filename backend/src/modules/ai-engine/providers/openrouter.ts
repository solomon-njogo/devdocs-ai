/**
 * OpenRouter provider: chat completions via process.env.OPENROUTER_API_KEY.
 * No secrets in prompt text; 429 retry with backoff; errors logged and rethrown.
 */

import { logger } from "../../../logger/index.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODELS = [
  "liquid/lfm-2.5-1.2b-thinking:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "z-ai/glm-4.5-air:free",
  "google/gemma-4-26b-a4b-it:free",
  "arcee-ai/trinity-large-preview:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openrouter/free",
];
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
const REQUEST_TIMEOUT_MS = 120_000; // 2 minutes per request
const MODEL_RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cooldown tracking per process to avoid hammering models that just exhausted 429 retries.
const modelCooldownUntil = new Map<string, number>();

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
  /** Optional system-role message (e.g. CO-STAR context). Sent as a separate system message for better model behaviour. */
  systemPrompt?: string;
}

type HttpError = Error & { status?: number; code?: string };

function getModelCandidates(): string[] {
  const fromList = process.env.OPENROUTER_MODELS
    ?.split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (fromList && fromList.length > 0) {
    return [...new Set(fromList)];
  }

  const singleModel = process.env.OPENROUTER_MODEL?.trim();
  if (singleModel) {
    return [singleModel];
  }

  return DEFAULT_MODELS;
}

function getModelCandidatesForAttempt(): string[] {
  const models = getModelCandidates();
  const now = Date.now();
  const available = models.filter((model) => {
    const cooldownUntil = modelCooldownUntil.get(model) ?? 0;
    return cooldownUntil <= now;
  });

  // If all are cooling down, allow trying all models again rather than hard-failing.
  return available.length > 0 ? available : models;
}

function getModelCooldownMs(): number {
  const raw = process.env.OPENROUTER_MODEL_COOLDOWN_MS;
  if (!raw) return MODEL_RATE_LIMIT_COOLDOWN_MS;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) return MODEL_RATE_LIMIT_COOLDOWN_MS;
  return parsed;
}

function markModelRateLimited(model: string): void {
  modelCooldownUntil.set(model, Date.now() + getModelCooldownMs());
}

function clearModelRateLimit(model: string): void {
  modelCooldownUntil.delete(model);
}

/**
 * Call OpenRouter chat completions with the given prompt. Returns the assistant
 * message content as markdown. Throws if OPENROUTER_API_KEY is missing or on
 * API failure; retries on 429. Aborts after REQUEST_TIMEOUT_MS (120 s).
 */
export async function complete(
  prompt: string,
  options?: CompleteOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const models = getModelCandidatesForAttempt();
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const content = await completeWithModel(prompt, model, apiKey, options);
      clearModelRateLimit(model);
      return content;
    } catch (err) {
      lastError = err;

      if ((err as { code?: string })?.code === RATE_LIMIT_EXHAUSTED) {
        markModelRateLimited(model);
      }

      // Don't continue on configuration/auth issues because fallback won't help.
      if (isAuthConfigurationError(err)) {
        throw err;
      }

      if (i < models.length - 1) {
        logger.warn("OpenRouter model failed, falling back to next model", {
          failedModel: model,
          nextModel: models[i + 1],
          error: err instanceof Error ? err.message : String(err),
        });
        continue;
      }
    }
  }

  throw new Error(
    `OpenRouter failed for all candidate models (${models.join(", ")}). Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

async function completeWithModel(
  prompt: string,
  model: string,
  apiKey: string,
  options?: CompleteOptions
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 4096;

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (options?.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const body = {
    model,
    messages,
    max_tokens: maxTokens,
  };

  const maxRetries = getMaxRetries();
  const totalAttempts = maxRetries + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = getRetryDelayMs(attempt);
          logger.warn("OpenRouter rate limited (429), retrying", {
            model,
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
          model,
          status: res.status,
          statusText: res.statusText,
          body: text.slice(0, 500),
        });
        const err = new Error(
          `OpenRouter request failed for model ${model}: ${res.status} ${res.statusText}`
        ) as HttpError;
        err.status = res.status;
        throw err;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        logger.error("OpenRouter: unexpected response shape", {
          model,
          hasChoices: Array.isArray(data?.choices),
          firstChoice: data?.choices?.[0],
        });
        throw new Error("OpenRouter returned no content");
      }
      return content;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if ((err as { code?: string })?.code === RATE_LIMIT_EXHAUSTED) {
        throw err;
      }
      if (attempt < maxRetries && isRetryable(err)) {
        const delayMs = getRetryDelayMs(attempt);
        logger.warn("OpenRouter request failed, retrying", {
          model,
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
  const status = (err as { status?: number })?.status;
  if (status && [408, 409, 425, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return m.includes("429") || m.includes("rate") || m.includes("timeout") || m.includes("econnreset") || m.includes("abort");
  }
  return false;
}

function isAuthConfigurationError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status && [401, 403].includes(status)) {
    return true;
  }

  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return (
      m.includes("openrouter_api_key") ||
      m.includes("unauthorized") ||
      m.includes("forbidden") ||
      m.includes("401") ||
      m.includes("403")
    );
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
