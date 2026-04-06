/**
 * Diátaxis layer-specific prompt rules.
 * Appended to every generation prompt to enforce the correct document style.
 */

import type { DiátaxisLayer } from "../../../shared/index.js";

/** Prepended to every doc-generation prompt so model output stays English. */
export const OUTPUT_LANGUAGE_ENGLISH_ONLY = `
LANGUAGE (mandatory):
- Write the entire document in English only: headings, body text, lists, tables, troubleshooting, prerequisites, and any link anchor text you author.
- Do not use Spanish, French, or any language other than English for narrative documentation.
- When showing code from the codebase, preserve identifiers and string literals as in the source; add any new comments in English.
`.trim();

export const LAYER_RULES: Record<DiátaxisLayer, string> = {
  concept: `
DOCUMENT TYPE: Concept guide (Diátaxis Layer 1).
PURPOSE: Build the reader's mental model. Explain what and why.
RULES:
- Write only prose. No numbered steps. No commands to run.
- No 'click here', 'go to', or 'run this command' instructions.
- Code samples are illustrative only — show shape, not runnable steps.
- End with a 'Related' section linking to how-to guides and the reference.
- Target length: 400–900 words.
`,

  quickstart: `
DOCUMENT TYPE: Quickstart / Tutorial (Diátaxis Layer 2).
PURPOSE: Get the reader to a working result in under 15 minutes.
RULES:
- Every step must be numbered. One action per step.
- Every code block must be complete and runnable as-written.
- Make every decision for the reader — no 'you can also...' options.
- No explanations of why things work. If you must, link to the concept guide.
- Include a 'Before you begin' prerequisites section at the top.
- End with a 'What's next' section with 3 links.
`,

  howto: `
DOCUMENT TYPE: How-to guide (Diátaxis Layer 3).
PURPOSE: Help the reader accomplish one specific task.
RULES:
- Title MUST start with 'How to'.
- Exactly one goal per document. Never say 'and while you're here...'.
- Include a Prerequisites section. Be explicit about starting state.
- Steps are numbered. Each step is a single action.
- Include a Troubleshooting section with the 2-3 most common failure modes.
- End with Related guides — links only, no inline explanation.
`,

  reference: `
DOCUMENT TYPE: API Reference (Diátaxis Layer 4).
PURPOSE: Exhaustive, factual documentation. Every parameter, every response.
FORMAT: Use the following section order (omit sections that don't apply):
  1. Title — "METHOD /path" as an H2
  2. One-sentence description of what the endpoint does
  3. Authentication — what credentials are required and how to pass them
  4. Path parameters — table: Parameter | Type | Required | Description
  5. Query parameters — same table format
  6. Request body — JSON example, then table: Field | Type | Required | Default | Description
  7. Response — for each status code:
     - Status code + meaning as bold header
     - JSON example body
  8. Example request — a working curl command
  9. Related — bullet list of links to related endpoints or guides
RULES:
- No opinions, no explanations, no recommendations.
- Document every parameter with: name, type, required/optional, description.
- Document every response code with its body schema.
- Include a working curl example request with realistic placeholder values.
- Include a realistic example response in JSON.
- If something is unclear from the code, write [TODO: confirm] — never guess.
- Do NOT include a 'Getting started' or 'Overview' section.
`,
};
