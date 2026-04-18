/**
 * OAuth Deduplication & Code Tracking
 * 
 * Prevents duplicate code exchanges by:
 * 1. Tracking used OAuth codes (with SHA256 hashing for security)
 * 2. Deduplicating callback requests by state
 * 3. Providing idempotent processing with request tracking
 * 4. Handling race conditions with atomic database operations
 */

import crypto from "crypto";
import { getSupabase } from "../db/client.js";
import { logger } from "../logger/index.js";

const OAUTH_CODE_TABLE = "oauth_code_log";
const OAUTH_CALLBACK_TABLE = "oauth_callback_requests";
const CODE_EXPIRY_MINUTES = 10;
const CALLBACK_EXPIRY_MINUTES = 10;

/**
 * Hash a code or state for secure storage (never store actual values).
 */
function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate an idempotency key for client-provided deduplication.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Check if an OAuth code has already been exchanged.
 * Returns the cached token if it was previously exchanged successfully.
 * 
 * This prevents "bad_verification_code" errors when duplicates arrive.
 */
export async function checkCodeUsage(userId: string, code: string): Promise<{
  alreadyUsed: boolean;
  token?: string;
  error?: string;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const codeHash = hashValue(code);
  
  try {
    const { data } = await supabase
      .from(OAUTH_CODE_TABLE)
      .select("token, error")
      .eq("user_id", userId)
      .eq("code_hash", codeHash)
      .maybeSingle();

    if (!data) {
      return { alreadyUsed: false };
    }

    // Code was already processed
    return {
      alreadyUsed: true,
      token: data.token ?? undefined,
      error: data.error ?? undefined,
    };
  } catch (err) {
    logger.error("OAuth: failed to check code usage", { error: err, userId });
    return null;
  }
}

/**
 * Record a code exchange attempt (success or failure).
 * Uses ON CONFLICT to handle race conditions atomically.
 */
export async function recordCodeExchange(
  userId: string,
  code: string,
  result: { token?: string; error?: string }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const codeHash = hashValue(code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  try {
    const { error } = await supabase
      .from(OAUTH_CODE_TABLE)
      .upsert(
        {
          user_id: userId,
          code_hash: codeHash,
          token: result.token ?? null,
          error: result.error ?? null,
          expires_at: expiresAt,
        },
        { onConflict: "code_hash" }
      );

    if (error) {
      logger.error("OAuth: failed to record code exchange", { error: error.message, userId });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("OAuth: error recording code exchange", { error: err, userId });
    return false;
  }
}

/**
 * Check if a callback request has already been processed.
 * Returns the cached result if this state has been seen before.
 * 
 * Prevents duplicate processing when:
 * - User clicks "back" and retries
 * - Browser sends duplicate requests
 * - Network causes retries
 */
export async function checkCallbackDuplicate(userId: string, state: string): Promise<{
  isDuplicate: boolean;
  token?: string;
  error?: string;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const stateHash = hashValue(state);

  try {
    const { data } = await supabase
      .from(OAUTH_CALLBACK_TABLE)
      .select("result_token, result_error")
      .eq("user_id", userId)
      .eq("state_hash", stateHash)
      .maybeSingle();

    if (!data) {
      return { isDuplicate: false };
    }

    // This state was already processed
    return {
      isDuplicate: true,
      token: data.result_token ?? undefined,
      error: data.result_error ?? undefined,
    };
  } catch (err) {
    logger.error("OAuth: failed to check callback duplicate", { error: err, userId });
    return null;
  }
}

/**
 * Record a callback request and its result.
 * Uses a database transaction-like approach with INSERT ... ON CONFLICT
 * to ensure first handler wins in race conditions.
 */
export async function recordCallbackResult(
  userId: string,
  state: string,
  result: { token?: string; error?: string },
  idempotencyKey?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const stateHash = hashValue(state);
  const expiresAt = new Date(Date.now() + CALLBACK_EXPIRY_MINUTES * 60 * 1000).toISOString();

  try {
    const { error } = await supabase
      .from(OAUTH_CALLBACK_TABLE)
      .upsert(
        {
          user_id: userId,
          state_hash: stateHash,
          idempotency_key: idempotencyKey ?? null,
          result_token: result.token ?? null,
          result_error: result.error ?? null,
          expires_at: expiresAt,
        },
        { onConflict: "user_id,state_hash" }
      );

    if (error) {
      logger.error("OAuth: failed to record callback result", { error: error.message, userId });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("OAuth: error recording callback result", { error: err, userId });
    return false;
  }
}

/**
 * Clean up expired OAuth tracking records (older than expiry time).
 * Run periodically (e.g., in a cron job).
 */
export async function cleanupExpiredOAuthRecords(): Promise<{ deleted: number }> {
  const supabase = getSupabase();
  if (!supabase) return { deleted: 0 };

  const now = new Date().toISOString();

  try {
    const [codeResult, callbackResult] = await Promise.all([
      supabase.from(OAUTH_CODE_TABLE).delete().lt("expires_at", now),
      supabase.from(OAUTH_CALLBACK_TABLE).delete().lt("expires_at", now),
    ]);

    const codeDeleted = codeResult.count ?? 0;
    const callbackDeleted = callbackResult.count ?? 0;
    const totalDeleted = codeDeleted + callbackDeleted;

    logger.info("OAuth: cleanup expired records", { codeDeleted, callbackDeleted, totalDeleted });
    return { deleted: totalDeleted };
  } catch (err) {
    logger.error("OAuth: error cleaning up expired records", { error: err });
    return { deleted: 0 };
  }
}
