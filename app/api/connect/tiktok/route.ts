import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../../src/auth/auth";
import { db } from "../../../../src/db/index";
import { storeConnections } from "../../../../src/db/schema";
import { encryptToken } from "../../../../src/crypto/encrypt";
import { TiktokClient, TIKTOK_MARKETS, TiktokMarketCode } from "../../../../src/adapters/tiktok/client";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { appKey, appSecret, accessToken, shopCipher, market } = await req.json();

    if (!appKey || !appSecret || !accessToken || !market) {
      return NextResponse.json(
        { error: "请填写 App Key、App Secret、Access Token 和市场" },
        { status: 400 }
      );
    }

    const marketCode = market as TiktokMarketCode;
    if (!TIKTOK_MARKETS[marketCode]) {
      return NextResponse.json(
        { error: `不支持的市场: ${market}，可选: ${Object.keys(TIKTOK_MARKETS).join(", ")}` },
        { status: 400 }
      );
    }

    // 验证凭证：调用 TikTok Shop GetAuthorizedShop 端点
    try {
      const client = new TiktokClient({
        appKey,
        appSecret,
        accessToken,
        shopCipher: shopCipher || undefined,
        market: marketCode,
      });
      const shopData = await client.call("/api/v1/shop/get_authorized_shop");

      const shop = (shopData as Record<string, unknown>) || {};
      const storeName = (shop.shop_name as string) || `TikTok Shop ${marketCode.toUpperCase()}`;

      const credentials = JSON.stringify({
        appKey,
        appSecret,
        accessToken,
        shopCipher: shopCipher || "",
        market: marketCode,
      });
      const { encrypted, iv, authTag } = encryptToken(credentials);

      const id = crypto.randomUUID();
      db.insert(storeConnections).values({
        id,
        userId: auth.userId,
        platform: "tiktok",
        market: marketCode,
        encryptedCredentials: encrypted,
        iv,
        authTag,
        storeName,
        status: "active",
      }).run();

      return NextResponse.json({
        success: true,
        connection: { id, platform: "tiktok", storeName, status: "active" },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json(
        { error: `TikTok Shop API 验证失败: ${detail}` },
        { status: 400 }
      );
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: `连接失败: ${detail}` }, { status: 500 });
  }
}
