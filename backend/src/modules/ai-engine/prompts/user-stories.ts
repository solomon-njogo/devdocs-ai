/**
 * User stories prompt. Placeholders via input and context.
 */

export function buildUserStoriesPrompt(input: string, context?: Record<string, unknown>): string {
  const source = (context?.source as string) ?? "idea";
  const projectName = (context?.projectName as string) ?? "Project";
  const codebaseSummary = (context?.codebaseSummary as string) ?? "";
  if (source === "repo" && codebaseSummary) {
    return `Generate user stories (As a... I want... So that...) for this project based on the codebase.\n\nProject: ${projectName}\n\nCodebase summary:\n${codebaseSummary}\n\nContext:\n${input}\n\nOutput as markdown list.`;
  }
  return `Generate user stories (As a... I want... So that...) for this project idea.\n\nProject: ${projectName}\n\nIdea and requirements:\n${input}\n\nOutput as markdown list.`;
}
