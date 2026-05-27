/**
 * 跨平台库存管理引擎
 * 复用各平台 listProducts() 获取库存，聚合对比 + 低库存预警
 */
import { ShopifyClient } from "../adapters/shopify/client.js";
import { ShopifyProductService } from "../adapters/shopify/products.js";
import { LazadaClient } from "../adapters/lazada/client.js";
import { LazadaProductService } from "../adapters/lazada/products.js";
import { ShopeeClient } from "../adapters/shopee/client.js";
import { ShopeeProductService } from "../adapters/shopee/products.js";
import { TiktokClient } from "../adapters/tiktok/client.js";
import { TiktokProductService } from "../adapters/tiktok/products.js";

export interface UnifiedInventoryItem {
  productId: string;
  title: string;
  sku: string;
  platform: "shopify" | "lazada" | "shopee" | "tiktok";
  market: string;
  storeName: string;
  stock: number;
  price: number;
  imageUrl?: string;
  lowStock: boolean;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  byPlatform: Record<string, { products: number; stock: number }>;
}

export interface InventoryResult {
  items: UnifiedInventoryItem[];
  stats: InventoryStats;
}

const LOW_STOCK_THRESHOLD = 10;

export async function getAllInventory(connections: {
  shopify?: { storeDomain: string; accessToken: string; storeName?: string }[];
  lazada?: { appKey: string; appSecret: string; accessToken: string; market: string; storeName?: string }[];
  shopee?: { partnerId: number; partnerKey: string; shopId: number; accessToken: string; market: string; storeName?: string }[];
  tiktok?: { appKey: string; appSecret: string; accessToken: string; shopCipher?: string; market: string; storeName?: string }[];
}): Promise<InventoryResult> {
  const fetchers: Promise<UnifiedInventoryItem[]>[] = [];

  // Shopify
  for (const cred of connections.shopify ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new ShopifyClient({ storeDomain: cred.storeDomain, accessToken: cred.accessToken });
          const svc = new ShopifyProductService(client);
          const products = await svc.listProducts(50);
          return products.flatMap((p) =>
            (p.variants ?? []).map((v) => ({
              productId: String(p.id),
              title: p.title,
              sku: v.sku ?? "",
              platform: "shopify" as const,
              market: "global",
              storeName: cred.storeName ?? "Shopify",
              stock: v.inventory_quantity ?? 0,
              price: parseFloat(v.price),
              imageUrl: p.images?.[0]?.src,
              lowStock: (v.inventory_quantity ?? 0) > 0 && (v.inventory_quantity ?? 0) < LOW_STOCK_THRESHOLD,
            }))
          );
        } catch {
          return [];
        }
      })()
    );
  }

  // Lazada
  for (const cred of connections.lazada ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new LazadaClient({ appKey: cred.appKey, appSecret: cred.appSecret, accessToken: cred.accessToken, market: cred.market as any });
          const svc = new LazadaProductService(client);
          const products = await svc.listProducts(0, 50);
          return products.flatMap((p) =>
            p.skus.map((sku) => ({
              productId: String(p.itemId),
              title: p.title,
              sku: sku.sellerSku,
              platform: "lazada" as const,
              market: cred.market,
              storeName: cred.storeName ?? `Lazada ${cred.market.toUpperCase()}`,
              stock: sku.quantity,
              price: sku.price,
              imageUrl: p.imageUrl,
              lowStock: sku.quantity > 0 && sku.quantity < LOW_STOCK_THRESHOLD,
            }))
          );
        } catch {
          return [];
        }
      })()
    );
  }

  // Shopee
  for (const cred of connections.shopee ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new ShopeeClient({ partnerId: cred.partnerId, partnerKey: cred.partnerKey, shopId: cred.shopId, accessToken: cred.accessToken, market: cred.market as any });
          const svc = new ShopeeProductService(client);
          const products = await svc.listProducts(0, 50);
          return products.map((p) => ({
            productId: String(p.itemId),
            title: p.title,
            sku: "",
            platform: "shopee" as const,
            market: cred.market,
            storeName: cred.storeName ?? `Shopee ${cred.market.toUpperCase()}`,
            stock: p.stock,
            price: p.price,
            imageUrl: p.imageUrl,
            lowStock: p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // TikTok Shop
  for (const cred of connections.tiktok ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new TiktokClient({ appKey: cred.appKey, appSecret: cred.appSecret, accessToken: cred.accessToken, shopCipher: cred.shopCipher, market: cred.market as any });
          const svc = new TiktokProductService(client);
          const products = await svc.listProducts(1, 50);
          return products.map((p) => ({
            productId: p.productId,
            title: p.title,
            sku: "",
            platform: "tiktok" as const,
            market: cred.market,
            storeName: cred.storeName ?? `TikTok ${cred.market.toUpperCase()}`,
            stock: p.stock,
            price: p.price,
            imageUrl: p.imageUrl,
            lowStock: p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  const results = await Promise.all(fetchers);
  const items = results.flat().sort((a, b) => a.stock - b.stock);

  const byPlatform: Record<string, { products: number; stock: number }> = {};
  for (const item of items) {
    if (!byPlatform[item.platform]) byPlatform[item.platform] = { products: 0, stock: 0 };
    byPlatform[item.platform].products++;
    byPlatform[item.platform].stock += item.stock;
  }

  return {
    items,
    stats: {
      totalProducts: items.length,
      totalStock: items.reduce((s, i) => s + i.stock, 0),
      lowStockCount: items.filter((i) => i.lowStock).length,
      outOfStockCount: items.filter((i) => i.stock === 0).length,
      byPlatform,
    },
  };
}
