/**
 * TikTok Shop API Client
 * Reference: https://partner.tiktokshop.com/doc
 *
 * TikTok Shop 使用 OAuth 2.0 Bearer Token 鉴权。
 * 部分高危操作需额外 HMAC-SHA256 签名（common_param.sign）。
 */
import { createHmac } from "node:crypto";

export const TIKTOK_MARKETS = {
  th: { name: "泰国", currency: "THB", lang: "th", region: "TH" },
  vn: { name: "越南", currency: "VND", lang: "vi", region: "VN" },
  id: { name: "印尼", currency: "IDR", lang: "id", region: "ID" },
  my: { name: "马来西亚", currency: "MYR", lang: "en", region: "MY" },
  ph: { name: "菲律宾", currency: "PHP", lang: "en", region: "PH" },
  sg: { name: "新加坡", currency: "SGD", lang: "en", region: "SG" },
} as const;

export type TiktokMarketCode = keyof typeof TIKTOK_MARKETS;

export interface TiktokConfig {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher?: string; // 店铺加密 ID（部分 API 需要）
  market: TiktokMarketCode;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  request_id?: string;
}

const BASE_URL = "https://open-api.tiktokglobalshop.com";

export class TiktokClient {
  readonly config: TiktokConfig;
  readonly market: TiktokMarketCode;

  constructor(config: TiktokConfig) {
    this.config = config;
    this.market = config.market;
  }

  /**
   * 生成请求签名
   * sign = HMAC-SHA256(app_secret + timestamp + path + body_str)
   */
  sign(
    path: string,
    timestamp: number,
    bodyStr: string = ""
  ): string {
    const signContent = this.config.appSecret + timestamp + path + bodyStr;
    return createHmac("sha256", this.config.appSecret)
      .update(signContent)
      .digest("hex");
  }

  async call<T = unknown>(
    apiPath: string,
    params: Record<string, unknown> = {},
    method: "GET" | "POST" | "PUT" = "POST"
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyStr = method !== "GET" ? JSON.stringify(params) : "";
    const sign = this.sign(apiPath, timestamp, bodyStr);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.accessToken}`,
      "x-tts-access-token": this.config.accessToken,
      "x-tts-timestamp": String(timestamp),
      "x-tts-sign": sign,
    };

    if (this.config.shopCipher) {
      headers["x-tts-shop-cipher"] = this.config.shopCipher;
    }

    let fetchUrl = `${BASE_URL}${apiPath}`;
    let body: string | undefined;

    if (method === "GET") {
      const qs = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&");
      if (qs) fetchUrl += `?${qs}`;
    } else {
      body = bodyStr;
    }

    const resp = await fetch(fetchUrl, { method, headers, body });
    const json: ApiResponse<T> = await resp.json();

    if (json.code !== 0) {
      throw new Error(
        `TikTok API Error [${json.code}]: ${json.message} (${apiPath})`
      );
    }

    return json.data as T;
  }
}
