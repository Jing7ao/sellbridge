/**
 * 一键上架编排引擎 v3
 * 统一编排: Lazada + Shopee + TikTok Shop + Shopify
 */
import { LazadaClient, MarketCode, LAZADA_MARKETS } from "../adapters/lazada/client.js";
import { LazadaProductService, ProductInput as LazadaProductInput } from "../adapters/lazada/products.js";
import { ShopeeClient, ShopeeMarketCode, SHOPEE_MARKETS } from "../adapters/shopee/client.js";
import { ShopeeProductService, ProductInput as ShopeeProductInput } from "../adapters/shopee/products.js";
import { TiktokClient, TiktokMarketCode, TIKTOK_MARKETS } from "../adapters/tiktok/client.js";
import { TiktokProductService, ProductInput as TiktokProductInput } from "../adapters/tiktok/products.js";
import { ShopifyClient, ShopifyMarketCode, SHOPIFY_MARKETS } from "../adapters/shopify/client.js";
import { ShopifyProductService } from "../adapters/shopify/products.js";
import { translateProduct, TranslationResult } from "./translate.js";

// ── 平台类型 ──

export type Platform = "lazada" | "shopee" | "tiktok" | "shopify";

export const PLATFORM_META: Record<Platform, { name: string; icon: string }> = {
  lazada: { name: "Lazada", icon: "🟠" },
  shopee: { name: "Shopee", icon: "🟡" },
  tiktok: { name: "TikTok Shop", icon: "⚫" },
  shopify: { name: "Shopify", icon: "🟢" },
};

// ── 凭证类型 ──

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

export interface StoreConnection {
  platform: Platform;
  market: string;
  credentials: Record<string, unknown>;
}

// ── 通用输入 ──

export interface ListingInput {
  title: string;
  description?: string;
  keywords?: string[];
  category?: string;
  images: string[];
  skus: {
    sellerSku: string;
    color?: string;
    size?: string;
    quantity: number;
    price: number;
    packageWeight: number;
    packageHeight: number;
    packageLength: number;
    packageWidth: number;
  }[];
  platforms: Platform[];
  markets: MarketCode[];
}

export interface ListingResult {
  market: string;
  marketName: string;
  platform: Platform;
  platformName: string;
  translation: TranslationResult | { title: string; keywords: string[] };
  itemId?: number | string;
  skuList?: { shopSku: string; sellerSku: string; skuId: number | string }[];
  error?: string;
  success: boolean;
}

// ── 平台客户端工厂 ──

function getLazadaClient(market: MarketCode, creds?: { appKey: string; appSecret: string; accessToken: string }): LazadaClient | null {
  const appKey = creds?.appKey ?? process.env[`LAZADA_${market.toUpperCase()}_APP_KEY`];
  const appSecret = creds?.appSecret ?? process.env[`LAZADA_${market.toUpperCase()}_APP_SECRET`];
  const accessToken = creds?.accessToken ?? process.env[`LAZADA_${market.toUpperCase()}_ACCESS_TOKEN`];
  if (!appKey || !appSecret || !accessToken) return null;
  return new LazadaClient({ appKey, appSecret, accessToken, market });
}

function getShopeeClient(market: ShopeeMarketCode, creds?: { partnerId: number; partnerKey: string; shopId: number; accessToken: string }): ShopeeClient | null {
  const partnerId = creds?.partnerId ?? parseInt(process.env[`SHOPEE_${market.toUpperCase()}_PARTNER_ID`] || "0");
  const partnerKey = creds?.partnerKey ?? process.env[`SHOPEE_${market.toUpperCase()}_PARTNER_KEY`];
  const shopId = creds?.shopId ?? parseInt(process.env[`SHOPEE_${market.toUpperCase()}_SHOP_ID`] || "0");
  const accessToken = creds?.accessToken ?? process.env[`SHOPEE_${market.toUpperCase()}_ACCESS_TOKEN`];
  if (!partnerKey || !accessToken || !partnerId || !shopId) return null;
  return new ShopeeClient({ partnerId, partnerKey, shopId, accessToken, market });
}

function getTiktokClient(market: TiktokMarketCode, creds?: { appKey: string; appSecret: string; accessToken: string; shopCipher?: string }): TiktokClient | null {
  const appKey = creds?.appKey ?? process.env[`TIKTOK_${market.toUpperCase()}_APP_KEY`];
  const appSecret = creds?.appSecret ?? process.env[`TIKTOK_${market.toUpperCase()}_APP_SECRET`];
  const accessToken = creds?.accessToken ?? process.env[`TIKTOK_${market.toUpperCase()}_ACCESS_TOKEN`];
  const shopCipher = creds?.shopCipher ?? process.env[`TIKTOK_${market.toUpperCase()}_SHOP_CIPHER`];
  if (!appKey || !appSecret || !accessToken) return null;
  return new TiktokClient({ appKey, appSecret, accessToken, shopCipher, market });
}

