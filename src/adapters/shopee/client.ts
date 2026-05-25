/**
 * Shopee Open Platform API Client
 * Reference: https://open.shopee.com
 *
 * 签名算法:
 *   baseString = partner_id + api_path + timestamp + access_token + shop_id
 *   sign = HMAC-SHA256(baseString, partner_key) → hex
 *   发送时: 所有参数放 body (POST) 或 query (GET)
 */
import { createHmac } from "node:crypto";

export const SHOPEE_MARKETS = {
  th: { name: "泰国", currency: "THB", lang: "th", baseUrl: "https://partner.th.shopeemobile.com", timezone: "Asia/Bangkok" },
  vn: { name: "越南", currency: "VND", lang: "vi", baseUrl: "https://partner.vn.shopeemobile.com", timezone: "Asia/Ho_Chi_Minh" },
  id: { name: "印尼", currency: "IDR", lang: "id", baseUrl: "https://partner.id.shopeemobile.com", timezone: "Asia/Jakarta" },
  my: { name: "马来西亚", currency: "MYR", lang: "en", baseUrl: "https://partner.my.shopeemobile.com", timezone: "Asia/Kuala_Lumpur" },
  ph: { name: "菲律宾", currency: "PHP", lang: "en", baseUrl: "https://partner.ph.shopeemobile.com", timezone: "Asia/Manila" },
  sg: { name: "新加坡", currency: "SGD", lang: "en", baseUrl: "https://partner.sg.shopeemobile.com", timezone: "Asia/Singapore" },
} as const;

export type ShopeeMarketCode = keyof typeof SHOPEE_MARKETS;

export interface ShopeeConfig {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  market: ShopeeMarketCode;
}

interface ApiResponse<T = unknown> {
  request_id: string;
  error?: string;
  message?: string;
  response?: T;
}

export class ShopeeClient {
  private baseUrl: string;
  readonly config: ShopeeConfig;
  readonly market: ShopeeMarketCode;

  constructor(config: ShopeeConfig) {
    this.config = config;
    this.market = config.market;
    this.baseUrl = SHOPEE_MARKETS[config.market].baseUrl;
  }

  private sign(apiPath: string, timestamp: number): string {
    const baseStr = [
      this.config.partnerId,
      apiPath,
      timestamp,
      this.config.accessToken,
      this.config.shopId,
    ].join("");

    return createHmac("sha256", this.config.partnerKey)
      .update(baseStr)
      .digest("hex")
      .toLowerCase();
  }

  async call<T = unknown>(
    apiPath: string,
    params: Record<string, unknown> = {},
    method: "GET" | "POST" = "POST"
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.sign(apiPath, timestamp);

    const commonParams: Record<string, string | number> = {
      partner_id: this.config.partnerId,
      timestamp,
      sign,
      access_token: this.config.accessToken,
      shop_id: this.config.shopId,
    };

    const fullParams = { ...commonParams, ...params };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let fetchUrl = `${this.baseUrl}${apiPath}`;
    let body: string | undefined;

    if (method === "GET") {
      fetchUrl += `?${new URLSearchParams(
        Object.entries(fullParams).map(([k, v]) => [k, String(v)])
      )}`;
    } else {
      body = JSON.stringify(fullParams);
    }

    const resp = await fetch(fetchUrl, { method, headers, body });
    const json: ApiResponse<T> = await resp.json();

    if (json.error && json.error !== "") {
      throw new Error(
        `Shopee API Error [${json.error}]: ${json.message ?? "unknown"} (${apiPath})`
      );
    }

    return json.response as T;
  }
}
