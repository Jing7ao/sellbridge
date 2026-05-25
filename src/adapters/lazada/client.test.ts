import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

describe("Lazada 签名算法", () => {
  function sign(apiPath: string, params: Record<string, string>, appSecret: string): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
    return createHmac("sha256", appSecret)
      .update(apiPath + sorted)
      .digest("hex")
      .toUpperCase();
  }

  it("签名长度应为 64 字符", () => {
    const sig = sign("/category/attributes/get", {
      app_key: "100001",
      sign_method: "sha256",
      timestamp: "1748000000000",
      format: "json",
      v: "1.0",
      access_token: "abc123",
      primary_category_id: "10002019",
    }, "test-secret");

    expect(sig).toHaveLength(64);
  });

  it("相同参数应生成相同签名", () => {
    const params = { app_key: "100001", timestamp: "1748000000000" };
    const sig1 = sign("/test", params, "secret");
    const sig2 = sign("/test", params, "secret");
    expect(sig1).toBe(sig2);
  });

  it("不同 API 路径应生成不同签名", () => {
    const params = { app_key: "100001" };
    const sig1 = sign("/path/a", params, "secret");
    const sig2 = sign("/path/b", params, "secret");
    expect(sig1).not.toBe(sig2);
  });

  it("不同密钥应生成不同签名", () => {
    const params = { app_key: "100001" };
    const sig1 = sign("/test", params, "secret-a");
    const sig2 = sign("/test", params, "secret-b");
    expect(sig1).not.toBe(sig2);
  });
});
