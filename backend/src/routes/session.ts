/**
 * Session middleware: ensure every request has a session id for project ownership.
 * If the cookie is missing, create a new session id and set a long-lived cookie.
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const COOKIE_NAME = "devdocs_github_session";
const COOKIE_MAX_AGE_ANON = 365 * 24 * 60 * 60 * 1000; // 1 year for anonymous session

export interface RequestWithSession extends Request {
  sessionId: string;
}

/**
 * Ensures req.sessionId is set. If cookie is missing, generates a new id and sets the cookie.
 * Use this before routes that create or list projects.
 */
export function ensureSessionId(req: Request, res: Response, next: NextFunction): void {
  const r = req as RequestWithSession;
  const existing = req.cookies?.[COOKIE_NAME];
  if (existing && typeof existing === "string") {
    r.sessionId = existing;
    next();
    return;
  }
  const newId = crypto.randomUUID();
  r.sessionId = newId;
  res.cookie(COOKIE_NAME, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_ANON,
    path: "/",
  });
  next();
}
