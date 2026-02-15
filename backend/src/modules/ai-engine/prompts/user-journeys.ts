/**
 * User journeys prompt. Placeholders via input and context.
 */

export function buildUserJourneysPrompt(input: string, context?: Record<string, unknown>): string {
  const source = (context?.source as string) ?? "idea";
  const projectName = (context?.projectName as string) ?? "Project";
  const codebaseSummary = (context?.codebaseSummary as string) ?? "";
  if (source === "repo" && codebaseSummary) {
    return `Generate user journeys (step-by-step flows for key scenarios) for this project based on the codebase.\n\nProject: ${projectName}\n\nCodebase summary:\n${codebaseSummary}\n\nContext:\n${input}\n\nOutput as markdown.`;
  }
  return `Generate user journeys (step-by-step flows for key scenarios) for this project idea.\n\nProject: ${projectName}\n\nIdea and requirements:\n${input}\n\nOutput as markdown.`;
}
