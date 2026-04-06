/**
 * Shared CO-STAR system context block.
 * Provides consistent Context, Style, Tone, Audience, and Response-format
 * instructions across all product-ideation prompts.
 */

export interface PromptContext {
    source?: "idea" | "repo";
    projectName?: string;
    codebaseSummary?: string;
    techStack?: string;
    /** PRD output from a previous generation step — fed into stories/journeys for coherence. */
    prdContent?: string;
    [key: string]: unknown;
}

/** Return shape from all prompt builders — system and user messages are sent separately. */
export interface PromptParts {
    system: string;
    user: string;
}

/**
 * Build the CO-STAR preamble shared by PRD, user-story, and user-journey prompts.
 * Returned as the `system` message so the model treats it as persistent context.
 */
export function buildSystemContext(context?: PromptContext): string {
    const projectName = context?.projectName ?? "Project";
    const source = context?.source ?? "idea";
    const techStack =
        context?.techStack ??
        "Not specified — infer from codebase context if available";

    const contextBlock =
        source === "repo" && context?.codebaseSummary
            ? `You are analysing an existing codebase for the project "${projectName}".\n\nCodebase summary:\n${context.codebaseSummary}`
            : `You are helping define a new product idea called "${projectName}".`;

    return [
        "## System Instructions (CO-STAR Framework)",
        "",
        `**Context:** ${contextBlock}`,
        "",
        "**Style:** Professional Product Manager with deep technical understanding.",
        "",
        "**Tone:** Analytical yet user-centric. Data-driven decisions balanced with empathy for end-users.",
        "",
        "**Audience:** Engineering and Design teams who will implement and validate the specifications.",
        "",
        `**Tech Stack Constraints:** ${techStack}`,
        "",
        "**Response Format:** Well-structured Markdown with the specific section headers requested below. Use tables where comparative data improves clarity.",
        "",
        "**Language:** Write the entire response in English only. Do not use Spanish, French, or any other language for headings, narrative prose, or tables.",
    ].join("\n");
}
