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

  const { data } = await supabase
    .from("symbols")
    .select("name, file_path, signature")
    .eq("project_id", projectId)
    .eq("is_exported", true)
    .in("kind", ["function", "variable"]);

  if (!data) return [];

  const routes: ApiRoute[] = [];
  const httpMethods = ["get", "post", "put", "patch", "delete"];

  for (const sym of data as Array<{ name: string; file_path: string; signature: string | null }>) {
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

    if (slug) {
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

/**
 * Plan all doc jobs for a freshly indexed project.
 * Returns one DocJob per document that should be generated.
 */
export async function planDocJobs(projectId: string): Promise<DocJob[]> {
  const jobs: DocJob[] = [];

  // Architecture overview (concept)
  jobs.push({
    projectId,
    layer: "concept",
    slug: "architecture",
    title: "Architecture overview",
    sourceFiles: [],
    focusQuery: "system architecture modules dependencies design decisions",
  });

  // Getting started (quickstart)
  jobs.push({
    projectId,
    layer: "quickstart",
    slug: "getting-started",
    title: "Getting started",
    sourceFiles: ["package.json", "README.md", ".env.example"],
    focusQuery: "setup installation environment variables run development",
  });

  // API reference pages
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

  // Environment variables reference
  jobs.push({
    projectId,
    layer: "reference",
    slug: "environment",
    title: "Environment variables",
    sourceFiles: [],
    focusQuery: "process.env environment variables configuration",
  });

  // Module concept guides
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

  logger.info("Diátaxis router planned jobs", { projectId, jobCount: jobs.length });
  return jobs;
}
