import { NextRequest, NextResponse } from "next/server";
import { getAllPrices } from "../../../src/engine/price-monitor";
import type { ShopifyCredentials, LazadaCredentials, ShopeeCredentials, TiktokCredentials } from "../../../src/engine/price-monitor";
import { checkRateLimit } from "../../../src/middleware/rate-limit";
import { log } from "../../../src/logger";
import { getAuth } from "../../../src/auth/auth";
import { db } from "../../../src/db/index";
import { storeConnections } from "../../../src/db/schema";
import { decryptToken } from "../../../src/crypto/encrypt";
import { eq, and } from "drizzle-orm";
import { getUserPlan, isFeatureAllowed } from "../../../src/billing/limits";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const plan = await getUserPlan(auth.userId);

    // 检查店铺连接
    const connectedRows = await db
      .select()
      .from(storeConnections)
      .where(and(eq(storeConnections.userId, auth.userId), eq(storeConnections.status, "active")));

    if (connectedRows.length === 0) {
      return NextResponse.json({
        blocked: true,
        reason: "no_stores",
        message: "请先连接店铺以获取价格数据",
        plan,
      });
    }

    if (!isFeatureAllowed(plan, "monitor")) {
      return NextResponse.json({
        blocked: true,
        reason: "plan_locked",
        message: "价格监控为专业版及以上功能",
        plan,
      });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`monitor:${ip}`, { maxRequests: 30 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    // 复用之前的连接查询结果
    const shopify: ShopifyCredentials[] = [];
    const lazada: LazadaCredentials[] = [];
    const shopee: ShopeeCredentials[] = [];
    const tiktok: TiktokCredentials[] = [];

    for (const row of connectedRows) {
      try {
        const creds = JSON.parse(decryptToken(row.encryptedCredentials, row.iv, row.authTag));
        switch (row.platform) {
          case "shopify":
            shopify.push({
              storeDomain: creds.storeDomain ?? creds.store_domain,
              accessToken: creds.accessToken ?? creds.access_token,
            });
            break;
          case "lazada":
            lazada.push({
              appKey: creds.appKey ?? creds.app_key,
              appSecret: creds.appSecret ?? creds.app_secret,
              accessToken: creds.accessToken ?? creds.access_token,
              market: row.market,
            });
            break;
          case "shopee":
            shopee.push({
              partnerId: creds.partnerId ?? creds.partner_id,
              partnerKey: creds.partnerKey ?? creds.partner_key,
              shopId: creds.shopId ?? creds.shop_id,
              accessToken: creds.accessToken ?? creds.access_token,
              market: row.market,
            });
            break;
          case "tiktok":
            tiktok.push({
              appKey: creds.appKey ?? creds.app_key,
              appSecret: creds.appSecret ?? creds.app_secret,
              accessToken: creds.accessToken ?? creds.access_token,
              shopCipher: creds.shopCipher ?? creds.shop_cipher,
              market: row.market,
            });
            break;
        }
      } catch (err) {
        log.warn("Failed to decrypt store connection", { platform: row.platform, storeId: row.id });
      }
    }

    const data = await getAllPrices({
      userId: auth.userId,
      shopify: shopify.length ? shopify : undefined,
      lazada: lazada.length ? lazada : undefined,
      shopee: shopee.length ? shopee : undefined,
      tiktok: tiktok.length ? tiktok : undefined,
    });

    log.info("Monitor data fetched", {
      userId: auth.userId,
      total: data.snapshot.totalProducts,
      platforms: [
        shopify.length && "shopify",
        lazada.length && "lazada",
        shopee.length && "shopee",
        tiktok.length && "tiktok",
      ].filter(Boolean).join(","),
    });

    return NextResponse.json(data);
  } catch (err) {
    log.error("Monitor API error", { error: String(err) });
    return NextResponse.json(
      { error: "获取价格数据失败" },
      { status: 500 }
    );
  }
}
