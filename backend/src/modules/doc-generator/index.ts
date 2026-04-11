/**
 * Doc Generator — Orchestrates ai-engine + github.
 * Public API for this module. See README.md for scope and dependencies.
 */

import type { NewIdeaRequest, NewIdeaResponse, GeneratedDocItem } from "../../shared/index.js";
import { generatePRD, generateUserStories, generateUserJourneys } from "../ai-engine/index.js";
import { readFile } from "../github/index.js";
import { upsertDocsPage } from "../../db/index.js";
import { logger } from "../../logger/index.js";

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
 * Route adds project and returns full NewIdeaResponse.
 */
export async function generateDocsFromIdea(
  idea: NewIdeaRequest
): Promise<Omit<NewIdeaResponse, "project">> {
  const input = ideaToInput(idea);
  const context = { source: "idea" as const, projectName: idea.projectName };

  // Sequential: PRD first, then feed its output into stories & journeys for coherence
  const prd = await generatePRD(input, context);
  const contextWithPrd = { ...context, prdContent: prd };
  const userStories = await generateUserStories(input, contextWithPrd);
  const userJourneys = await generateUserJourneys(input, contextWithPrd);

  const docs: GeneratedDocItem[] = [
    { type: "prd", path: "/docs/prd.md", content: prd },
    { type: "user-story", path: "/docs/user-stories.md", content: userStories },
    { type: "user-journey", path: "/docs/user-journeys.md", content: userJourneys },
  ];
  logger.info("Generated docs from idea", { projectName: idea.projectName });
  return { projectName: idea.projectName, docs };
}

/** Doc item shape returned by reviewAndPushDocs for persisting to project_docs. */
export type ReviewRepoDocItem = {
  type: "prd" | "user_story" | "user_journey";
  path: string;
  content: string;
};

/** Result from reviewAndPushDocs (route adds project to form ReviewRepoResponse). */
export interface ReviewRepoResult {
  repoId: string;
  paths: string[];
  summary: string;
  docs: ReviewRepoDocItem[];
}

/**
 * Review repo (read key files), generate docs, and push to /docs.
 * Returns generated docs so the route can persist them to project_docs.
 */
export async function reviewAndPushDocs(repoId: string, token: string): Promise<ReviewRepoResult> {
  const codebaseSummary = await buildCodebaseSummary(repoId, token);
  const context = { source: "repo" as const, repoId, codebaseSummary, projectName: repoId };

  // Sequential: PRD first, then feed its output into stories & journeys for coherence
  const prd = await generatePRD(codebaseSummary, context);
  const contextWithPrd = { ...context, prdContent: prd };
  const userStories = await generateUserStories(codebaseSummary, contextWithPrd);
  const userJourneys = await generateUserJourneys(codebaseSummary, contextWithPrd);

  const paths = ["docs/prd.md", "docs/user-stories.md", "docs/user-journeys.md"];

  const docs: ReviewRepoDocItem[] = [
    { type: "prd", path: paths[0], content: prd },
    { type: "user_story", path: paths[1], content: userStories },
    { type: "user_journey", path: paths[2], content: userJourneys },
  ];

  logger.info("Review and push docs completed", { repoId, paths });
  return {
    repoId,
    paths,
    summary: "Generated PRD, user stories, and user journeys.",
    docs,
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
  _token: string,
  path = "docs/prd.md"
): Promise<GenerateAndPushResult> {
  const content = await generatePRD(input, { repoId });
  return { path, content };
}
