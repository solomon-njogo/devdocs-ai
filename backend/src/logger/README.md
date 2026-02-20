# Logger Module

Backend logging for DevDocs AI: colorized console output and optional persistent JSON-lines file.

## Scope

- Single export: `logger` with `error`, `warn`, `info`, `debug`.
- No internal dependencies on other backend modules; used by routes, modules, and db.

## Environment

| Variable   | Description                                      | Default (dev) | Default (prod) |
|-----------|---------------------------------------------------|---------------|-----------------|
| `LOG_LEVEL` | `error` \| `warn` \| `info` \| `debug`          | `debug`       | `info`          |
| `LOG_DIR`   | Directory for log file (e.g. `logs`)            | —             | —               |
| `LOG_FILE`  | Full path to log file (overrides LOG_DIR)       | —             | —               |

If neither `LOG_DIR` nor `LOG_FILE` is set, only console output is used.

**Where the log file goes:** `LOG_DIR` is relative to the process working directory. When you run from the **project root** (e.g. `npm run dev`), logs go to `logs/devdocs.log` at the project root. When you run from **backend/** (e.g. `cd backend && npm run dev`), logs go to `backend/logs/devdocs.log`. The directory is created on first write.

## Usage

```ts
import { logger } from "../logger/index.js";

logger.info("Server started", { port: 4000 });
logger.warn("Missing optional config", { key: "FOO" });
logger.error("Request failed", { error: err, repoId });
logger.debug("Cache hit", { key });
```

- **Never log** tokens, API keys, or request headers that may contain auth (see api-security rule).
- In `catch` blocks, always log with `logger.error("...", { error: err, ...context })` before returning a user-friendly response.

## Output

- **Console**: Human-readable, color-coded (red=error, yellow=warn, green=info, blue=debug), with optional context truncated for readability.
- **File**: One JSON object per line for parsing and filtering; errors serialized as `{ message, name, stack }`.

## Performance

- File writes are asynchronous and non-blocking. Large context objects are truncated in console output (not in file).
