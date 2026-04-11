/**
 * Diátaxis router: plans which doc jobs to generate for a project.
 * Queries the symbol index and indexed files to determine what docs to produce.
 */

import type { DocJob, DiátaxisLayer } from "../../../shared/index.js";
import { getSupabase } from "../../../db/client.js";
import { logger } from "../../../logger/index.js";

interface ApiRoute {
  slug: string;
  method: string;
  path: string;
  filePath: string;
}

interface MajorModule {
  slug: string;
  name: string;
  files: string[];
}

/** Query symbols for exported functions that look like API route handlers. */
async function getApiRoutes(projectId: string): Promise<ApiRoute[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const seen = new Set<string>();
  const routes: ApiRoute[] = [];
  const httpMethods = ["get", "post", "put", "patch", "delete"];

  // Strategy 1: Next.js App Router — files named route.ts / route.js
  // with exported HTTP method functions (GET, POST, etc.)
  const { data: routeFiles } = await supabase
    .from("indexed_files")
    .select("file_path")
    .eq("project_id", projectId)
    .or("file_path.ilike.%/route.ts,file_path.ilike.%/route.js,file_path.ilike.%/route.tsx");

  if (routeFiles) {
    for (const file of routeFiles as Array<{ file_path: string }>) {
      const { data: exports } = await supabase
        .from("symbols")
        .select("name")
        .eq("project_id", projectId)
        .eq("file_path", file.file_path)
        .eq("is_exported", true);

      const methods = (exports ?? [])
        .map((s: { name: string }) => s.name.toUpperCase())
        .filter((n: string) => httpMethods.includes(n.toLowerCase()));

      if (methods.length === 0) continue;

      const pathSegments = file.file_path
        .replace(/^.*?app\//, "")
        .replace(/\/route\.(ts|js|tsx)$/, "")
        .replace(/\(.*?\)\//g, "");
      const slug = pathSegments.replace(/\//g, "-").toLowerCase().replace(/[[\]]/g, "");
      const apiPath = `/${pathSegments}`;

      for (const method of methods) {
        const key = `${method}:${slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        routes.push({ slug: `${slug}-${method.toLowerCase()}`, method, path: apiPath, filePath: file.file_path });
      }
    }
  }

  // Strategy 2: symbol-based heuristic (Express-style handlers, etc.)
  const { data: symData } = await supabase
    .from("symbols")
    .select("name, file_path, signature")
    .eq("project_id", projectId)
    .eq("is_exported", true)
    .in("kind", ["function", "variable"]);

  if (symData) {
    for (const sym of symData as Array<{ name: string; file_path: string; signature: string | null }>) {
      const name = sym.name.toLowerCase();
      const matchesRoute =
        sym.file_path.includes("route") ||
        sym.file_path.includes("api") ||
        sym.file_path.includes("handler");

      if (!matchesRoute) continue;

      const method = httpMethods.find((m) => name.startsWith(m)) ?? "GET";
      const slug = sym.name
        .replace(/^(get|post|put|patch|delete)/i, "")
        .replace(/Handler$/i, "")
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "")
        .replace(/-+/g, "-");

      if (!slug) continue;
      const key = `${method.toUpperCase()}:${slug}`;
      if (seen.has(key)) continue;
      seen.add(key);

      routes.push({
        slug,
        method: method.toUpperCase(),
        path: `/${slug.replace(/-/g, "/")}`,
        filePath: sym.file_path,
      });
    }
  }

  return routes;
}

interface HowToCandidate {
  slug: string;
  title: string;
  sourceFiles: string[];
  focusQuery: string;
}

const FIXED_HOWTOS: Omit<HowToCandidate, "sourceFiles">[] = [
  { slug: "how-to/set-up-development", title: "How to set up local development", focusQuery: "local development setup install dependencies run dev server" },
  { slug: "how-to/write-tests", title: "How to write and run tests", focusQuery: "testing test runner jest vitest unit test integration test" },
  { slug: "how-to/deploy", title: "How to deploy the application", focusQuery: "deploy deployment production build CI CD" },
];

const HOWTO_PATTERNS: Record<string, { title: string; focusQuery: string; filePatterns: string[] }> = {
  auth: { title: "How to set up authentication", focusQuery: "authentication login sign-in session JWT token", filePatterns: ["auth", "login", "session"] },
  database: { title: "How to work with the database", focusQuery: "database migration schema query ORM prisma drizzle supabase", filePatterns: ["db", "database", "migration", "schema", "prisma", "drizzle"] },
  api: { title: "How to add a new API endpoint", focusQuery: "API route endpoint handler request response middleware", filePatterns: ["api", "route", "handler", "endpoint"] },
  webhooks: { title: "How to handle webhooks", focusQuery: "webhook handler signature verification event processing", filePatterns: ["webhook"] },
};

/** Derive L3 how-to candidates from indexed file patterns. */
async function getHowToCandidates(projectId: string): Promise<HowToCandidate[]> {
  const supabase = getSupabase();
  if (!supabase) return FIXED_HOWTOS.map((h) => ({ ...h, sourceFiles: [] }));

  const { data: files } = await supabase
    .from("indexed_files")
    .select("file_path")
    .eq("project_id", projectId);

  const allPaths = (files ?? []).map((f: { file_path: string }) => f.file_path.toLowerCase());
  const candidates: HowToCandidate[] = FIXED_HOWTOS.map((h) => ({ ...h, sourceFiles: [] }));

  for (const [key, cfg] of Object.entries(HOWTO_PATTERNS)) {
    const matching = allPaths.filter((p) => cfg.filePatterns.some((pat) => p.includes(pat)));
    if (matching.length >= 2) {
      candidates.push({
        slug: `how-to/${key}`,
        title: cfg.title,
        sourceFiles: matching.slice(0, 6),
        focusQuery: cfg.focusQuery,
      });
    }
  }

  return candidates;
}

/** Identify major modules by grouping indexed files by top-level directory. */
async function getMajorModules(projectId: string): Promise<MajorModule[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("indexed_files")
    .select("file_path")
    .eq("project_id", projectId);

  if (!data) return [];

  const dirMap = new Map<string, string[]>();
  for (const row of data as Array<{ file_path: string }>) {
    const parts = row.file_path.split("/");
    if (parts.length < 2) continue;
    const dir = parts.slice(0, 2).join("/");
    if (!dirMap.has(dir)) dirMap.set(dir, []);
    dirMap.get(dir)!.push(row.file_path);
  }

  return [...dirMap.entries()]
    .filter(([, files]) => files.length >= 2)
    .map(([dir, files]) => ({
      slug: dir.replace(/\//g, "-").toLowerCase(),
      name: dir.split("/").pop()!,
      files,
    }));
}

interface AdrCandidate {
  slug: string;
  title: string;
  sourceFiles: string[];
  focusQuery: string;
}

/** Identify architecture decisions based on configuration files. */
async function getAdrCandidates(projectId: string): Promise<AdrCandidate[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: files } = await supabase
    .from("indexed_files")
    .select("file_path")
    .eq("project_id", projectId);

  const allPaths = (files ?? []).map((f: { file_path: string }) => f.file_path.toLowerCase());
  const candidates: AdrCandidate[] = [];

  // Frontend framework ADR (e.g. Next.js, Vite)
  if (allPaths.some(p => p.includes('next.config') || p.includes('vite.config'))) {
    candidates.push({
      slug: "adr/001-frontend-framework",
      title: "ADR: Frontend Framework",
      sourceFiles: ["package.json", "next.config.js", "next.config.ts", "next.config.mjs", "vite.config.ts"].filter(f => allPaths.some(p => p.endsWith(f))),
      focusQuery: "frontend framework architecture setup decision"
    });
  }

  // Database / ORM ADR
  if (allPaths.some(p => p.includes('prisma') || p.includes('drizzle') || p.includes('supabase'))) {
    candidates.push({
      slug: "adr/002-database-strategy",
      title: "ADR: Database and ORM Strategy",
      sourceFiles: allPaths.filter(p => p.includes('schema.prisma') || p.includes('drizzle') || p.includes('supabase')),
      focusQuery: "database ORM schema migration data strategy decision"
    });
  }

  return candidates;
}

/**
 * Plan all doc jobs for a freshly indexed project.
 * Returns one DocJob per document that should be generated.
 */
export async function planDocJobs(projectId: string): Promise<DocJob[]> {
  const jobs: DocJob[] = [];

  // L1 — Project overview (README-style mental model)
  jobs.push({
    projectId,
    layer: "concept",
    slug: "overview",
    title: "Project overview",
    sourceFiles: ["README.md", "package.json"],
    focusQuery: "project overview purpose tech stack what this project does README",
  });

  // L1 — Architecture overview
  jobs.push({
    projectId,
    layer: "concept",
    slug: "architecture",
    title: "Architecture overview",
    sourceFiles: [],
    focusQuery: "system architecture modules dependencies design decisions",
  });

  // L2 — Getting started (quickstart)
  jobs.push({
    projectId,
    layer: "quickstart",
    slug: "getting-started",
    title: "Getting started",
    sourceFiles: ["package.json", "README.md", ".env.example"],
    focusQuery: "setup installation environment variables run development",
  });

  // L3 — How-to guides (fixed + dynamic)
  const howtos = await getHowToCandidates(projectId);
  for (const howto of howtos) {
    jobs.push({
      projectId,
      layer: "howto",
      slug: howto.slug,
      title: howto.title,
      sourceFiles: howto.sourceFiles,
      focusQuery: howto.focusQuery,
    });
  }

  // L4 — API reference pages
  const routes = await getApiRoutes(projectId);
  for (const route of routes) {
    jobs.push({
      projectId,
      layer: "reference",
      slug: `api/${route.slug}`,
      title: `${route.method} ${route.path}`,
      sourceFiles: [route.filePath],
      focusQuery: `${route.method} ${route.path} parameters response types`,
    });
  }

  // L4 — Environment variables reference
  jobs.push({
    projectId,
    layer: "reference",
    slug: "environment",
    title: "Environment variables",
    sourceFiles: [],
    focusQuery: "process.env environment variables configuration",
  });

  // L1 — Module concept guides
  const modules = await getMajorModules(projectId);
  for (const mod of modules) {
    jobs.push({
      projectId,
      layer: "concept",
      slug: `modules/${mod.slug}`,
      title: `${mod.name} module`,
      sourceFiles: mod.files,
      focusQuery: `${mod.name} module what it does how it works`,
    });
  }

  // L1 — Architecture decision records
  const adrs = await getAdrCandidates(projectId);
  for (const adr of adrs) {
    jobs.push({
      projectId,
      layer: "adr",
      slug: adr.slug,
      title: adr.title,
      sourceFiles: adr.sourceFiles,
      focusQuery: adr.focusQuery,
    });
  }

  logger.info("Diátaxis router planned jobs", { projectId, jobCount: jobs.length });
  return jobs;
}
