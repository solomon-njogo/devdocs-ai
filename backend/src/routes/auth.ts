/**
 * Auth route handlers: GitHub OAuth initiate and callback.
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { getAuthorizationUrl, exchangeCodeForToken } from "../modules/github/index.js";
import { getToken, setToken } from "../token-store.js";

export const authRoutes = Router();

const COOKIE_NAME = "devdocs_github_session";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

authRoutes.get("/auth/github", (_req: Request, res: Response) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const url = getAuthorizationUrl(state);
    res.redirect(url);
  } catch (err) {
    res.status(500).json({
      code: "OAUTH_ERROR",
      message: "Could not start GitHub sign-in. Please try again.",
    });
  }
});

authRoutes.get("/auth/github/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=missing_code`);
      return;
    }
    const token = await exchangeCodeForToken(code);
    const sessionId = crypto.randomBytes(24).toString("hex");
    setToken(sessionId, token);
    res
      .cookie(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      })
      .redirect(`${FRONTEND_ORIGIN}/onboarding?connected=1`);
  } catch (err) {
    res.redirect(`${FRONTEND_ORIGIN}/onboarding?error=oauth_failed`);
  }
});

/**
 * Returns the GitHub token for the current session (from cookie).
 * Used by other route handlers that need the token.
 */
export function getTokenFromRequest(req: Request): string | null {
  const sessionId = req.cookies?.[COOKIE_NAME];
  if (!sessionId) return null;
  return getToken(sessionId);
}
