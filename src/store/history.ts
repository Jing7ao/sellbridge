/**
 * 上架历史持久化 — SQLite DB 存储（按 userId 隔离）
 */
import { db } from "../db/index";
import { listingHistory } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { log } from "../logger.js";

export interface HistoryEntry {
  id: string;
  title: string;
  markets: string[];
  platforms: string[];
  results: Array<{
    market: string;
    marketName: string;
    platform?: string;
    platformName?: string;
    translation: { title: string; description?: string; keywords: string[] };
    itemId?: number | string;
    error?: string;
    success: boolean;
  }>;
  timestamp: string;
  translationMode?: string;
}

const MAX_ENTRIES = 100;

export function loadHistory(userId: string): HistoryEntry[] {
  try {
    const rows = db
      .select()
      .from(listingHistory)
      .where(eq(listingHistory.userId, userId))
      .orderBy(desc(listingHistory.createdAt))
      .limit(MAX_ENTRIES)
      .all();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      markets: JSON.parse(row.markets),
      platforms: JSON.parse(row.platforms),
      results: JSON.parse(row.results),
      timestamp: row.createdAt?.toISOString() ?? new Date().toISOString(),
      translationMode: row.translationMode ?? undefined,
    }));
  } catch (err) {
    log.error("Failed to load listing history", { error: String(err) });
    return [];
  }
}

export function addEntry(entry: HistoryEntry, userId: string): HistoryEntry[] {
  try {
    const existing = db
      .select({ id: listingHistory.id })
      .from(listingHistory)
      .where(eq(listingHistory.userId, userId))
      .orderBy(desc(listingHistory.createdAt))
      .all();

    if (existing.length >= MAX_ENTRIES) {
      const toDelete = existing.slice(MAX_ENTRIES - 1);
      for (const row of toDelete) {
        db.delete(listingHistory).where(eq(listingHistory.id, row.id)).run();
      }
    }

    db.insert(listingHistory).values({
      id: entry.id,
      userId,
      title: entry.title,
      markets: JSON.stringify(entry.markets),
      platforms: JSON.stringify(entry.platforms),
      results: JSON.stringify(entry.results),
      translationMode: entry.translationMode ?? null,
    }).run();

    log.info("History entry saved", { id: entry.id, title: entry.title });
  } catch (err) {
    log.error("Failed to save history", { error: String(err) });
  }

  return loadHistory(userId);
}

export function deleteEntry(id: string, userId: string): HistoryEntry[] {
  try {
    db.delete(listingHistory).where(eq(listingHistory.id, id)).run();
  } catch (err) {
    log.error("Failed to delete history entry", { error: String(err) });
  }
  return loadHistory(userId);
}

export function clearHistory(userId: string): void {
  try {
    db.delete(listingHistory).where(eq(listingHistory.userId, userId)).run();
    log.info("History cleared", { userId });
  } catch (err) {
    log.error("Failed to clear history", { error: String(err) });
  }
}
