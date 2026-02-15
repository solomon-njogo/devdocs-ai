/**
 * Auth-related types. RequestWithUser is attached by JWT middleware after verifying Supabase JWT.
 */

import type { Request } from "express";

/** Request with authenticated user id (set by auth middleware after JWT verification). */
export interface RequestWithUser extends Request {
  userId: string;
}