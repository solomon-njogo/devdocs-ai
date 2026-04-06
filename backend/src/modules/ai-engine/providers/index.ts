/**
 * AI engine providers. Public API: complete() for LLM chat completions; embed/embedBatch for vectors.
 */

export { complete, RATE_LIMIT_EXHAUSTED, type CompleteOptions } from "./openrouter.js";
export { embed, embedBatch } from "./embeddings.js";
