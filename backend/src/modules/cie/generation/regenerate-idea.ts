import {
  getDocsByProjectId,
  insertProjectDoc,
  updateProjectDoc,
  updateCieStatus,
} from "../../../db/index.js";
import { generateDocsFromIdea } from "../../doc-generator/index.js";
import type { Project } from "../../../shared/index.js";
import { logger } from "../../../logger/index.js";

export async function regenerateIdeaDocs(project: Project): Promise<void> {
  const projectId = project.id;

  logger.info("Regenerating docs for new idea project", { projectId });
  await updateCieStatus(projectId, "generating", { docsPlanned: 3 });

  try {
    const res = await generateDocsFromIdea({
      projectName: project.name,
      description: project.description ?? "",
      features: project.features ?? undefined,
      requirements: project.requirements ?? undefined,
    });

    const existingDocs = await getDocsByProjectId(projectId);

    for (const doc of res.docs) {
      const existingItem = existingDocs.find((d) => d.type === doc.type);
      if (existingItem) {
        await updateProjectDoc(existingItem.id, projectId, { content: doc.content });
      } else {
        await insertProjectDoc(projectId, {
          type: doc.type as "prd" | "user_story" | "user_journey",
          path: doc.path,
          content: doc.content,
        });
      }
    }

    logger.info("Docs regenerated for new idea project", { projectId });
  } catch (err) {
    logger.error("Failed to regenerate idea docs", {
      projectId,
      error: err instanceof Error ? err.message : String(err)
    });
    throw err;
  }
}
