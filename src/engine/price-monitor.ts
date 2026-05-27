/**
 * 价格监控引擎
 * 跨平台价格查询 + 历史快照 + 涨跌对比
 *
 * 数据来源：用户已连接的店铺（Shopify / Lazada / Shopee / TikTok Shop）
 * 无连接时返回空列表，不再使用模拟数据。
 */
import { ShopifyClient } from "../adapters/shopify/client.js";
import { ShopifyProductService } from "../adapters/shopify/products.js";
import { LazadaClient, type MarketCode as LazadaMarketCode } from "../adapters/lazada/client.js";
import { LazadaProductService } from "../adapters/lazada/products.js";
import { ShopeeClient, type ShopeeMarketCode } from "../adapters/shopee/client.js";
import { ShopeeProductService } from "../adapters/shopee/products.js";
import { TiktokClient, type TiktokMarketCode } from "../adapters/tiktok/client.js";
import { TiktokProductService } from "../adapters/tiktok/products.js";
import { db } from "../db/index.js";
import { priceSnapshots } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import crypto from "node:crypto";

// ── 类型 ──

export interface PriceEntry {
  productId: number | string;
  title: string;
  platform: string;
  platformName: string;
  market: string;
  marketName: string;
  price: number;
  compareAtPrice?: number;
  change: "up" | "down" | "same" | "new";
  changePercent?: number;
  lastUpdated: string;
}

export interface MonitorResult {
  products: PriceEntry[];
  snapshot: {
    timestamp: string;
    totalProducts: number;
    upCount: number;
    downCount: number;
    sameCount: number;
  };
}

interface PriceSnapshot {
  timestamp: string;
  prices: Record<string, number>;
}

const MARKET_META: Record<string, string> = {
  th: "泰国", vn: "越南", id: "印尼",
  my: "马来西亚", ph: "菲律宾", sg: "新加坡",
};

// ── 凭据类型 ──

export interface ShopifyCredentials {
  storeDomain: string;
  accessToken: string;
}

export interface LazadaCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  market: string;
}

export interface ShopeeCredentials {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  market: string;
}

export interface TiktokCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher?: string;
  market: string;
}

// ── 各平台价格查询 ──

