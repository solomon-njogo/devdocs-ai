/**
 * Diátaxis layer-specific prompt rules.
 * Appended to every generation prompt to enforce the correct document style.
 */

import type { DiátaxisLayer } from "../../../shared/index.js";

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function xmlTag(tag: string, content: string): string {
  return `<${tag}>\n${content}\n</${tag}>`;
}

/** Prepended to every doc-generation prompt so model output stays English. */
export const OUTPUT_LANGUAGE_ENGLISH_ONLY = `
<instruction>
LANGUAGE (mandatory):
- Write the entire document in English only: headings, body text, lists, tables, troubleshooting, prerequisites, and any link anchor text you author.
- Do not use Spanish, French, or any language other than English for narrative documentation.
- When showing code from the codebase, preserve identifiers and string literals as in the source; add any new comments in English.
</instruction>
`.trim();

export const UNIVERSAL_DOC_STANDARDS = `
<universal_standards>
  <grounding_rules>
    - The 0% Corporate Fluff Rule: Ban words like "leverage," "streamline," "holistic," and "seamless." Replace them with actual function names or logic steps.
    - The "Show Me" Rule: Every conceptual explanation must be followed by a Code Block or a Table matching the source code. If no relevant source is provided, DO NOT invent one.
    - XML Delimitation: Context must be wrapped in XML tags (e.g., <source_code>, <db_schema>).
    - THE "BIG TECH" STANDARD: Output MUST resemble product-level, industry-standard documentation found in top-tier tech companies (e.g., Stripe, AWS, Google). Absolutely zero conversational language, chattiness, greetings, or "shenanigans". The tone must be authoritative, objective, and strictly professional.
    - NO MOCK DATA OR PLACEHOLDERS: Never output generic placeholders, mock tables, or invented dummy names (e.g., "Module A", "Dependency X", "[Link 1]"). Use ONLY actual entity names and concrete details from the provided context. If real data is absent, omit the section.
    - NO META-COMMENTARY: Never include conversational filler, apologies, or meta-notes like "Note: Given the constraints in the prompt...". Produce ONLY the final output requested.
    - NO TODOS OR OFFERS: Do not generate "[TODO: ...]" tags, and do not offer further help (e.g., "Additional guides available upon request.").
  </grounding_rules>
  <visual_standards>
    - Diagrams: Always use Mermaid.js syntax for version-controlled diagrams.
    - Tables: Use tables for configurations, status codes, data dictionaries, and tiers.
  </visual_standards>
</universal_standards>
`.trim();

export const LAYER_RULES: Record<DiátaxisLayer, string> = {
  concept: `
<layer_rules layer="concept">
  <objective>Build the reader's mental model. Explain what and why.</objective>
  <style>Explanation (Diataxis Layer 1 - Concept). Understanding-oriented, Narrative tone.</style>
  <response_format>
    - Write only prose. No numbered steps. No commands to run.
    - No 'click here', 'go to', or 'run this command' instructions.
    - Code samples are illustrative only; show shape, not runnable steps.
    - For architectural topics, use the "Architecture & Data" standard:
      - System Diagram: Use Mermaid.js syntax for flowcharts.
      - Data Dictionary: A table mapping every DB field or State variable to its type and purpose.
      - Dependency Map: List external APIs and why they are necessary.
    - End with a 'Related' section linking to how-to guides and the reference.
    - Target length: 400-900 words.
  </response_format>
</layer_rules>
`,

  quickstart: `
<layer_rules layer="quickstart">
  <objective>Get the reader to a working result in under 15 minutes. 'Let's build a small feature together.'</objective>
  <style>Tutorial/Quickstart (Diataxis Layer 2). Learning-oriented, Instructional tone.</style>
  <response_format>
    - Every step must be numbered. One action per step.
    - Every code block must be complete and runnable as-written.
    - Make every decision for the reader; no 'you can also...' options.
    - No explanations of why things work. If needed, link to the concept guide.
    - Include a 'Before you begin' prerequisites section at the top.
    - End with a 'What's next' section with 3 links.
  </response_format>
</layer_rules>
`,

  howto: `
<layer_rules layer="howto">
  <objective>Help the reader accomplish one specific task.</objective>
  <style>How-To Guide (Diataxis Layer 3). Goal-oriented, Practical tone. MUST BE HIGHLY DETAILED.</style>
  <response_format>
    - NO SHALLOW STEPS: Strictly forbid generic instructions like "insert the function", "update the file", or "test it".
    - CONCRETE EXECUTION: Every explanation step must provide the exact code snippet, explicit file path, or exact CLI command required to execute it.
    - Every guide must follow this exact sequence:
      1. The Goal: One sentence on what is being achieved.
      2. Prerequisites: Specific files to open, environment variables to set.
      3. Execution: Step-by-step code blocks, explicit instructions, and precise configurations.
      4. Validation: Exact commands to verify success (e.g., a curl request and expected Status 200).
    - Title MUST start with 'How to'.
    - Exactly one goal per document. Never say 'and while you're here...'.
    - Steps are numbered. Each step is a single concrete action accompanied by code or command blocks.
    - Include a Troubleshooting section with 2-3 specific, code-related failure modes (not generic ones).
    - End with Related guides; links only, no inline explanation.
  </response_format>
</layer_rules>
`,

  reference: `
<layer_rules layer="reference">
  <objective>Provide exhaustive, factual API documentation with complete parameter and response details.</objective>
  <style>API Reference (Diataxis Layer 4). Information-oriented, Descriptive tone.</style>
  <response_format>
    Use this section order (omit sections that do not apply):
    1. Title - "METHOD /path" as an H2
    2. One-sentence description
    3. Authentication
    4. Path parameters table
    5. Query parameters table
    6. Request body JSON example + field table
    7. Response details for each status code + JSON example
    8. Example request with working curl command
    9. Related links
    Rules:
    - No opinions, explanations, or recommendations.
    - Document every parameter with name, type, required/optional, description.
    - Document every response code with body schema.
    - Include realistic curl request and JSON response examples.
    - If unclear from code, omit the detail; never guess and NEVER use [TODO] markers.
    - Do NOT include 'Getting started' or 'Overview'.
  </response_format>
</layer_rules>
`,

  adr: `
<layer_rules layer="adr">
  <objective>Document an architectural decision, its context, and consequences.</objective>
  <style>Architecture Decision Record (ADR). Analytical, clear, and factual.</style>
  <response_format>
    - Every ADR must follow this exact sequence:
      1. Context: What was the problem?
      2. Decision: What did we do?
      3. Consequences: What are the pros and cons of this choice?
    - Output must be purely an ADR format without generic introductions.
  </response_format>
</layer_rules>
`
};
