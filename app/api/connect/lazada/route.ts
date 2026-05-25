import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../../src/auth/auth";
import { db } from "../../../../src/db/index";
import { storeConnections } from "../../../../src/db/schema";
import { encryptToken } from "../../../../src/crypto/encrypt";
import { LazadaClient, LAZADA_MARKETS, MarketCode } from "../../../../src/adapters/lazada/client";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { appKey, appSecret, accessToken, market } = await req.json();

    if (!appKey || !appSecret || !accessToken || !market) {
      return NextResponse.json(
        { error: "请填写 App Key、App Secret、Access Token 和市场" },
        { status: 400 }
      );
    }

    const marketCode = market as MarketCode;
    if (!LAZADA_MARKETS[marketCode]) {
      return NextResponse.json(
        { error: `不支持的市场: ${market}，可选: ${Object.keys(LAZADA_MARKETS).join(", ")}` },
        { status: 400 }
      );
    }

    // 验证凭证：调用 Lazada GetSeller 端点
    try {
      const client = new LazadaClient({ appKey, appSecret, accessToken, market: marketCode });
      const sellerData = await client.call("/seller/get");

      const seller = (sellerData as Record<string, unknown>) || {};
      const storeName = (seller.name as string) || (seller.company_name as string) || `Lazada ${marketCode.toUpperCase()}`;

      const credentials = JSON.stringify({ appKey, appSecret, accessToken, market: marketCode });
      const { encrypted, iv, authTag } = encryptToken(credentials);

      const id = crypto.randomUUID();
      db.insert(storeConnections).values({
        id,
        userId: auth.userId,
        platform: "lazada",
        market: marketCode,
        encryptedCredentials: encrypted,
        iv,
        authTag,
        storeName,
        status: "active",
      }).run();

      return NextResponse.json({
        success: true,
        connection: { id, platform: "lazada", storeName, status: "active" },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json(
        { error: `Lazada API 验证失败: ${detail}` },
        { status: 400 }
      );
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: `连接失败: ${detail}` }, { status: 500 });
  }
}
