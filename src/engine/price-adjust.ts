import type { PriceEntry } from "./price-monitor";

export interface AdjustSuggestion {
  productId: number | string;
  title: string;
  platform: string;
  platformName: string;
  market: string;
  marketName: string;
  currentPrice: number;
  suggestedPrice: number;
  lowestCompetitorPrice: number;
  competitorPlatform: string;
  competitorMarket: string;
  savingsPercent: number;
}

const MARKET_META: Record<string, string> = {
  th: "泰国", vn: "越南", id: "印尼",
  my: "马来西亚", ph: "菲律宾", sg: "新加坡",
};

/**
 * 基于价格监控数据生成调价建议
 * 规则：同一商品在不同平台，若某平台价格高于最低价 5% 以上，建议调至最低价 + 2%
 */
export function generateAdjustments(products: PriceEntry[]): AdjustSuggestion[] {
  // 按商品标题分组
  const grouped = new Map<string, PriceEntry[]>();
  for (const p of products) {
    const key = p.title;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const suggestions: AdjustSuggestion[] = [];

  for (const [, entries] of grouped) {
    if (entries.length < 2) continue; // 至少两个平台才有对比意义

    const prices = entries.map((e) => e.price);
    const minPrice = Math.min(...prices);

    for (const entry of entries) {
      if (entry.price <= minPrice) continue;

      const diff = (entry.price - minPrice) / minPrice;
      if (diff < 0.05) continue; // 差距不到 5%，不调整

      // 找到最低价对应的平台
      const cheapest = entries.find((e) => e.price === minPrice) ?? entries[0];

      // 建议价 = 最低价 × 1.02（留 2% 利润空间）
      const suggested = Math.round(minPrice * 1.02 * 100) / 100;

      suggestions.push({
        productId: entry.productId,
        title: entry.title,
        platform: entry.platform,
        platformName: entry.platformName,
        market: entry.market,
        marketName: MARKET_META[entry.market] ?? entry.market,
        currentPrice: entry.price,
        suggestedPrice: suggested,
        lowestCompetitorPrice: minPrice,
        competitorPlatform: cheapest.platformName,
        competitorMarket: MARKET_META[cheapest.market] ?? cheapest.market,
        savingsPercent: Math.round(diff * 100),
      });
    }
  }

  // 按降价幅度从大到小排序
  suggestions.sort((a, b) => b.currentPrice - b.suggestedPrice - (a.currentPrice - a.suggestedPrice));

  return suggestions;
}
