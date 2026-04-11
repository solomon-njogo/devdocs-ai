import {
  hasEvidenceMarkers,
  sanitizeInternalDocLinks,
  upsertRelatedSection,
} from "../src/modules/cie/generation/quality-gates.js";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  const base = [
    "## API",
    "Use the auth route [source: backend/src/routes/auth.ts]",
    "Related:",
    "- [Overview](/docs/demo/overview)",
    "- [Missing](/docs/demo/missing-page)",
  ].join("\n");

  const sanitized = sanitizeInternalDocLinks(base, new Set(["overview", "api/auth"]), "demo");
  assert(sanitized.invalidLinksRemoved === 1, "Expected one invalid link removal");
  assert(!sanitized.content.includes("missing-page"), "Expected missing-page link to be removed");
  assert(hasEvidenceMarkers(sanitized.content), "Expected evidence markers to be detected");

  const withRelated = upsertRelatedSection(
    sanitized.content,
    "overview",
    "demo",
    "concept",
    [
      { slug: "overview", title: "Project overview", layer: "concept" },
      { slug: "how-to/auth", title: "How to set up auth", layer: "howto" },
      { slug: "api/auth", title: "POST /auth/login", layer: "reference" },
    ]
  );

  assert(withRelated.includes("## Related"), "Expected Related section to exist");
  assert(withRelated.includes("/docs/demo/how-to/auth"), "Expected related link rewrite");

  console.log("Doc quality verification checks passed");
}

run();
