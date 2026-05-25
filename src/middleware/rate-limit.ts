/**
 * 简易内存限流器 — 基于滑动窗口
 */
import { log } from "../logger.js";

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

const WINDOW_MS = 60_000; // 1 分钟窗口

export interface RateLimitConfig {
  maxRequests: number; // 窗口内最大请求数
  windowMs?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 30 }
): { allowed: boolean; remaining: number } {
  const windowMs = config.windowMs ?? WINDOW_MS;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // 清理过期时间戳
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    log.warn("rate limit hit", { key, count: entry.timestamps.length });
    return { allowed: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: config.maxRequests - entry.timestamps.length };
}

// 定期清理过期 key，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 120_000);
