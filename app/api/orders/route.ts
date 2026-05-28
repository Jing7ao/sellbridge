import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "../../../src/engine/order-manager";
import type { ShopifyCredentials, LazadaCredentials, ShopeeCredentials, TiktokCredentials } from "../../../src/engine/order-manager";
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
    if (!isFeatureAllowed(plan, "orders")) {
      return NextResponse.json({
        blocked: true,
        reason: "plan_locked",
        message: "订单管理为专业版及以上功能",
        plan,
      });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`orders:${ip}`, { maxRequests: 30 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as
      | "pending" | "ready_to_ship" | "shipped" | "completed" | "cancelled"
      | null;

    const rows = await db
      .select()
      .from(storeConnections)
      .where(and(eq(storeConnections.userId, auth.userId), eq(storeConnections.status, "active")));

    const shopify: ShopifyCredentials[] = [];
    const lazada: LazadaCredentials[] = [];
    const shopee: ShopeeCredentials[] = [];
    const tiktok: TiktokCredentials[] = [];

    for (const row of rows) {
      try {
        const creds = JSON.parse(decryptToken(row.encryptedCredentials, row.iv, row.authTag));
        switch (row.platform) {
          case "shopify":
            shopify.push({
              storeDomain: creds.storeDomain ?? creds.store_domain,
              accessToken: creds.accessToken ?? creds.access_token,
              storeName: row.storeName ?? undefined,
            });
            break;
          case "lazada":
            lazada.push({
              appKey: creds.appKey ?? creds.app_key,
              appSecret: creds.appSecret ?? creds.app_secret,
              accessToken: creds.accessToken ?? creds.access_token,
              market: row.market,
              storeName: row.storeName ?? undefined,
            });
            break;
          case "shopee":
            shopee.push({
              partnerId: Number(creds.partnerId ?? creds.partner_id),
              partnerKey: creds.partnerKey ?? creds.partner_key,
              shopId: Number(creds.shopId ?? creds.shop_id),
              accessToken: creds.accessToken ?? creds.access_token,
              market: row.market,
              storeName: row.storeName ?? undefined,
            });
            break;
          case "tiktok":
            tiktok.push({
              appKey: creds.appKey ?? creds.app_key,
              appSecret: creds.appSecret ?? creds.app_secret,
              accessToken: creds.accessToken ?? creds.access_token,
              shopCipher: creds.shopCipher ?? creds.shop_cipher,
              market: row.market,
              storeName: row.storeName ?? undefined,
            });
            break;
        }
      } catch {
        log.warn("Failed to decrypt store connection", { platform: row.platform, storeId: row.id });
      }
    }

    const data = await getAllOrders(
      {
        shopify: shopify.length ? shopify : undefined,
        lazada: lazada.length ? lazada : undefined,
        shopee: shopee.length ? shopee : undefined,
        tiktok: tiktok.length ? tiktok : undefined,
      },
      { status: status ?? undefined }
    );

    log.info("Orders fetched", { userId: auth.userId, total: data.stats.total });

    return NextResponse.json(data);
  } catch (err) {
    log.error("Orders API error", { error: String(err) });
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 });
  }
}
