import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Monorepo root (parent of frontend/) — stable even when cwd differs; fixes Next.js picking
// a lockfile under the user profile (wrong root) and reduces flaky reads on cloud-synced trees.
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load .env from project root and from current dir (so root .env or frontend/.env both work)
const cwd = process.cwd();

// Explicitly load root .env into process.env (loadEnvConfig(projectRoot) does not
// populate process.env when Next runs from frontend workspace)
const rootEnvPath = path.join(monorepoRoot, ".env");
try {
  if (fs.existsSync(rootEnvPath)) {
    const content = fs.readFileSync(rootEnvPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let val = trimmed.slice(eq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
            val = val.slice(1, -1);
          process.env[key] = val;
        }
      }
    }
  }
} catch { /* env file not found or unreadable */ }

loadEnvConfig(monorepoRoot);
loadEnvConfig(cwd);

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  // Next 16 defaults to Turbopack; an empty config acknowledges we may still define webpack() for production/build.
  turbopack: {},
  // If you must use `next dev --webpack` (e.g. OneDrive), polling avoids flaky native watchers on Windows.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
