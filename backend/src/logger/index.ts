/**
 * DevDocs backend logger: colorized console + optional persistent JSON-lines file.
 * Config via LOG_LEVEL, LOG_DIR or LOG_FILE. Never log tokens or secrets.
 */

import type { LogLevel } from "./transports.js";
import { createTransports, type LogEntry } from "./transports.js";

const LEVELS: LogLevel[] = ["error", "warn", "info", "debug"];

function parseLevel(value: string | undefined, isProduction: boolean): LogLevel {
  const raw = (value ?? "").toLowerCase();
  if (LEVELS.includes(raw as LogLevel)) return raw as LogLevel;
  return isProduction ? "info" : "debug";
}

function getConfig(): { level: LogLevel; logDir?: string; logFile?: string } {
  const isProduction = process.env.NODE_ENV === "production";
  const level = parseLevel(process.env.LOG_LEVEL, isProduction);
  const logDir = process.env.LOG_DIR?.trim() || undefined;
  const logFile = process.env.LOG_FILE?.trim() || undefined;
  return { level, logDir, logFile };
}

const config = getConfig();
const write = createTransports(config);

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  write({ level, message, time: new Date().toISOString(), context });
}

export const logger = {
  error(message: string, context?: Record<string, unknown>): void {
    log("error", message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    log("warn", message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    log("info", message, context);
  },
  debug(message: string, context?: Record<string, unknown>): void {
    log("debug", message, context);
  },
};
