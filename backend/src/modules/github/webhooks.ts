/**
 * GitHub webhook signature verification (HMAC-SHA256).
 * Header: X-Hub-Signature-256: sha256=<hex>
 */

import crypto from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
}
