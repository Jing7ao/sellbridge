/**
 * 翻译引擎核心逻辑测试
 */
import { describe, it, expect } from "vitest";
import { translateProduct } from "./translate.js";

describe("translateProduct", () => {
  it("fallback 应使用原始商品标题而非硬编码内容", async () => {
    // 不传 API Key → 走 fallback
    const result = await translateProduct({
      title: "手机支架 铝合金 可折叠",
      description: "便携折叠手机支架",
      market: "th",
      // 不传 apiKey，确保走 fallback 路径
    });

    // fallback 应包含原标题内容，而非硬编码的"หูฟัง蓝牙耳机"
    expect(result.title).toContain("手机支架");
    expect(result.market).toBe("th");
    expect(result.language).toBe("泰语");
  });

  it("不同市场 fallback 应生成不同的标题后缀", async () => {
    const th = await translateProduct({ title: "USB充电器", market: "th" });
    const vn = await translateProduct({ title: "USB充电器", market: "vn" });

    expect(th.title).not.toBe(vn.title);
    expect(th.title).toContain("USB充电器");
    expect(vn.title).toContain("USB充电器");
  });

  it("菲律宾和新加坡市场应返回英语标题", async () => {
    const ph = await translateProduct({ title: "测试商品", market: "ph" });
    const sg = await translateProduct({ title: "测试商品", market: "sg" });

    expect(ph.language).toContain("英语");
    expect(sg.language).toContain("英语");
  });

  it("应保留用户提供的关键词", async () => {
    const result = await translateProduct({
      title: "无线耳机",
      market: "my",
      keywords: ["蓝牙", "降噪", "TWS"],
    });

    expect(result.keywords).toEqual(["蓝牙", "降噪", "TWS"]);
  });
});