function getShopifyClient(creds?: ShopifyCredentials): ShopifyClient | null {
  const storeDomain = creds?.storeDomain ?? process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = creds?.accessToken ?? process.env.SHOPIFY_ACCESS_TOKEN;
  if (!storeDomain || !accessToken) return null;
  return new ShopifyClient({ storeDomain, accessToken });
}

// ── 单平台上架 ──

async function listToLazada(
  market: MarketCode,
  translation: TranslationResult,
  input: ListingInput,
  creds?: LazadaCredentials
): Promise<Partial<ListingResult>> {
  const client = getLazadaClient(market, creds);
  if (!client) {
    return { success: false, error: `缺少 Lazada ${market.toUpperCase()} 站点凭证` };
  }

  const service = new LazadaProductService(client);

  const lazadaImages: string[] = [];
  for (const imgUrl of input.images) {
    try {
      const url = await service.uploadImage(imgUrl);
      lazadaImages.push(url);
    } catch {
      lazadaImages.push(imgUrl);
    }
  }

  const productInput: LazadaProductInput = {
    title: input.title,
    translatedTitle: translation.title,
    description: translation.description,
    categoryId: 0,
    images: lazadaImages,
    skus: input.skus,
  };

  try {
    const categories = await service.suggestCategory(translation.title);
    if (categories.length) productInput.categoryId = categories[0].categoryId;
  } catch { /* fallback */ }

  const result = await service.createProduct(productInput);
  return { itemId: result.itemId, skuList: result.skuList, success: true };
}

