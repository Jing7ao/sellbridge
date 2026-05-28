import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../../src/auth/auth";
import { db } from "../../../../src/db/index";
import { storeConnections } from "../../../../src/db/schema";
import { encryptToken } from "../../../../src/crypto/encrypt";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { getUserPlan, getShopLimit, getActiveShopCount } from "../../../../src/billing/limits";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 检查店铺连接数量限制
    const plan = await getUserPlan(auth.userId);
    const limit = getShopLimit(plan);
    const currentCount = await getActiveShopCount(auth.userId);
    if (currentCount >= limit) {
      const planNames: Record<string, string> = { basic: "基础版", pro: "专业版", enterprise: "企业版" };
      return NextResponse.json(
        { error: `店铺连接数已达上限（${planNames[plan]}：最多 ${limit === Infinity ? "无限" : limit} 个店铺），请升级方案` },
        { status: 403 }
      );
    }

    const { storeDomain, accessToken } = await req.json();

    if (!storeDomain || !accessToken) {
      return NextResponse.json(
        { error: "请填写商店域名和 Access Token" },
        { status: 400 }
      );
    }

    const domain = storeDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain.includes("myshopify.com") && !domain.includes(".")) {
      return NextResponse.json(
        { error: "请输入有效的 Shopify 商店域名" },
        { status: 400 }
      );
    }

    // 验证凭证：调用 Shopify shop 端点
    try {
      const shopResp = await fetch(
        `https://${domain}/admin/api/2024-01/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!shopResp.ok) {
        const errText = await shopResp.text();
        return NextResponse.json(
          {
            error:
              shopResp.status === 401
                ? "Token 无效，请检查后重试"
                : shopResp.status === 404
                  ? "商店域名不存在"
                  : `验证失败: HTTP ${shopResp.status}`,
          },
          { status: 400 }
        );
      }

      const shopData = await shopResp.json();
      const shopName = shopData.shop?.name || domain;
      const shopEmail = shopData.shop?.email || "";

      // 加密 Token
      const credentials = JSON.stringify({ storeDomain: domain, accessToken });
      const { encrypted, iv, authTag } = encryptToken(credentials);

      const id = crypto.randomUUID();
      await db.insert(storeConnections).values({
        id,
        userId: auth.userId,
        platform: "shopify",
        market: "sg",
        encryptedCredentials: encrypted,
        iv,
        authTag,
        storeName: shopName,
        status: "active",
      });

      return NextResponse.json({
        success: true,
        connection: { id, platform: "shopify", storeName: shopName, status: "active" },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "未知错误";
      return NextResponse.json(
        { error: `Shopify API 请求失败: ${detail}` },
        { status: 400 }
      );
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: `连接失败: ${detail}` }, { status: 500 });
  }
}
