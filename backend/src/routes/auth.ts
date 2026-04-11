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

export const authRoutes = Router();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? (process.env.NODE_ENV === "production" ? "https://devdocs-ai-frontend.vercel.app" : "http://localhost:3000");
const STATE_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

function isBadVerificationCodeError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /bad_verification_code/i.test(err.message);
}

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
  const userId = state ? parseState(state) : null;

  try {
    const code = req.query.code as string;
    if (!code) {
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=missing_code`);
      return;
    }
    if (!userId) {
      logger.warn("Auth: GitHub callback missing or invalid state");
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=invalid_state`);
      return;
    }

    const existingToken = await getToken(userId);
    const token = await exchangeCodeForToken(code);

    // Keep the persisted token in sync with the latest OAuth grant.
    if (!existingToken || existingToken !== token) {
      await setToken(userId, token);
    }

    res.redirect(`${FRONTEND_ORIGIN}/onboarding?connected=1`);
  } catch (err) {
    if (isBadVerificationCodeError(err)) {
      // GitHub OAuth codes are single-use; if a duplicate callback arrives after success,
      // treat it as connected when a token already exists for this user.
      if (userId) {
        const existingToken = await getToken(userId);
        if (existingToken) {
          logger.debug("Auth: duplicate GitHub callback code received after successful connect", {
            userId,
          });
          res.redirect(`${FRONTEND_ORIGIN}/onboarding?connected=1`);
          return;
        }
      }
    }
    logger.error("Auth: GitHub callback failed", { error: err });
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
