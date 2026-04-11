/**
 * Walks a GitHub repository via REST API, respecting .gitignore-like patterns.
 * Returns a flat list of file entries with metadata.
 */

import { listRepoFiles, type RepoFileEntry } from "../../github/index.js";
import { logger } from "../../../logger/index.js";

const DEFAULT_IGNORE_PATTERNS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  "__pycache__/",
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".env",
  ".env.*",
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.svg",
  "*.ico",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.eot",
  "*.mp4",
  "*.webm",
  "*.pdf",
  "*.zip",
  "*.tar.gz",
];

const MAX_FILE_SIZE = 100_000; // 100 KB — skip very large files

export interface WalkedFile {
  path: string;
  sha: string;
  size: number;
  language: string | null;
}

/** Detect language from file extension. */
function detectLanguage(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    rb: "ruby",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    vue: "vue",
    svelte: "svelte",
    md: "markdown",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    css: "css",
    scss: "scss",
    html: "html",
  };
  return ext ? map[ext] ?? null : null;
}

function shouldIgnore(path: string): boolean {
  return DEFAULT_IGNORE_PATTERNS.some((pattern) => {
    if (pattern.endsWith("/")) {
      return path.includes(pattern) || path.startsWith(pattern);
    }
    if (pattern.startsWith("*.")) {
      return path.endsWith(pattern.slice(1));
    }
    return path === pattern || path.endsWith(`/${pattern}`);
  });
}

/** Walk a repo and return all indexable source files. */
export async function walkRepository(
  repoId: string,
  token: string,
  branch = "main"
): Promise<WalkedFile[]> {
  const entries = await listRepoFiles(repoId, token, branch);
  const files: WalkedFile[] = [];

  for (const entry of entries) {
    if (entry.type !== "blob") continue;
    if (shouldIgnore(entry.path)) continue;
    if (entry.size > MAX_FILE_SIZE) continue;
    const language = detectLanguage(entry.path);
    if (!language) continue; // skip non-source files

    files.push({
      path: entry.path,
      sha: entry.sha,
      size: entry.size,
      language,
    });
  }

  logger.info("File walker completed", { repoId, total: entries.length, indexed: files.length });
  return files;
}
