/**
 * Inngest function: index a repository.
 * Triggered by "cie/index-requested" event.
 * On success, sends "cie/indexed" to trigger doc generation.
 */

import { inngest } from "../client.js";
import { indexRepository } from "../../modules/cie/index.js";
import { getRepoToken } from "../../db/index.js";
import { logger } from "../../logger/index.js";

export const indexRepositoryFn = inngest.createFunction(
  {
    id: "index-repository",
    concurrency: { limit: 2 },
    triggers: [{ event: "cie/index-requested" }],
  },
  async ({ event, step }) => {
    const { projectId, repoId, branch } = event.data as {
      projectId: string;
      repoId: string;
      branch?: string;
      token?: string;
    };

    if (repoId && repoId !== "none") {
      const token = (event.data as { token?: string }).token
        ?? await step.run("resolve-token", () => getRepoToken(repoId));

      if (!token) {
        logger.error("Index: no token available", { projectId, repoId });
        return { error: "No GitHub token available for this repository." };
      }

      await step.run("index-repo", () =>
        indexRepository(projectId, repoId, token, branch ?? "main")
      );
    } else {
      logger.info("Index: no repoId provided, skipping indexing phase", { projectId });
    }

    await step.sendEvent("trigger-generate-docs", {
      name: "cie/indexed",
      data: { projectId, repoId },
    });

    return { success: true, skippedIndexing: repoId === "none" };
  }
);
