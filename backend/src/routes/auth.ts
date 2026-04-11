/**
 * Auth route handlers: GitHub OAuth (Connect GitHub for repo access) and session helpers.
 * GitHub URL is obtained via GET /api/auth/github with Bearer token; state carries userId.
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  isGitHubOAuthConfigured,
} from "../modules/github/index.js";
import { getToken, setToken } from "../token-store.js";
import { requireAuth } from "./auth-middleware.js";
import type { RequestWithUser } from "../shared/index.js";
import { logger } from "../logger/index.js";
import {
  checkCodeUsage,
  recordCodeExchange,
  checkCallbackDuplicate,
  recordCallbackResult,
  generateIdempotencyKey,
  cleanupExpiredOAuthRecords,
} from "../auth/oauth-dedup.js";

export const authRoutes = Router();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? (process.env.NODE_ENV === "production" ? "https://devdocs-ai-frontend.vercel.app" : "http://localhost:3000");
const STATE_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

function createState(userId: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${nonce}.${userId}`;
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function parseState(state: string): string | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [nonce, userId, sig] = parts;
  const payload = `${nonce}.${userId}`;
  const expected = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("base64url");
  if (sig !== expected || !userId) return null;
  return userId;
}

/** Returns GitHub OAuth URL with state containing signed userId. Requires JWT. */
authRoutes.get("/auth/github", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).userId;
    if (!userId) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
      return;
    }
    if (!isGitHubOAuthConfigured()) {
      res.status(503).json({
        code: "GITHUB_OAUTH_NOT_CONFIGURED",
        message:
          "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the project .env (see https://github.com/settings/developers). GITHUB_CALLBACK_URL must match your OAuth app callback (e.g. http://localhost:4000/api/auth/github/callback).",
      });
      return;
    }
    const state = createState(userId);
    const url = getAuthorizationUrl(state);
    res.json({ url });
  } catch (err) {
    logger.error("Auth: failed to build GitHub OAuth URL", { error: err });
    res.status(500).json({
      code: "OAUTH_ERROR",
      message: "Could not start GitHub connect. Please try again.",
    });
  }
});

authRoutes.get("/auth/github/callback", async (req: Request, res: Response) => {
  const state = req.query.state as string;
  const code = req.query.code as string;
  const userId = state ? parseState(state) : null;
  const idempotencyKey = generateIdempotencyKey();

  try {
    // Validate code and userId are present
    if (!code) {
      logger.warn("Auth: GitHub callback missing code");
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=missing_code`);
      return;
    }
    if (!userId) {
      logger.warn("Auth: GitHub callback missing or invalid state");
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=invalid_state`);
      return;
    }

    // Check if this exact callback has already been processed (deduplication)
    const duplicate = await checkCallbackDuplicate(userId, state);
    if (duplicate === null) {
      logger.error("Auth: failed to check callback duplicate (DB unavailable)");
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=unavailable`);
      return;
    }

    if (duplicate.isDuplicate) {
      logger.info("Auth: duplicate callback request detected (already processed)", {
        userId,
        idempotencyKey,
      });
      // Return the cached result
      if (duplicate.error) {
        res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed&reason=${encodeURIComponent(duplicate.error)}`);
      } else if (duplicate.token) {
        res.redirect(`${FRONTEND_ORIGIN}/onboarding?connected=1`);
      } else {
        // Should not happen, but fallback to error
        res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed`);
      }
      return;
    }

    // Check if this code has already been used (prevent reuse)
    const codeUsage = await checkCodeUsage(userId, code);
    if (codeUsage === null) {
      logger.error("Auth: failed to check code usage (DB unavailable)");
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=unavailable`);
      return;
    }

    if (codeUsage.alreadyUsed) {
      logger.info("Auth: code already exchanged (duplicate code received)", {
        userId,
        hasToken: !!codeUsage.token,
      });
      
      // Record this callback result for deduplication
      await recordCallbackResult(userId, state, {
        token: codeUsage.token,
        error: codeUsage.error,
      }, idempotencyKey);

      // If the previous exchange succeeded, return success
      if (codeUsage.token) {
        res.redirect(`${FRONTEND_ORIGIN}/onboarding?connected=1`);
        return;
      }
      // If the previous exchange failed, return that error
      if (codeUsage.error) {
        res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed&reason=${encodeURIComponent(codeUsage.error)}`);
        return;
      }
      // Fallback
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed`);
      return;
    }

    // Code hasn't been used yet - exchange it for a token
    let token: string;
    let error: string | undefined;

    try {
      token = await exchangeCodeForToken(code);
      logger.info("Auth: successfully exchanged GitHub code for token", { userId });
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      logger.warn("Auth: failed to exchange GitHub code", { userId, error });

      // Record the failure for future duplicate requests
      await recordCodeExchange(userId, code, { error });
      await recordCallbackResult(userId, state, { error }, idempotencyKey);

      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed&reason=${encodeURIComponent(error)}`);
      return;
    }

    // Token exchange succeeded - persist it and update user's token
    const existingToken = await getToken(userId);
    
    if (!existingToken || existingToken !== token) {
      await setToken(userId, token);
      logger.info("Auth: persisted GitHub token for user", { userId, isNewToken: !existingToken });
    }

    // Record success for deduplication
    await recordCodeExchange(userId, code, { token });
    await recordCallbackResult(userId, state, { token }, idempotencyKey);

    res.redirect(`${FRONTEND_ORIGIN}/onboarding?connected=1`);
  } catch (err) {
    logger.error("Auth: unexpected error in GitHub callback", { error: err, userId });
    res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed`);
  }
});

/** Returns the connection status of various integrations. */
authRoutes.get("/auth/status", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as RequestWithUser).userId;
  if (!userId) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Please sign in to continue." });
    return;
  }

  const githubConnected = !!(await getToken(userId));

  res.json({
    github: { connected: githubConnected },
    gitlab: { connected: false },
    linear: { connected: false },
  });
});

/**
 * Returns the GitHub repo token for the current user (from token store keyed by userId).
 * Used by onboarding and other route handlers that need the repo token.
 */
export async function getTokenFromRequest(req: Request): Promise<string | null> {
  const userId = (req as RequestWithUser).userId;
  if (!userId) return null;
  return getToken(userId);
}

/**
 * Cleanup expired OAuth records (admin endpoint, can be triggered by cron job).
 * In production, this should be called periodically (e.g., daily or on schedule).
 */
authRoutes.post("/auth/oauth-cleanup", async (req: Request, res: Response) => {
  try {
    // Optional: Check for an admin secret or token in Authorization header
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Missing or invalid authorization" });
        return;
      }
      const token = authHeader.substring(7);
      if (token !== adminSecret) {
        res.status(403).json({ code: "FORBIDDEN", message: "Invalid admin secret" });
        return;
      }
    }

    const result = await cleanupExpiredOAuthRecords();
    res.json({
      code: "SUCCESS",
      message: `Cleaned up ${result.deleted} expired OAuth records`,
      deleted: result.deleted,
    });
  } catch (err) {
    logger.error("Auth: oauth cleanup failed", { error: err });
    res.status(500).json({
      code: "ERROR",
      message: "Failed to cleanup OAuth records",
    });
  }
});
