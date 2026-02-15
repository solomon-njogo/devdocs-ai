/**
 * JWT auth middleware: verifies Supabase access token and attaches userId to the request.
 * Protected routes should use this; on failure returns 401 with a user-friendly message.
 */

import { Request, Response, NextFunction } from "express";
import type { RequestWithUser } from "../shared/index.js";
import { getUserIdFromToken } from "../auth/index.js";
import { logger } from "../logger/index.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    logger.warn("Auth: missing or invalid Authorization header");
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Please sign in to continue.",
    });
    return;
  }
  getUserIdFromToken(token)
    .then((userId) => {
      if (!userId) {
        logger.warn("Auth: invalid or expired token");
        res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Your session has expired or is invalid. Please sign in again.",
        });
        return;
      }
      (req as RequestWithUser).userId = userId;
      next();
    })
    .catch((err) => {
      logger.error("Auth: token verification failed", { error: err });
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "We couldn't verify your sign-in. Please try again.",
      });
    });
}