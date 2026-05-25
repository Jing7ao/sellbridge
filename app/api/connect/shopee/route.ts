import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../../src/auth/auth";
import { db } from "../../../../src/db/index";
import { storeConnections } from "../../../../src/db/schema";
import { encryptToken } from "../../../../src/crypto/encrypt";
import { ShopeeClient, SHOPEE_MARKETS, ShopeeMarketCode } from "../../../../src/adapters/shopee/client";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { partnerId, partnerKey, shopId, accessToken, market } = await req.json();

    if (!partnerId || !partnerKey || !shopId || !accessToken || !market) {
      return NextResponse.json(
        { error: "请填写 Partner ID、Partner Key、Shop ID、Access Token 和市场" },
        { status: 400 }
      );
    }

    const marketCode = market as ShopeeMarketCode;
    if (!SHOPEE_MARKETS[marketCode]) {
      return NextResponse.json(
        { error: `不支持的市场: ${market}，可选: ${Object.keys(SHOPEE_MARKETS).join(", ")}` },
        { status: 400 }
      );
    }

    // 验证凭证：调用 Shopee GetShopInfo 端点
    try {
      const client = new ShopeeClient({
        partnerId: Number(partnerId),
        partnerKey,
        shopId: Number(shopId),
        accessToken,
        market: marketCode,
      });
      const shopData = await client.call("/api/v2/shop/get_shop_info");

      const shop = (shopData as Record<string, unknown>) || {};
      const storeName = (shop.shop_name as string) || `Shopee ${marketCode.toUpperCase()}`;

      const credentials = JSON.stringify({ partnerId, partnerKey, shopId, accessToken, market: marketCode });
      const { encrypted, iv, authTag } = encryptToken(credentials);

      const id = crypto.randomUUID();
      db.insert(storeConnections).values({
        id,
        userId: auth.userId,
        platform: "shopee",
        market: marketCode,
        encryptedCredentials: encrypted,
        iv,
        authTag,
        storeName,
        status: "active",
      }).run();

      return NextResponse.json({
        success: true,
        connection: { id, platform: "shopee", storeName, status: "active" },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json(
        { error: `Shopee API 验证失败: ${detail}` },
        { status: 400 }
      );
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: `连接失败: ${detail}` }, { status: 500 });
  }
}
