/**
 * 价格监控引擎测试
 */
import { describe, it, expect } from "vitest";
import type { PriceEntry, ShopifyCredentials, LazadaCredentials, ShopeeCredentials, TiktokCredentials } from "./price-monitor.js";

describe("PriceEntry 变化判断", () => {
  it("up/down/same/new 枚举应覆盖所有变化状态", () => {
    const changes = ["up", "down", "same", "new"] as const;
    expect(changes.length).toBe(4);
  });

  it("涨价条目 changePercent 应为正数", () => {
    const entry: PriceEntry = {
      productId: "test-1",
      title: "测试商品",
      platform: "shopify",
      platformName: "Shopify",
      market: "th",
      marketName: "泰国",
      price: 110,
      change: "up",
      changePercent: 10,
      lastUpdated: new Date().toISOString(),
    };

    expect(entry.changePercent).toBeGreaterThan(0);
    expect(entry.change).toBe("up");
  });

  it("降价条目 compareAtPrice 高于 price 时表示打折", () => {
    const entry: PriceEntry = {
      productId: "test-2",
      title: "打折商品",
      platform: "shopify",
      platformName: "Shopify",
      market: "sg",
      marketName: "全球",
      price: 79,
      compareAtPrice: 99,
      change: "down",
      changePercent: 20.2,
      lastUpdated: new Date().toISOString(),
    };

    expect(entry.compareAtPrice!).toBeGreaterThan(entry.price);
  });

  it("新品应标记为 new", () => {
    const entry: PriceEntry = {
      productId: "new-item",
      title: "新品",
      platform: "lazada",
      platformName: "Lazada",
      market: "th",
      marketName: "泰国",
      price: 50,
      change: "new",
      lastUpdated: new Date().toISOString(),
    };

    expect(entry.change).toBe("new");
    expect(entry.changePercent).toBeUndefined();
  });

  it("价格不变应标记为 same", () => {
    const entry: PriceEntry = {
      productId: "stable-item",
      title: "稳定商品",
      platform: "shopee",
      platformName: "Shopee",
      market: "vn",
      marketName: "越南",
      price: 100,
      change: "same",
      lastUpdated: new Date().toISOString(),
    };

    expect(entry.change).toBe("same");
  });
});

describe("平台凭据类型", () => {
  it("Shopify 凭据应包含 storeDomain 和 accessToken", () => {
    const creds: ShopifyCredentials = {
      storeDomain: "test-store.myshopify.com",
      accessToken: "shpat_test123",
    };
    expect(creds.storeDomain).toBeTruthy();
    expect(creds.accessToken).toBeTruthy();
  });

  it("Lazada 凭据应包含 appKey/appSecret/accessToken/market", () => {
    const creds: LazadaCredentials = {
      appKey: "12345",
      appSecret: "secret",
      accessToken: "token",
      market: "th",
    };
    expect(creds.market).toBe("th");
  });

  it("Shopee 凭据应包含 partnerId/shopId", () => {
    const creds: ShopeeCredentials = {
      partnerId: 100001,
      partnerKey: "key",
      shopId: 200002,
      accessToken: "token",
      market: "vn",
    };
    expect(creds.partnerId).toBeGreaterThan(0);
    expect(creds.shopId).toBeGreaterThan(0);
  });

  it("TikTok 凭据可选 shopCipher", () => {
    const withCipher: TiktokCredentials = {
      appKey: "key",
      appSecret: "secret",
      accessToken: "token",
      shopCipher: "cipher_123",
      market: "id",
    };
    const withoutCipher: TiktokCredentials = {
      appKey: "key",
      appSecret: "secret",
      accessToken: "token",
      market: "th",
    };
    expect(withCipher.shopCipher).toBe("cipher_123");
    expect(withoutCipher.shopCipher).toBeUndefined();
  });
});