async function fetchShopifyPrices(connections: ShopifyCredentials[]): Promise<PriceEntry[]> {
  const allEntries: PriceEntry[] = [];
  for (const c of connections) {
    const client = new ShopifyClient({ storeDomain: c.storeDomain, accessToken: c.accessToken });
    const service = new ShopifyProductService(client);
    try {
      const products = await service.listProducts(50);
      for (const p of products) {
        for (const v of p.variants) {
          allEntries.push({
            productId: p.id,
            title: p.title,
            platform: "shopify",
            platformName: "Shopify",
            market: "sg",
            marketName: "全球",
            price: parseFloat(v.price) || 0,
            compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : undefined,
            change: "same",
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    } catch { /* skip unreachable stores */ }
  }
  return allEntries;
}

async function fetchLazadaPrices(connections: LazadaCredentials[]): Promise<PriceEntry[]> {
  const allEntries: PriceEntry[] = [];
  for (const c of connections) {
    const client = new LazadaClient({
      appKey: c.appKey,
      appSecret: c.appSecret,
      accessToken: c.accessToken,
      market: c.market as LazadaMarketCode,
    });
    const service = new LazadaProductService(client);
    try {
      const products = await service.listProducts();
      for (const p of products) {
        allEntries.push({
          productId: p.itemId,
          title: p.title,
          platform: "lazada",
          platformName: "Lazada",
          market: c.market,
          marketName: MARKET_META[c.market] ?? c.market,
          price: p.specialPrice ?? p.price,
          compareAtPrice: p.specialPrice && p.specialPrice < p.price ? p.price : undefined,
          change: "same",
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch { /* skip unreachable stores */ }
  }
  return allEntries;
}

async function fetchShopeePrices(connections: ShopeeCredentials[]): Promise<PriceEntry[]> {
  const allEntries: PriceEntry[] = [];
  for (const c of connections) {
    const client = new ShopeeClient({
      partnerId: c.partnerId,
      partnerKey: c.partnerKey,
      shopId: c.shopId,
      accessToken: c.accessToken,
      market: c.market as ShopeeMarketCode,
    });
    const service = new ShopeeProductService(client);
    try {
      const products = await service.listProducts();
      for (const p of products) {
        allEntries.push({
          productId: p.itemId,
          title: p.title,
          platform: "shopee",
          platformName: "Shopee",
          market: c.market,
          marketName: MARKET_META[c.market] ?? c.market,
          price: p.price,
          compareAtPrice: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : undefined,
          change: "same",
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch { /* skip unreachable stores */ }
  }
  return allEntries;
}

async function fetchTiktokPrices(connections: TiktokCredentials[]): Promise<PriceEntry[]> {
  const allEntries: PriceEntry[] = [];
  for (const c of connections) {
    const client = new TiktokClient({
      appKey: c.appKey,
      appSecret: c.appSecret,
      accessToken: c.accessToken,
      shopCipher: c.shopCipher,
      market: c.market as TiktokMarketCode,
    });
    const service = new TiktokProductService(client);
    try {
      const products = await service.listProducts();
      for (const p of products) {
        allEntries.push({
          productId: p.productId,
          title: p.title,
          platform: "tiktok",
          platformName: "TikTok Shop",
          market: c.market,
          marketName: MARKET_META[c.market] ?? c.market,
          price: p.price,
          change: "same",
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch { /* skip unreachable stores */ }
  }
  return allEntries;
}

// ── 价格历史（PostgreSQL） ──

async function loadHistory(userId: string): Promise<PriceSnapshot[]> {
  try {
    const rows = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.userId, userId))
      .orderBy(desc(priceSnapshots.createdAt))
      .limit(30);

    return rows.map((row: { timestamp: string; prices: string }) => ({
      timestamp: row.timestamp,
      prices: JSON.parse(row.prices) as Record<string, number>,
    })).reverse();
  } catch {
    return [];
  }
}

async function saveSnapshot(userId: string, snapshot: PriceSnapshot): Promise<void> {
  try {
    const recent = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.userId, userId))
      .orderBy(desc(priceSnapshots.createdAt))
      .limit(30);

    if (recent.length >= 30) {
      const oldest = recent[recent.length - 1];
      await db.delete(priceSnapshots).where(eq(priceSnapshots.id, oldest.id));
    }

    const last = recent[0];
    if (last && last.prices === JSON.stringify(snapshot.prices)) return;

    await db.insert(priceSnapshots).values({
      id: crypto.randomUUID(),
      userId,
      timestamp: snapshot.timestamp,
      prices: JSON.stringify(snapshot.prices),
    });
  } catch { /* ignore DB errors during save */ }
}

async function compareWithHistory(current: PriceEntry[], userId: string): Promise<PriceEntry[]> {
  const history = await loadHistory(userId);
  if (history.length === 0) {
    return current.map((e) => ({ ...e, change: "new" as const }));
  }

  const lastSnapshot = history[history.length - 1];
  const lastPrices = lastSnapshot.prices;

  return current.map((entry) => {
    const key = `${entry.platform}:${entry.market}:${entry.productId}`;
    const prevPrice = lastPrices[key];

    if (prevPrice === undefined) return { ...entry, change: "new" as const };
    if (entry.price > prevPrice)
      return {
        ...entry,
        change: "up" as const,
        changePercent: Math.round(((entry.price - prevPrice) / prevPrice) * 10000) / 100,
      };
    if (entry.price < prevPrice)
      return {
        ...entry,
        change: "down" as const,
        changePercent: Math.round(((prevPrice - entry.price) / prevPrice) * 10000) / 100,
      };
    return { ...entry, change: "same" as const };
  });
}

// ── 主入口 ──

export interface GetAllPricesOptions {
  userId: string;
  shopify?: ShopifyCredentials[];
  lazada?: LazadaCredentials[];
  shopee?: ShopeeCredentials[];
  tiktok?: TiktokCredentials[];
}

export async function getAllPrices(options: GetAllPricesOptions): Promise<MonitorResult> {
  // 并行查询所有已连接平台的真实价格
  const [shopifyPrices, lazadaPrices, shopeePrices, tiktokPrices] = await Promise.all([
    options.shopify?.length ? fetchShopifyPrices(options.shopify) : Promise.resolve([] as PriceEntry[]),
    options.lazada?.length ? fetchLazadaPrices(options.lazada) : Promise.resolve([] as PriceEntry[]),
    options.shopee?.length ? fetchShopeePrices(options.shopee) : Promise.resolve([] as PriceEntry[]),
    options.tiktok?.length ? fetchTiktokPrices(options.tiktok) : Promise.resolve([] as PriceEntry[]),
  ]);

  const allPrices = await compareWithHistory(
    [...shopifyPrices, ...lazadaPrices, ...shopeePrices, ...tiktokPrices],
    options.userId,
  );

  const priceMap: Record<string, number> = {};
  for (const entry of allPrices) {
    priceMap[`${entry.platform}:${entry.market}:${entry.productId}`] = entry.price;
  }

  const snapshot: PriceSnapshot = { timestamp: new Date().toISOString(), prices: priceMap };
  await saveSnapshot(options.userId, snapshot);

  const upCount = allPrices.filter((e) => e.change === "up").length;
  const downCount = allPrices.filter((e) => e.change === "down").length;
  const sameCount = allPrices.filter((e) => e.change === "same" || e.change === "new").length;

  return {
    products: allPrices,
    snapshot: {
      timestamp: new Date().toISOString(),
      totalProducts: allPrices.length,
      upCount,
      downCount,
      sameCount,
    },
  };
}

export async function getPriceHistory(productId: string | number, userId: string): Promise<PriceSnapshot[]> {
  const history = await loadHistory(userId);
  return history.filter((snap) =>
    Object.keys(snap.prices).some((key) => key.includes(String(productId)))
  );
}
