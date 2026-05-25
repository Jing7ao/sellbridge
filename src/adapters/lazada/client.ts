/**
 * Lazada Open Platform API Client
 * Reference: https://open.lazada.com
 */
import { createHmac } from "node:crypto";

// 六个东南亚站点
export const LAZADA_MARKETS = {
  my: { name: "马来西亚", currency: "MYR", lang: "en", domain: "api.lazada.com.my" },
  th: { name: "泰国", currency: "THB", lang: "th", domain: "api.lazada.co.th" },
  id: { name: "印尼", currency: "IDR", lang: "id", domain: "api.lazada.co.id" },
  vn: { name: "越南", currency: "VND", lang: "vi", domain: "api.lazada.vn" },
  ph: { name: "菲律宾", currency: "PHP", lang: "en", domain: "api.lazada.com.ph" },
  sg: { name: "新加坡", currency: "SGD", lang: "en", domain: "api.lazada.sg" },
} as const;

export type MarketCode = keyof typeof LAZADA_MARKETS;

export interface LazadaConfig {
  appKey: string;
  appSecret: string;
  accessToken: string; // 卖家授权后获取
  market: MarketCode;
}

interface ApiResponse<T = unknown> {
  code: string;
  data?: T;
  message?: string;
  request_id: string;
}

export class LazadaClient {
  private baseUrl: string;
  private config: LazadaConfig;

  constructor(config: LazadaConfig) {
    this.config = config;
    this.baseUrl = `https://${LAZADA_MARKETS[config.market].domain}/rest`;
  }

  /**
   * 调用 Lazada Open API
   * 所有请求统一走这个方法，自动处理签名和公共参数。
   */
  async call<T = unknown>(
    apiPath: string,
    params: Record<string, string | number | undefined> = {},
    method: "GET" | "POST" = "GET"
  ): Promise<T> {
    const sysParams: Record<string, string> = {
      app_key: this.config.appKey,
      sign_method: "sha256",
      timestamp: String(Date.now()),
      format: "json",
      v: "1.0",
      access_token: this.config.accessToken,
    };

    // 合并参数，排除 undefined
    const allParams: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...params, ...sysParams })) {
      if (v !== undefined) allParams[k] = String(v);
    }

    // 生成签名: HMAC-SHA256(api_name + sorted_params + app_secret)
    const sorted = Object.keys(allParams)
      .sort()
      .map((k) => `${k}${allParams[k]}`)
      .join("");
    const signStr = apiPath + sorted;
    allParams.sign = createHmac("sha256", this.config.appSecret)
      .update(signStr)
      .digest("hex")
      .toUpperCase();

    const url = `${this.baseUrl}${apiPath}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    };

    let body: string | undefined;
    if (method === "POST") {
      body = new URLSearchParams(allParams).toString();
    }

    const fetchUrl = method === "GET" ? `${url}?${new URLSearchParams(allParams)}` : url;

    const resp = await fetch(fetchUrl, { method, headers, body });
    const json: ApiResponse<T> = await resp.json();

    if (json.code !== "0") {
      throw new Error(`Lazada API Error [${json.code}]: ${json.message ?? "unknown"} (${apiPath})`);
    }

    return json.data as T;
  }
}
