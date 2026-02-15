/**
 * PRD prompt template. Placeholders: {{input}}, {{source}}, {{projectName}}, {{codebaseSummary}}
 */

export function buildPRDPrompt(input: string, context?: Record<string, unknown>): string {
  const source = (context?.source as string) ?? "idea";
  const projectName = (context?.projectName as string) ?? "Project";
  const codebaseSummary = (context?.codebaseSummary as string) ?? "";
  if (source === "repo" && codebaseSummary) {
    return `Generate a Product Requirements Document for the following codebase.\n\nProject: ${projectName}\n\nCodebase summary:\n${codebaseSummary}\n\nAdditional context:\n${input}\n\nOutput as markdown.`;
  }
  return `Generate a Product Requirements Document for a new idea.\n\nProject: ${projectName}\n\nIdea and requirements:\n${input}\n\nOutput as markdown.`;
}
