/**
 * Doc Generator — Orchestrates ai-engine + github.
 * Public API for this module. See README.md for scope and dependencies.
 */

import type { NewIdeaRequest, NewIdeaResponse, GeneratedDocItem, ReviewRepoResponse } from "../../shared/index.js";
import { generatePRD, generateUserStories, generateUserJourneys } from "../ai-engine/index.js";
import { createOrUpdateFile, readFile } from "../github/index.js";

export interface GenerateAndPushResult {
  path: string;
  content: string;
}

/** Build a single input string from NewIdeaRequest for AI context. */
function ideaToInput(idea: NewIdeaRequest): string {
  const parts = [
    idea.description,
    idea.features ? `Features: ${idea.features}` : "",
    idea.requirements ? `Requirements: ${idea.requirements}` : "",
    idea.additionalInfo ?? "",
    idea.proposalText ?? "",
  ].filter(Boolean);
  return parts.join("\n\n");
}

/**
 * Generate PRD, user stories, and user journeys from a new idea (no repo).
 */
export async function generateDocsFromIdea(idea: NewIdeaRequest): Promise<NewIdeaResponse> {
  const input = ideaToInput(idea);
  const context = { source: "idea" as const, projectName: idea.projectName };

  const [prd, userStories, userJourneys] = await Promise.all([
    generatePRD(input, context),
    generateUserStories(input, context),
    generateUserJourneys(input, context),
  ]);

  const docs: GeneratedDocItem[] = [
    { type: "prd", path: "/docs/prd.md", content: prd },
    { type: "user-story", path: "/docs/user-stories.md", content: userStories },
    { type: "user-journey", path: "/docs/user-journeys.md", content: userJourneys },
  ];
  return { projectName: idea.projectName, docs };
}

/**
 * Review repo (read key files), generate docs, and push to /docs.
 */
export async function reviewAndPushDocs(repoId: string, token: string): Promise<ReviewRepoResponse> {
  const codebaseSummary = await buildCodebaseSummary(repoId, token);
  const context = { source: "repo" as const, repoId, codebaseSummary, projectName: repoId };

  const [prd, userStories, userJourneys] = await Promise.all([
    generatePRD(codebaseSummary, context),
    generateUserStories(codebaseSummary, context),
    generateUserJourneys(codebaseSummary, context),
  ]);

  const basePath = "docs";
  const paths = [
    `${basePath}/prd.md`,
    `${basePath}/user-stories.md`,
    `${basePath}/user-journeys.md`,
  ];

  await Promise.all([
    createOrUpdateFile(repoId, paths[0], prd, token),
    createOrUpdateFile(repoId, paths[1], userStories, token),
    createOrUpdateFile(repoId, paths[2], userJourneys, token),
  ]);

  return {
    repoId,
    paths,
    summary: `Generated and pushed PRD, user stories, and user journeys to /${basePath}.`,
  };
}

async function buildCodebaseSummary(repoId: string, token: string): Promise<string> {
  const files = ["README.md", "package.json"];
  const parts: string[] = [];
  for (const file of files) {
    try {
      const content = await readFile(repoId, file, token);
      if (content) parts.push(`## ${file}\n\n${content.slice(0, 4000)}`);
    } catch {
      // Skip missing files
    }
  }
  return parts.length ? parts.join("\n\n") : "No README or package.json found.";
}

export async function generateAndPushPRD(
  repoId: string,
  input: string,
  token: string,
  path = "docs/prd.md"
): Promise<GenerateAndPushResult> {
  const content = await generatePRD(input, { repoId });

  try {
    await readFile(repoId, path, token);
    // TODO: Smart merge in workflows/merge.ts
  } catch {
    // File may not exist yet
  }

  await createOrUpdateFile(repoId, path, content, token);
  return { path, content };
}
