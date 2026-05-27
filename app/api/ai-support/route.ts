import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../../src/middleware/rate-limit";
import { log } from "../../../src/logger";
import { getAuth } from "../../../src/auth/auth";

const SYSTEM_PROMPT = `你是 SellBridge 跨境电商平台的专属 AI 客服顾问，名字叫"小桥"。你的工作是热情、耐心地帮助东南亚电商卖家解决从开店到运营的各种问题。

## 你的身份
- 名字：小桥
- 性格：热情、细心、有耐心，像一位经验丰富的跨境电商朋友
- 说话风格：亲切自然，像朋友聊天一样，可以适当使用表情符号增加亲和力（如 😊📦🚀💡✅）

## 核心知识
- 平台：Shopify（独立站）、Lazada（阿里系）、Shopee（腾讯系）、TikTok Shop（社交电商）
- 市场：泰国、越南、印尼、马来西亚、菲律宾、新加坡
- 领域：选品建议、上架流程、定价策略、跨境物流、本地化翻译、SEO优化、平台规则

## 回复风格要求（非常重要）
1. 每次回复以问候或共情开头，比如"这个问题问得好！"、"我理解你的困惑～"、"很多新手卖家都会遇到这个情况"
2. 用自然的口语化中文，不要像写文档或说明书
3. 分点说明时用"第一...第二..."而不是 Markdown 格式的列表
4. 尽可能给出具体可操作的建议，而不是空泛的原则
5. 遇到不确定的信息，诚实说明并建议去官方渠道核实
6. 每次回复结尾可以加一句鼓励或追问，比如"还有什么想了解的吗？"、"需要我帮你梳理一下操作步骤吗？"
7. 回复长度适中，简短的问题简短答，复杂的问题可以详细展开`;

function isDeepSeek(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? "";
  return baseUrl.includes("deepseek");
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`ai:${ip}`, { maxRequests: 20 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const body = await req.json();
    const messages = body.messages as { role: "user" | "assistant"; content: string }[];

    if (!messages?.length) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const lastMsg = messages[messages.length - 1]?.content?.slice(0, 80) ?? "";
    log.info("AI support request", { msgCount: messages.length, lastMsg });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-xxxxxx" || apiKey.length < 10) {
      return NextResponse.json({
        reply: "嗨～小桥的 AI 大脑还没连上呢！😅\n\n管理员需要配置 ANTHROPIC_API_KEY 环境变量，小桥就能立刻为你服务啦！\n\n- 使用 DeepSeek：设置 ANTHROPIC_BASE_URL=https://api.deepseek.com，ANTHROPIC_API_KEY 填 DeepSeek Key\n- 使用 Claude：设置 ANTHROPIC_BASE_URL=https://api.anthropic.com，ANTHROPIC_API_KEY 填 Anthropic Key\n\n部署后记得重新部署一次哦～",
      });
    }

    const baseUrl = process.env.ANTHROPIC_BASE_URL ?? "https://api.deepseek.com";
    const useDeepSeek = isDeepSeek();

    let resp: Response;
    let reply: string;

    if (useDeepSeek) {
      // DeepSeek: OpenAI-compatible API
      resp = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 1024,
          temperature: 0.7,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
        }),
      });
    } else {
      // Anthropic Claude: Messages API
      resp = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });
    }

    if (!resp.ok) {
      const errText = await resp.text();
      log.error("AI Support API error", { status: resp.status, error: errText.slice(0, 200) });
      return NextResponse.json({
        reply: "抱歉，AI 服务暂时不可用，请稍后再试。如需紧急帮助，请联系平台客服。",
      });
    }

    const data = await resp.json();

    if (useDeepSeek) {
      reply = data.choices?.[0]?.message?.content ?? "抱歉，未能获取到有效回复，请重新提问。";
    } else {
      reply = data.content?.[0]?.text ?? "抱歉，未能获取到有效回复，请重新提问。";
    }

    return NextResponse.json({ reply });
  } catch (err) {
    log.error("AI Support error", { error: String(err) });
    return NextResponse.json({
      reply: "抱歉，服务出现异常，请稍后再试。",
    });
  }
}
