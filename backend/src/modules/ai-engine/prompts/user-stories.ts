/**
 * User-story prompt — CO-STAR framework with enforced story format,
 * BDD acceptance criteria, SMART validation, and Definition of Done.
 */

import { buildSystemContext, type PromptContext, type PromptParts, xmlEscape, xmlTag } from "./system-context.js";

export function buildUserStoriesPrompt(input: string, context?: Record<string, unknown>): PromptParts {
  const ctx = context as PromptContext | undefined;
  const system = buildSystemContext(ctx);

  const prdReference = ctx?.prdContent
    ? [
      "<reference_prd>",
      xmlTag("instruction", "Use this PRD for consistency. Story scope should map to the features and personas defined here."),
      xmlTag("code_snippet", xmlEscape(ctx.prdContent)),
      "</reference_prd>",
    ].join("\n")
    : "";

  const responseContract = [
    "Organise stories under Epics.",
    "Every story must include: Story ID, User Story, Priority, Estimate.",
    "Acceptance criteria must use Given/When/Then format.",
    "Include Definition of Done checklist for each story.",
    "Include SMART validation table for each story.",
    "Conclude with backlog summary table: Story ID | Title | Priority | Estimate | Epic.",
  ].join("\n");

  const user = [
    "<user_prompt>",
    xmlTag("instruction", "Generate a comprehensive set of User Stories with mandatory acceptance criteria."),
    "<costar>",
    xmlTag("context", "The payload contains product requirements to convert into implementation-ready user stories."),
    xmlTag("objective", "Produce complete, testable stories validated with SMART criteria."),
    xmlTag("style", "Agile delivery focused, precise, and implementation-oriented."),
    xmlTag("tone", "Practical and unambiguous."),
    xmlTag("audience", "Product managers, engineers, QA, and designers."),
    xmlTag("response_format", xmlEscape(responseContract)),
    "</costar>",
    "<input_payload>",
    xmlTag("user_input", xmlEscape(input)),
    "</input_payload>",
    prdReference,
    "</user_prompt>",
  ].join("\n");

  return { system, user };
}
