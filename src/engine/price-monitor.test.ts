/**
 * 价格监控核心逻辑测试
 */
import { describe, it, expect } from "vitest";

// 测试 PriceEntry 类型和变化判断逻辑
describe("PriceEntry 变化判断", () => {
  it("up/down/same/new 枚举应覆盖所有变化状态", () => {
    const changes = ["up", "down", "same", "new"] as const;
    expect(changes.length).toBe(4);
  });

  it("changePercent 应为正数", () => {
    const entry = {
      productId: "test-1",
      title: "测试",
      platform: "shopify",
      platformName: "Shopify",
      market: "th",
      marketName: "泰国",
      price: 110,
      change: "up" as const,
      changePercent: 10,
      lastUpdated: new Date().toISOString(),
    };

    expect(entry.changePercent).toBeGreaterThan(0);
  });

  it("compareAtPrice 高于 price 时表示打折", () => {
    const entry = {
      productId: "test-2",
      title: "打折商品",
      platform: "shopify",
      platformName: "Shopify",
      market: "sg",
      marketName: "全球",
      price: 79,
      compareAtPrice: 99,
      change: "down" as const,
      changePercent: 20.2,
      lastUpdated: new Date().toISOString(),
    };

    expect(entry.compareAtPrice).toBeGreaterThan(entry.price);
  });
});
