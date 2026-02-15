/**
 * Doc Generator — Orchestrates ai-engine + github.
 * Public API for this module. See README.md for scope and dependencies.
 */

import { generatePRD } from "../ai-engine/index.js";
import { createOrUpdateFile, readFile } from "../github/index.js";

export interface GenerateAndPushResult {
  path: string;
  content: string;
}

export async function generateAndPushPRD(
  repoId: string,
  input: string,
  token: string,
  path = "/docs/prd.md"
): Promise<GenerateAndPushResult> {
  const content = await generatePRD(input, { repoId });

  try {
    const existing = await readFile(repoId, path, token);
    // TODO: Smart merge in workflows/merge.ts
  } catch {
    // File may not exist yet
  }

  await createOrUpdateFile(repoId, path, content, token);
  return { path, content };
}
