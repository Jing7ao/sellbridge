/**
 * 价格监控引擎
 * 跨平台价格查询 + 历史快照 + 涨跌对比
 */
import { ShopifyClient } from "../adapters/shopify/client.js";
import { ShopifyProductService } from "../adapters/shopify/products.js";
import { db } from "../db/index.js";
import { priceSnapshots } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
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

interface ShopifyCredentials {
  storeDomain: string;
  accessToken: string;
}

const HISTORY_FILE = path.join(process.cwd(), "data", "price-history.json");

const PLATFORM_META: Record<string, string> = {
  shopify: "Shopify",
  lazada: "Lazada",
  shopee: "Shopee",
  tiktok: "TikTok Shop",
};

const MARKET_META: Record<string, string> = {
  th: "泰国", vn: "越南", id: "印尼",
  my: "马来西亚", ph: "菲律宾", sg: "新加坡",
};

// ── Shopify 价格查询 ──

async function fetchShopifyPrices(connections?: ShopifyCredentials[]): Promise<PriceEntry[]> {
  const clients: { client: ShopifyClient; market: string }[] = [];

  if (connections?.length) {
    for (const c of connections) {
      clients.push({
        client: new ShopifyClient({ storeDomain: c.storeDomain, accessToken: c.accessToken }),
        market: "sg",
      });
    }
  } else {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    if (domain && token) {
      clients.push({
        client: new ShopifyClient({ storeDomain: domain, accessToken: token }),
        market: "sg",
      });
    }
  }

  const allEntries: PriceEntry[] = [];
  for (const { client, market } of clients) {
    const service = new ShopifyProductService(client);
    try {
      const products = await service.listProducts(50);
      allEntries.push(...products.flatMap((p) =>
        p.variants.map((v) => ({
          productId: p.id,
          title: p.title,
          platform: "shopify",
          platformName: "Shopify",
          market,
          marketName: "全球",
          price: parseFloat(v.price) || 0,
          compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : undefined,
          change: "same" as const,
          lastUpdated: new Date().toISOString(),
        }))
      ));
    } catch { /* skip unreachable stores */ }
  }

  return allEntries;
}

// ── 模拟价格 ──

