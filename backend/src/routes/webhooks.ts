/**
 * GitHub webhook route: verify signature and trigger doc sync on push.
 */

import { Router, Request, Response } from "express";
import type { GitHubWebhookPayload } from "../shared/types/github.js";
import { verifyWebhookSignature } from "../modules/github/index.js";
import { reviewAndPushDocs } from "../modules/doc-generator/index.js";
import { getRepoToken, upsertRepoMeta } from "../db/index.js";

export const webhookRoutes = Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

webhookRoutes.post("/webhooks/github", async (req: Request, res: Response) => {
  const rawBody =
    (req as Request & { rawBody?: Buffer }).rawBody?.toString("utf8") ??
    (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!verifyWebhookSignature(rawBody, signature ?? "", WEBHOOK_SECRET)) {
    res.status(401).json({ code: "INVALID_SIGNATURE", message: "Webhook signature verification failed." });
    return;
  }
  let payload: GitHubWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GitHubWebhookPayload;
  } catch {
    res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid JSON." });
    return;
  }
  if (payload.repository?.id == null) {
    res.status(400).json({ code: "INVALID_PAYLOAD", message: "Missing repository info." });
    return;
  }
  const ref = payload.ref ?? "";
  if (!ref.startsWith("refs/heads/")) {
    res.status(200).json({ ok: true, message: "Not a branch push; ignored." });
    return;
  }
  const defaultBranch = payload.repository?.default_branch ?? "main";
  const isDefaultBranch = ref === `refs/heads/${defaultBranch}`;
  if (!isDefaultBranch) {
    res.status(200).json({ ok: true, message: "Ignored non-default branch." });
    return;
  }
  const repoId = payload.repository.full_name;
  const token = await getRepoToken(repoId);
  if (!token) {
    res.status(200).json({ ok: true, message: "No token stored for this repo; sync skipped." });
    return;
  }
  try {
    const result = await reviewAndPushDocs(repoId, token);
    await upsertRepoMeta({
      id: repoId,
      repoId,
      lastDocState: result.paths.join(","),
      updatedAt: new Date().toISOString(),
    });
    res.status(200).json({ ok: true, message: "Docs synced." });
  } catch (err) {
    res.status(500).json({ code: "SYNC_FAILED", message: "Doc sync failed." });
  }
});
