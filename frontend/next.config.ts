import path from "path";
import fs from "fs";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load .env from project root and from current dir (so root .env or frontend/.env both work)
const cwd = process.cwd();
const projectRoot = cwd.endsWith("frontend") ? path.resolve(cwd, "..") : cwd;

// Explicitly load root .env into process.env (loadEnvConfig(projectRoot) does not
// populate process.env when Next runs from frontend workspace)
const rootEnvPath = path.join(projectRoot, ".env");
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
} catch (_) {}

loadEnvConfig(projectRoot);
loadEnvConfig(cwd);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
