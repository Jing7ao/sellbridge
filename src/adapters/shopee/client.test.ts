import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

describe("Shopee 签名算法", () => {
  function sign(
    partnerId: number,
    apiPath: string,
    timestamp: number,
    accessToken: string,
    shopId: number,
    partnerKey: string
  ): string {
    const baseStr = [partnerId, apiPath, timestamp, accessToken, shopId].join("");
    return createHmac("sha256", partnerKey).update(baseStr).digest("hex").toLowerCase();
  }

  const PARTNER_ID = 100000;
  const PARTNER_KEY = "test_partner_key_abc123";
  const SHOP_ID = 200000;
  const ACCESS_TOKEN = "746c7267686a6b6c6d6e6f7031323334";
  const API_PATH = "/api/v2/product/get_category";
  const TIMESTAMP = 1700000000;

  it("签名长度应为 64 字符", () => {
    const sig = sign(PARTNER_ID, API_PATH, TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    expect(sig).toHaveLength(64);
  });

  it("相同参数应生成相同签名", () => {
    const sig1 = sign(PARTNER_ID, API_PATH, TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    const sig2 = sign(PARTNER_ID, API_PATH, TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    expect(sig1).toBe(sig2);
  });

  it("签名应为 64 位小写 hex 字符串", () => {
    const sig = sign(PARTNER_ID, API_PATH, TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("不同 API 路径应生成不同签名", () => {
    const sig1 = sign(PARTNER_ID, API_PATH, TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    const sig2 = sign(PARTNER_ID, "/api/v2/product/add_item", TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    expect(sig1).not.toBe(sig2);
  });

  it("不同时间戳应生成不同签名", () => {
    const sig1 = sign(PARTNER_ID, API_PATH, TIMESTAMP, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    const sig2 = sign(PARTNER_ID, API_PATH, TIMESTAMP + 1, ACCESS_TOKEN, SHOP_ID, PARTNER_KEY);
    expect(sig1).not.toBe(sig2);
  });
});
