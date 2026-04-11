/**
 * User-journey prompt — CO-STAR framework with Jobs-to-be-Done (JTBD)
 * integration and structured journey-stage mapping.
 */

import { buildSystemContext, type PromptContext, type PromptParts, xmlEscape, xmlTag } from "./system-context.js";

export function buildUserJourneysPrompt(input: string, context?: Record<string, unknown>): PromptParts {
  const ctx = context as PromptContext | undefined;
  const system = buildSystemContext(ctx);

  const prdReference = ctx?.prdContent
    ? [
      "<reference_prd>",
      xmlTag("instruction", "Use this PRD for consistency. Personas, features, and constraints must align."),
      xmlTag("code_snippet", xmlEscape(ctx.prdContent)),
      "</reference_prd>",
    ].join("\n")
    : "";

  const responseContract = [
    "For each key persona include:",
    "1. JTBD statement: When [situation], I want to [motivation], so I can [desired outcome].",
    "2. Journey stages table for Awareness, Consideration, Onboarding, Core Usage, Retention.",
    "3. Per-stage details for Actions, Touchpoints, Thoughts & Emotions, Pain Points, Opportunities.",
    "4. Edge and error paths with scenario, impact, and recovery path.",
    "5. Consolidated summary table: Stage | Key Action | Emotion | Biggest Pain Point | Top Opportunity.",
  ].join("\n");

  const user = [
    "<user_prompt>",
    xmlTag("instruction", "Generate detailed User Journey Maps using the Jobs-to-be-Done framework."),
    "<costar>",
    xmlTag("context", "The payload captures product needs to map user behavior and outcomes."),
    xmlTag("objective", "Produce journey maps that expose motivation, friction, and improvement opportunities."),
    xmlTag("style", "JTBD-oriented and structured for product decision-making."),
    xmlTag("tone", "Empathetic but analytical."),
    xmlTag("audience", "Product, Design, Engineering, and UX research teams."),
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