async function listToShopee(
  market: ShopeeMarketCode,
  translation: TranslationResult,
  input: ListingInput,
  creds?: ShopeeCredentials
): Promise<Partial<ListingResult>> {
  const client = getShopeeClient(market, creds);
  if (!client) {
    return { success: false, error: `缺少 Shopee ${market.toUpperCase()} 站点凭证` };
  }

  const service = new ShopeeProductService(client);

  const imageIds: string[] = [];
  for (const url of input.images) {
    try {
      const id = await service.uploadImage(url);
      imageIds.push(id);
    } catch { /* skip */ }
  }

  const productInput: ShopeeProductInput = {
    translatedTitle: translation.title,
    description: translation.description ?? input.description ?? "",
    categoryId: 0,
    imageIds,
    skus: input.skus.map((s) => ({
      seller_sku: s.sellerSku,
      color: s.color,
      size: s.size,
      quantity: s.quantity,
      price: s.price,
      package_weight: s.packageWeight,
      package_height: s.packageHeight,
      package_length: s.packageLength,
      package_width: s.packageWidth,
    })),
  };

  try {
    const categories = await service.getCategories();
    const leaves = categories.filter((c) => !c.has_children);
    if (leaves.length) productInput.categoryId = leaves[0].category_id;
  } catch { /* fallback */ }

  try {
    const result = await service.createProduct(productInput);
    return { itemId: result.item_id, success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function listToTiktok(
  market: TiktokMarketCode,
  translation: TranslationResult,
  input: ListingInput,
  creds?: TiktokCredentials
): Promise<Partial<ListingResult>> {
  const client = getTiktokClient(market, creds);
  if (!client) {
    return { success: false, error: `缺少 TikTok ${market.toUpperCase()} 站点凭证` };
  }

  const service = new TiktokProductService(client);

  const productInput: TiktokProductInput = {
    translatedTitle: translation.title,
    description: translation.description ?? input.description ?? "",
    categoryId: "",
    imageUrls: input.images,
    skus: input.skus.map((s) => ({
      seller_sku: s.sellerSku,
      color: s.color,
      size: s.size,
      quantity: s.quantity,
      price: s.price,
      package_weight: s.packageWeight,
      package_height: s.packageHeight,
      package_length: s.packageLength,
      package_width: s.packageWidth,
    })),
  };

  try {
    const categories = await service.getCategories();
    const findLeaf = (cats: typeof categories): string | null => {
      for (const c of cats) {
        if (c.is_leaf) return c.id;
        if (c.children?.length) {
          const found = findLeaf(c.children);
          if (found) return found;
        }
      }
      return null;
    };
    const leafId = findLeaf(categories);
    if (leafId) productInput.categoryId = leafId;
  } catch { /* fallback */ }

  try {
    const result = await service.createProduct(productInput);
    return {
      itemId: result.product_id,
      skuList: result.skus?.map((s) => ({ shopSku: s.seller_sku, sellerSku: s.seller_sku, skuId: s.id })),
      success: true,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function listToShopify(
  translation: TranslationResult,
  input: ListingInput,
  creds?: ShopifyCredentials
): Promise<Partial<ListingResult>> {
  const client = getShopifyClient(creds);
  if (!client) {
    return { success: false, error: "缺少 Shopify 凭证（请设置 SHOPIFY_STORE_DOMAIN / SHOPIFY_ACCESS_TOKEN）" };
  }

  const service = new ShopifyProductService(client);

  try {
    const result = await service.createProduct({
      translatedTitle: translation.title,
      descriptionHtml: translation.description ?? input.description ?? "",
      vendor: "SellBridge",
      images: input.images,
      variants: input.skus.map((sku) => ({
        sellerSku: sku.sellerSku,
        color: sku.color,
        size: sku.size,
        price: sku.price,
        quantity: sku.quantity,
        weight: sku.packageWeight,
      })),
    });

    return {
      itemId: result.id,
      skuList: result.variants.map((v) => ({ shopSku: v.sku, sellerSku: v.sku, skuId: String(v.id) })),
      success: true,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── 主语：多平台一键上架 ──

export async function listProduct(
  input: ListingInput,
  storeConnections?: StoreConnection[]
): Promise<ListingResult[]> {
  const results: ListingResult[] = [];
  const markets = input.markets.length ? input.markets : (["th", "vn", "id", "my", "ph", "sg"] as MarketCode[]);

  for (const market of markets) {
    let translation: TranslationResult;
    try {
      translation = await translateProduct({
        title: input.title,
        description: input.description,
        keywords: input.keywords,
        market,
      });
    } catch {
      translation = {
        title: input.title,
        keywords: input.keywords ?? [],
        market,
        language: "源语言",
      };
    }

    const marketName = LAZADA_MARKETS[market]?.name ?? market;

    for (const platform of input.platforms) {
      const platformName = PLATFORM_META[platform]?.name ?? platform;
      const base: ListingResult = {
        market,
        marketName,
        platform,
        platformName,
        translation,
        success: false,
      };

      // 如果有 storeConnections，优先使用数据库中的店铺凭证
      if (storeConnections) {
        const conn = storeConnections.find(
          (c) => c.platform === platform && c.market === market
        );
        if (!conn) {
          results.push({ ...base, error: `未连接 ${platformName} ${market.toUpperCase()} 店铺` });
          continue;
        }

        try {
          let platformResult: Partial<ListingResult>;
          switch (platform) {
            case "lazada":
              platformResult = await listToLazada(market, translation, input, conn.credentials as unknown as LazadaCredentials);
              break;
            case "shopee":
              platformResult = await listToShopee(market as ShopeeMarketCode, translation, input, conn.credentials as unknown as ShopeeCredentials);
              break;
            case "tiktok":
              platformResult = await listToTiktok(market as TiktokMarketCode, translation, input, conn.credentials as unknown as TiktokCredentials);
              break;
            case "shopify":
              platformResult = await listToShopify(translation, input, conn.credentials as unknown as ShopifyCredentials);
              break;
            default:
              platformResult = { success: false, error: `不支持的平台: ${platform}` };
          }
          results.push({ ...base, ...platformResult });
        } catch (err) {
          results.push({ ...base, success: false, error: err instanceof Error ? err.message : String(err) });
        }
        continue;
      }

      // 无 storeConnections 时走 env vars fallback
      try {
        let platformResult: Partial<ListingResult>;

        switch (platform) {
          case "lazada":
            platformResult = await listToLazada(market, translation, input);
            break;
          case "shopee":
            platformResult = await listToShopee(market as ShopeeMarketCode, translation, input);
            break;
          case "tiktok":
            platformResult = await listToTiktok(market as TiktokMarketCode, translation, input);
            break;
          case "shopify":
            platformResult = await listToShopify(translation, input);
            break;
          default:
            platformResult = { success: false, error: `不支持的平台: ${platform}` };
        }

        results.push({ ...base, ...platformResult });
      } catch (err) {
        results.push({ ...base, success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return results;
}

/**
 * 上架报告（人类可读）
 */
export function formatListingReport(results: ListingResult[]): string {
  const lines: string[] = [];
  const success = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  lines.push("# 一键上架报告");
  lines.push(`总览: ${success.length}/${results.length} 成功\n`);

  const byPlatform = new Map<string, ListingResult[]>();
  for (const r of results) {
    const key = PLATFORM_META[r.platform]?.name ?? r.platform;
    if (!byPlatform.has(key)) byPlatform.set(key, []);
    byPlatform.get(key)!.push(r);
  }

  for (const [platform, items] of byPlatform) {
    const ok = items.filter((r) => r.success).length;
    lines.push(`## ${platform} (${ok}/${items.length})`);
    for (const r of items) {
      if (r.success) {
        lines.push(`- [OK] ${r.marketName}: ${r.translation.title} — ID: ${r.itemId}`);
      } else {
        lines.push(`- [FAIL] ${r.marketName}: ${r.error}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
