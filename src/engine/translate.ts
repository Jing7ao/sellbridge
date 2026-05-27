/**
 * 多语言翻译引擎
 * 中文 → 泰/越/印尼/马来/菲律宾/英
 * 针对 Lazada/Shopee/TikTok Shop 标题 SEO 优化
 */
import { MarketCode, LAZADA_MARKETS } from "../adapters/lazada/client.js";
import { TRADEMARK_SENSITIVE_KEYWORDS } from "./compliance.js";

// ── 语言映射 ──

const MARKET_TO_LANG: Record<MarketCode, { code: string; name: string; flags: string[] }> = {
  th: { code: "th", name: "泰语", flags: ["Lazada TH", "Shopee TH", "TikTok TH"] },
  vn: { code: "vi", name: "越南语", flags: ["Lazada VN", "Shopee VN", "TikTok VN"] },
  id: { code: "id", name: "印尼语", flags: ["Lazada ID", "Shopee ID", "TikTok ID"] },
  my: { code: "ms", name: "马来语", flags: ["Lazada MY", "Shopee MY", "TikTok MY"] },
  ph: { code: "en", name: "英语（菲律宾）", flags: ["Lazada PH", "Shopee PH", "TikTok PH"] },
  sg: { code: "en", name: "英语（新加坡）", flags: ["Lazada SG", "Shopee SG", "TikTok SG"] },
};

// ── 翻译服务 ──

export interface TranslationResult {
  title: string;
  description?: string;
  keywords: string[];
  market: MarketCode;
  language: string;
}

export interface TranslateOptions {
  /** 源中文标题 */
  title: string;
  /** 源中文描述 */
  description?: string;
  /** 目标市场 */
  market: MarketCode;
  /** 关键词（中文），帮助优化 SEO */
  keywords?: string[];
  /** Claude API Key（环境变量 CLAUDE_API_KEY 或直接传入） */
  apiKey?: string;
}

/**
 * 用 Claude / DeepSeek API 翻译商品标题和描述
 *
 * 特点：
 * 1. 不只是翻译，还做本地化 SEO 优化
 * 2. 标题适配各平台字数限制
 * 3. 自动提取当地买家搜索高频词做关键词标签
 */
/** 构建商标规避约束（取最关键的品牌词，避免 prompt 过长） */
function buildTrademarkConstraint(): string {
  const topBrands = TRADEMARK_SENSITIVE_KEYWORDS.map((t) => `"${t.keyword}"`).join("、");
  return [
    "=== 商标合规要求（重要）===",
    `翻译时严禁在标题和描述中使用以下已注册商标名称：${topBrands}。`,
    "使用通用描述词替代品牌名。例如：",
    '- 不要说 "iPhone case"，说 "手机保护壳" 的本地语言翻译',
    '- 不要说 "Nike shoes"，说 "运动鞋" 的本地语言翻译',
    '- 不要说 "AirPods compatible"，说 "无线耳机兼容" 的本地语言翻译',
    "如果原文商品名称暗示某品牌（如'苹果手机壳''三星充电器'），翻译时必须去掉品牌暗示，仅描述商品本身的品类和功能。",
  ].join("\n");
}

function buildFallbackTranslation(title: string, keywords: string[], market: MarketCode) {
  const langCode = MARKET_TO_LANG[market]?.code ?? "en";
  const suffix = langCode !== "en" ? ` (${langCode})` : "";
  return {
    title: `${title}${suffix}`,
    keywords: keywords.length ? keywords : [],
  };
}

export async function translateProduct(options: TranslateOptions): Promise<TranslationResult> {
  const apiKey = options.apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const fallback = buildFallbackTranslation(options.title, options.keywords ?? [], options.market);
    const langInfo = MARKET_TO_LANG[options.market];
    return {
      title: fallback.title,
      keywords: fallback.keywords,
      market: options.market,
      language: langInfo?.name ?? "未知",
    };
  }

  const marketInfo = LAZADA_MARKETS[options.market];
  const langInfo = MARKET_TO_LANG[options.market];
  const keywordHint = options.keywords?.length
    ? `\n商品关键词（中文）: ${options.keywords.join("、")}`
    : "";

  const prompt = [
    `你是东南亚电商翻译专家。将以下商品信息翻译为${langInfo.name}（语言代码: ${langInfo.code}），并针对 ${marketInfo.name} 市场做本地化 SEO 优化。`,
    "",
    `目标站点: ${langInfo.flags.join(", ")}`,
    `市场: ${marketInfo.name}（${marketInfo.currency}）`,
    `语言: ${langInfo.name}`,
    keywordHint,
    "",
    `=== 翻译要求 ===`,
    `1. 标题: 30-80 字符，包含当地买家最常用的搜索词`,
    `2. 描述: 150-500 字符，自然流畅的营销语言，突出卖点`,
    `3. 关键词标签: 5-10 个当地语言的高频搜索关键词`,
    `4. 仅输出 JSON，不要其他内容`,
    "",
    buildTrademarkConstraint(),
    "",
    `=== 输入 ===`,
    `商品名称: ${options.title}`,
    ...(options.description ? [`商品描述: ${options.description}`] : []),
    "",
    `=== 输出格式 ===`,
    `{"title":"翻译后标题","description":"翻译后描述","keywords":["关键词1","关键词2",...]}`,
  ].join("\n");

  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const isDeepSeek = baseUrl.includes("deepseek");
  const model = isDeepSeek ? "deepseek-chat" : "claude-3-haiku-20240307";
  
  const reqBody = isDeepSeek 
    ? {
        model,
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }
    : {
        model,
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      };
  
  const headers: Record<string, string> = isDeepSeek
    ? {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      }
    : {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      };
  
  const resp = await fetch(`${baseUrl}${isDeepSeek ? "/chat/completions" : "/v1/messages"}`, {
    method: "POST",
    headers,
    body: JSON.stringify(reqBody),
  });

  if (!resp.ok) {
    throw new Error(`AI API error: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  let content = "";
  
  if (isDeepSeek) {
    content = data.choices?.[0]?.message?.content ?? "";
  } else {
    content = data.content?.[0]?.text ?? "";
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`翻译结果解析失败: ${content.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: parsed.title,
    description: parsed.description,
    keywords: parsed.keywords ?? [],
    market: options.market,
    language: langInfo.name,
  };
}

/**
 * 批量翻译：一条商品翻译到多个市场
 */
export async function translateToAll(
  options: Omit<TranslateOptions, "market">,
  markets: MarketCode[] = ["th", "vn", "id", "my", "ph", "sg"]
): Promise<Map<MarketCode, TranslationResult>> {
  const results = new Map<MarketCode, TranslationResult>();

  // 并发翻译（限 3 个并发，避免触发 API 限流）
  const concurrency = 3;
  for (let i = 0; i < markets.length; i += concurrency) {
    const batch = markets.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (market) => {
        const result = await translateProduct({ ...options, market });
        return { market, result } as const;
      })
    );
    for (const { market, result } of batchResults) {
      results.set(market, result);
    }
  }

  return results;
}

