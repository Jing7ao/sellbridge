/**
 * 上架历史持久化 — PostgreSQL DB 存储（按 userId 隔离）
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

export async function loadHistory(userId: string): Promise<HistoryEntry[]> {
  try {
    const rows = await db
      .select()
      .from(listingHistory)
      .where(eq(listingHistory.userId, userId))
      .orderBy(desc(listingHistory.createdAt))
      .limit(MAX_ENTRIES);

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

export async function addEntry(entry: HistoryEntry, userId: string): Promise<HistoryEntry[]> {
  try {
    const existing = await db
      .select({ id: listingHistory.id })
      .from(listingHistory)
      .where(eq(listingHistory.userId, userId))
      .orderBy(desc(listingHistory.createdAt));

    if (existing.length >= MAX_ENTRIES) {
      const toDelete = existing.slice(MAX_ENTRIES - 1);
      for (const row of toDelete) {
        await db.delete(listingHistory).where(eq(listingHistory.id, row.id));
      }
    }

    await db.insert(listingHistory).values({
      id: entry.id,
      userId,
      title: entry.title,
      markets: JSON.stringify(entry.markets),
      platforms: JSON.stringify(entry.platforms),
      results: JSON.stringify(entry.results),
      translationMode: entry.translationMode ?? null,
    });

    log.info("History entry saved", { id: entry.id, title: entry.title });
  } catch (err) {
    log.error("Failed to save history", { error: String(err) });
  }

  return loadHistory(userId);
}

export async function deleteEntry(id: string, userId: string): Promise<HistoryEntry[]> {
  try {
    await db.delete(listingHistory).where(eq(listingHistory.id, id));
  } catch (err) {
    log.error("Failed to delete history entry", { error: String(err) });
  }
  return loadHistory(userId);
}

export async function clearHistory(userId: string): Promise<void> {
  try {
    await db.delete(listingHistory).where(eq(listingHistory.userId, userId));
    log.info("History cleared", { userId });
  } catch (err) {
    log.error("Failed to clear history", { error: String(err) });
  }
}