function fetchMockPrices(): PriceEntry[] {
  const mockProducts = [
    // 耳机/音频
    { id: 1001, title: "无线蓝牙耳机 TWS-500 ANC", basePrice: 99 },
    { id: 1011, title: "便携蓝牙音箱 低音炮", basePrice: 79 },
    // 充电/电源
    { id: 1002, title: "USB-C 快充头 GaN 65W", basePrice: 45 },
    { id: 1012, title: "磁吸无线充电宝 10000mAh", basePrice: 69 },
    // 手机配件
    { id: 1003, title: "手机支架 铝合金 可折叠", basePrice: 15 },
    { id: 1013, title: "钢化膜 iPhone 防窥屏", basePrice: 8 },
    // 电脑/办公
    { id: 1004, title: "机械键盘 87键 红轴 RGB", basePrice: 159 },
    { id: 1014, title: "无线鼠标 人体工学 静音", basePrice: 49 },
    // 家电/日用
    { id: 1005, title: "迷你手持吸尘器 无线充电", basePrice: 129 },
    { id: 1015, title: "便携果汁机 USB充电", basePrice: 55 },
    // 服饰/配饰
    { id: 1006, title: "运动手表 防水 心率监测", basePrice: 199 },
    { id: 1016, title: "偏光太阳镜 防紫外线", basePrice: 35 },
    // 美妆/个护
    { id: 1007, title: "电动牙刷 声波 IPX7防水", basePrice: 89 },
    { id: 1017, title: "LED化妆镜 三色补光", basePrice: 42 },
    // 母婴/玩具
    { id: 1008, title: "婴儿监控摄像头 夜视 WiFi", basePrice: 179 },
    { id: 1018, title: "积木拼装模型 1000片", basePrice: 25 },
    // 运动/户外
    { id: 1009, title: "折叠露营椅 铝合金 便携", basePrice: 109 },
    { id: 1019, title: "瑜伽垫 TPE 防滑 6mm", basePrice: 39 },
    // 食品/饮料
    { id: 1020, title: "越南咖啡粉 速溶黑咖啡 500g", basePrice: 28 },
    { id: 1021, title: "泰国芒果干 无添加 300g", basePrice: 18 },
    // 汽车/摩托
    { id: 1022, title: "车载手机支架 吸盘式", basePrice: 22 },
    { id: 1023, title: "汽车遮阳挡 前挡折叠", basePrice: 16 },
  ];

  const entries: PriceEntry[] = [];
  const platforms = ["lazada", "shopee", "tiktok"];
  const markets = ["th", "vn", "id", "my", "ph", "sg"];

  for (const product of mockProducts) {
    for (const platform of platforms) {
      for (const market of markets.slice(0, 3)) {
        const jitter = (Math.random() - 0.5) * product.basePrice * 0.3;
        const price = Math.round((product.basePrice + jitter) * 100) / 100;
        entries.push({
          productId: `${platform}_${market}_${product.id}`,
          title: product.title,
          platform,
          platformName: PLATFORM_META[platform] || platform,
          market,
          marketName: MARKET_META[market] || market,
          price,
          change: "same",
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  }

  return entries;
}

// ── 价格历史 ──

function loadHistoryLegacy(): PriceSnapshot[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8")) as PriceSnapshot[];
  } catch {
    return [];
  }
}

function loadHistory(userId: string): PriceSnapshot[] {
  try {
    const rows = db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.userId, userId))
      .orderBy(desc(priceSnapshots.createdAt))
      .limit(30)
      .all();

    return rows.map((row) => ({
      timestamp: row.timestamp,
      prices: JSON.parse(row.prices),
    })).reverse();
  } catch {
    return [];
  }
}

function saveSnapshotLegacy(snapshot: PriceSnapshot): void {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const history = loadHistoryLegacy();
  const last = history[history.length - 1];
  if (last && JSON.stringify(last.prices) === JSON.stringify(snapshot.prices)) return;

  history.push(snapshot);
  const trimmed = history.length > 30 ? history.slice(-30) : history;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

function saveSnapshot(userId: string, snapshot: PriceSnapshot): void {
  try {
    const recent = db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.userId, userId))
      .orderBy(desc(priceSnapshots.createdAt))
      .limit(30)
      .all();

    if (recent.length >= 30) {
      const oldest = recent[recent.length - 1];
      db.delete(priceSnapshots).where(eq(priceSnapshots.id, oldest.id)).run();
    }

    // Skip duplicates
    const last = recent[0];
    if (last && last.prices === JSON.stringify(snapshot.prices)) return;

    db.insert(priceSnapshots).values({
      id: crypto.randomUUID(),
      userId,
      timestamp: snapshot.timestamp,
      prices: JSON.stringify(snapshot.prices),
    }).run();
  } catch { /* ignore */ }
}

function compareWithHistory(current: PriceEntry[], userId?: string): PriceEntry[] {
  const history = userId ? loadHistory(userId) : loadHistoryLegacy();
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
  userId?: string;
  shopifyConnections?: ShopifyCredentials[];
}

export async function getAllPrices(options?: GetAllPricesOptions): Promise<MonitorResult> {
  const userId = options?.userId;
  const shopifyPrices = await fetchShopifyPrices(options?.shopifyConnections);
  const mockPrices = fetchMockPrices();
  const allPrices = compareWithHistory([...shopifyPrices, ...mockPrices], userId);

  const priceMap: Record<string, number> = {};
  for (const entry of allPrices) {
    priceMap[`${entry.platform}:${entry.market}:${entry.productId}`] = entry.price;
  }

  const snapshot: PriceSnapshot = { timestamp: new Date().toISOString(), prices: priceMap };

  if (userId) {
    saveSnapshot(userId, snapshot);
  } else {
    saveSnapshotLegacy(snapshot);
  }

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

export function getPriceHistory(productId: string | number, userId?: string): PriceSnapshot[] {
  const history = userId ? loadHistory(userId) : loadHistoryLegacy();
  return history.filter((snap) =>
    Object.keys(snap.prices).some((key) => key.includes(String(productId)))
  );
}
