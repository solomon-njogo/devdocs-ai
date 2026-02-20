/**
 * User-story prompt — CO-STAR framework with enforced story format,
 * BDD acceptance criteria, SMART validation, and Definition of Done.
 */

import { buildSystemContext, type PromptContext, type PromptParts } from "./system-context.js";

export function buildUserStoriesPrompt(input: string, context?: Record<string, unknown>): PromptParts {
  const ctx = context as PromptContext | undefined;
  const system = buildSystemContext(ctx);

  const prdReference = ctx?.prdContent
    ? [
      "",
      "## Reference: PRD (generated earlier for this project)",
      "",
      "Use this PRD for consistency — stories should map to the features and personas defined here:",
      "",
      ctx.prdContent,
      "",
      "---",
    ].join("\n")
    : "";

  const user = [
    "## Objective",
    "",
    "Generate a comprehensive set of **User Stories** with mandatory acceptance criteria.",
    "Every story must be validated against SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).",
    "",
    "Use the following input as the basis:",
    "",
    "---",
    input,
    "---",
    prdReference,
    "",
    "## Required Output Structure",
    "",
    "### Story Grouping",
    "Organise stories into **Epics** (high-level feature areas). Under each epic, list individual stories.",
    "",
    "### Story Format (Mandatory)",
    "Every user story MUST follow this exact format:",
    "",
    "```",
    "**Story ID:** [EPIC-XXX]",
    '**User Story:** "As a [Persona], I want [Action], so that [Value]."',
    "**Priority:** [Must Have | Should Have | Could Have | Won't Have (this time)]",
    "**Estimate:** [S | M | L | XL]",
    "```",
    "",
    "### Acceptance Criteria (Mandatory for EVERY story)",
    "Use BDD Given/When/Then format:",
    "",
    "```",
    "**Acceptance Criteria:**",
    "- Given [precondition], When [action], Then [expected result]",
    "- Given [precondition], When [action], Then [expected result]",
    "```",
    "",
    "### Definition of Done",
    "Include a testable checklist for each story:",
    "",
    "```",
    "**Definition of Done:**",
    "- [ ] Feature implemented and code reviewed",
    "- [ ] Unit tests written and passing",
    "- [ ] Acceptance criteria verified",
    "- [ ] Documentation updated",
    "- [ ] No regressions in existing tests",
    "```",
    "",
    "### SMART Validation",
    "At the end of each story, include a brief SMART check:",
    "",
    "| Criterion | How This Story Meets It |",
    "|-----------|------------------------|",
    "| Specific | … |",
    "| Measurable | … |",
    "| Achievable | … |",
    "| Relevant | … |",
    "| Time-bound | … |",
    "",
    "### Summary Table",
    "Conclude with a prioritised backlog overview:",
    "",
    "| Story ID | Title | Priority | Estimate | Epic |",
    "|----------|-------|----------|----------|------|",
  ].join("\n");

  return { system, user };
}
