/**
 * User-journey prompt — CO-STAR framework with Jobs-to-be-Done (JTBD)
 * integration and structured journey-stage mapping.
 */

import { buildSystemContext, type PromptContext, type PromptParts } from "./system-context.js";

export function buildUserJourneysPrompt(input: string, context?: Record<string, unknown>): PromptParts {
  const ctx = context as PromptContext | undefined;
  const system = buildSystemContext(ctx);

  const prdReference = ctx?.prdContent
    ? [
      "",
      "## Reference: PRD (generated earlier for this project)",
      "",
      "Use this PRD for consistency — personas, features, and constraints should align:",
      "",
      ctx.prdContent,
      "",
      "---",
    ].join("\n")
    : "";

  const user = [
    "## Objective",
    "",
    "Generate detailed **User Journey Maps** using the Jobs-to-be-Done (JTBD) framework.",
    "Focus on user motivations and desired outcomes, not just interface clicks.",
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
    "For each key user persona, create a journey that includes:",
    "",
    "### 1. Job Statement (JTBD)",
    '"When [situation], I want to [motivation], so I can [desired outcome]."',
    "",
    "### 2. Journey Stages",
    "Map the following stages for each journey:",
    "",
    "| Stage | Description |",
    "|-------|-------------|",
    "| **Awareness** | How the user discovers the product |",
    "| **Consideration** | What factors influence the decision to try it |",
    "| **Onboarding** | First-time experience and setup |",
    "| **Core Usage** | Primary task flows and feature interactions |",
    "| **Retention** | What keeps the user coming back |",
    "",
    "### 3. Per-Stage Detail",
    "For every stage above, provide:",
    "",
    "| Dimension | Description |",
    "|-----------|-------------|",
    "| **Actions** | What the user does step-by-step |",
    "| **Touchpoints** | UI screens, emails, notifications involved |",
    "| **Thoughts & Emotions** | What the user is feeling (use emoji scale 😫→😐→😊→🤩) |",
    "| **Pain Points** | Frustrations or blockers at this stage |",
    "| **Opportunities** | Product improvements that address the pain points |",
    "",
    "### 4. Edge & Error Paths",
    "For each stage, document what happens when things go wrong:",
    "- Error scenario",
    "- User impact",
    "- Recovery path the product should offer",
    "",
    "### 5. Journey Summary Table",
    "Conclude with a consolidated table:",
    "",
    "| Stage | Key Action | Emotion | Biggest Pain Point | Top Opportunity |",
    "|-------|-----------|---------|-------------------|----------------|",
  ].join("\n");

  return { system, user };
}
