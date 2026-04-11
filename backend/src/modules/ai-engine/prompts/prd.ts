/**
 * PRD prompt template — CO-STAR framework with Success Metrics,
 * Technical Constraints, Edge-Case Mapping, and Phase-based Planning.
 */

import { buildSystemContext, type PromptContext, type PromptParts, xmlEscape, xmlTag } from "./system-context.js";

export function buildPRDPrompt(input: string, context?: Record<string, unknown>): PromptParts {
  const system = buildSystemContext(context as PromptContext | undefined);

  const responseContract = [
    "Structure the PRD with exactly these sections:",
    "1. Executive Summary (2-3 paragraphs)",
    "2. Problem Statement (problem, affected users, status quo)",
    "3. Goals & Success Metrics (SMART + KPI table)",
    "4. User Personas (Name, Role, Demographics, Goals, Pain Points, Tech Proficiency)",
    "5. Functional Requirements (Phase 1 MVP, Phase 2 Enhancement, Phase 3 Scale)",
    "6. Non-Functional Requirements (Performance, Security, Accessibility, Scalability, Compliance)",
    "7. Technical Constraints",
    "8. Edge Cases & Error Handling (table)",
    "9. Dependencies & Risks (table)",
    "10. Timeline & Milestones",
  ].join("\n");

  const user = [
    "<user_prompt>",
    xmlTag("instruction", "Generate a comprehensive, production-ready Product Requirements Document (PRD)."),
    "<costar>",
    xmlTag("context", "The following payload describes a product idea or codebase-aligned requirements."),
    xmlTag("objective", "Produce a complete PRD that is implementation-ready for engineering and design."),
    xmlTag("style", "Structured, concrete, and technically grounded."),
    xmlTag("tone", "Clear, decisive, and user-centered."),
    xmlTag("audience", "Engineering and Design teams."),
    xmlTag("response_format", xmlEscape(responseContract)),
    "</costar>",
    "<input_payload>",
    xmlTag("user_input", xmlEscape(input)),
    "</input_payload>",
    "</user_prompt>",
  ].join("\n");

  return { system, user };
}
