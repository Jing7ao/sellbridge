/**
 * 结构化日志 — JSON 格式输出，带时间戳和级别
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  data?: Record<string, unknown>;
}

function fmt(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  const entry: LogEntry = { ts: new Date().toISOString(), level, msg, ...(data ? { data } : {}) };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, data?: Record<string, unknown>) => fmt("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) => fmt("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => fmt("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => fmt("error", msg, data),
};
