/**
 * Shopify Admin REST API Client
 * Reference: https://shopify.dev/docs/api/admin-rest
 *
 * Shopify 认证极其简洁：只需 X-Shopify-Access-Token 请求头。
 * 对开发商店（Development Store）即刻可用，无需 OAuth 流程。
 */
export const SHOPIFY_MARKETS = {
  th: { name: "泰国", currency: "THB", lang: "th", locale: "th-TH" },
  vn: { name: "越南", currency: "VND", lang: "vi", locale: "vi-VN" },
  id: { name: "印尼", currency: "IDR", lang: "id", locale: "id-ID" },
  my: { name: "马来西亚", currency: "MYR", lang: "en", locale: "en-MY" },
  ph: { name: "菲律宾", currency: "PHP", lang: "en", locale: "en-PH" },
  sg: { name: "新加坡", currency: "SGD", lang: "en", locale: "en-SG" },
} as const;

export type ShopifyMarketCode = keyof typeof SHOPIFY_MARKETS;

export interface ShopifyConfig {
  /** 商店域名，如 my-store.myshopify.com */
  storeDomain: string;
  /** Admin API 访问令牌（Private App 或 Partner 创建） */
  accessToken: string;
  /** API 版本 */
  apiVersion?: string;
  /** 主市场 */
  market?: ShopifyMarketCode;
}

type ApiResponse<T = unknown> = {
  [key: string]: T | Record<string, unknown> | undefined;
  errors?: Record<string, unknown>;
};

export class ShopifyClient {
  readonly config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    const version = config.apiVersion ?? "2024-01";
    this.baseUrl = `https://${config.storeDomain}/admin/api/${version}`;
  }

  async call<T = unknown>(
    apiPath: string,
    params?: Record<string, unknown>,
    method: "GET" | "POST" | "PUT" = "GET"
  ): Promise<T> {
    const headers: Record<string, string> = {
      "X-Shopify-Access-Token": this.config.accessToken,
      "Content-Type": "application/json",
    };

    let fetchUrl = `${this.baseUrl}${apiPath}`;
    let body: string | undefined;

    if (method === "GET" && params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        qs.set(k, String(v));
      }
      fetchUrl += `?${qs.toString()}`;
    } else if (method !== "GET" && params) {
      body = JSON.stringify(params);
    }

    const resp = await fetch(fetchUrl, { method, headers, body });

    if (!resp.ok) {
      const errText = await resp.text();
      let errMsg = `Shopify API HTTP ${resp.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = `Shopify API Error [${resp.status}]: ${errJson.errors ?? errText}`;
      } catch {}
      throw new Error(`${errMsg} (${apiPath})`);
    }

    const json: ApiResponse<T> = await resp.json();

    if (json.errors) {
      throw new Error(
        `Shopify API Error: ${JSON.stringify(json.errors)} (${apiPath})`
      );
    }

    // Shopify 响应包装在单数名词 key 中，如 { product: {...} }
    const key = Object.keys(json).find((k) => k !== "errors");
    return (key ? json[key] : json) as T;
  }
}
