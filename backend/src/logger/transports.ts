/**
 * Console (colorized) and file (JSON lines) transports for the logger.
 * File writes are async and non-blocking.
 */

import fs from "fs";
import path from "path";

export type LogLevel = "error" | "warn" | "info" | "debug";

const LEVEL_NUM: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const ANSI = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
};

export interface LogEntry {
  level: LogLevel;
  message: string;
  time: string;
  /** Optional context; error objects are serialized (message, name, stack). */
  context?: Record<string, unknown>;
}

/** Serialize context for JSON, handling Error instances. */
function serializeContext(ctx: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!ctx || Object.keys(ctx).length === 0) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v instanceof Error) {
      out[k] = { message: v.message, name: v.name, stack: v.stack };
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      out[k] = serializeContext(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Format a log entry as a single JSON line for file output. */
export function formatJsonLine(entry: LogEntry): string {
  const payload = {
    ...entry,
    context: serializeContext(entry.context),
  };
  return JSON.stringify(payload) + "\n";
}

/** Format a log entry for console with colors. */
export function formatConsole(entry: LogEntry): string {
  const time = entry.time;
  const levelColors: Record<LogLevel, string> = {
    error: ANSI.red,
    warn: ANSI.yellow,
    info: ANSI.green,
    debug: ANSI.blue,
  };
  const color = levelColors[entry.level];
  const levelStr = `${color}${entry.level.toUpperCase().padEnd(5)}${ANSI.reset}`;
  const msg = `${ANSI.dim}${time}${ANSI.reset} ${levelStr} ${entry.message}`;
  if (entry.context && Object.keys(entry.context).length > 0) {
    const ctxStr = JSON.stringify(serializeContext(entry.context));
    const truncated = ctxStr.length > 500 ? ctxStr.slice(0, 497) + "..." : ctxStr;
    return `${msg} ${ANSI.dim}${truncated}${ANSI.reset}`;
  }
  return msg;
}

/** Write a line to file asynchronously; creates directory if needed. */
function writeToFile(filePath: string, line: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore; will fail on write
    }
  }
  fs.appendFile(filePath, line, (err) => {
    if (err) {
      process.stderr.write(`[logger] Failed to write log file: ${err.message}\n`);
    }
  });
}

export interface TransportConfig {
  level: LogLevel;
  logDir?: string;
  logFile?: string;
}

function isLikelyWritableOnVercel(filePath: string): boolean {
  if (!process.env.VERCEL) return true;
  const normalized = path.resolve(filePath).replace(/\\/g, "/");
  return normalized.startsWith("/tmp/") || normalized === "/tmp";
}

/**
 * Create a transport function that writes to console and optionally to a file.
 * Only writes if entry level is <= config.level.
 */
export function createTransports(config: TransportConfig): (entry: LogEntry) => void {
  const minNum = LEVEL_NUM[config.level];
  const configuredFilePath =
    config.logFile ?? (config.logDir ? path.join(config.logDir, "devdocs.log") : undefined);
  const filePath =
    configuredFilePath && isLikelyWritableOnVercel(configuredFilePath)
      ? configuredFilePath
      : undefined;

  if (configuredFilePath && !filePath) {
    process.stderr.write(
      `[logger] Skipping file logging on Vercel for non-writable path: ${configuredFilePath}. Use /tmp or rely on console logs.\n`
    );
  }

  return (entry: LogEntry) => {
    if (LEVEL_NUM[entry.level] > minNum) return;
    const time = new Date().toISOString();
    const fullEntry: LogEntry = { ...entry, time };

    process.stdout.write(formatConsole(fullEntry) + "\n");

    if (filePath) {
      writeToFile(filePath, formatJsonLine(fullEntry));
    }
  };
}

export { LEVEL_NUM };
