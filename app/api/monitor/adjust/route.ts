import { NextRequest, NextResponse } from "next/server";
import { getAllPrices } from "../../../../src/engine/price-monitor";
import type { ShopifyCredentials, LazadaCredentials, ShopeeCredentials, TiktokCredentials } from "../../../../src/engine/price-monitor";
import { generateAdjustments } from "../../../../src/engine/price-adjust";
import { log } from "../../../../src/logger";
import { getAuth } from "../../../../src/auth/auth";
import { db } from "../../../../src/db/index";
import { storeConnections } from "../../../../src/db/schema";
import { decryptToken } from "../../../../src/crypto/encrypt";
import { eq, and } from "drizzle-orm";
import { getUserPlan, isFeatureAllowed } from "../../../../src/billing/limits";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const plan = await getUserPlan(auth.userId);
    if (!isFeatureAllowed(plan, "adjust")) {
      return NextResponse.json({
        blocked: true,
        reason: "plan_locked",
        message: "自动调价为企业版专属功能",
        plan,
      });
    }

    const rows = await db
      .select()
      .from(storeConnections)
      .where(and(eq(storeConnections.userId, auth.userId), eq(storeConnections.status, "active")));

    if (rows.length === 0) {
      return NextResponse.json({
        blocked: true,
        reason: "no_stores",
        message: "请先连接店铺以获取价格数据",
        plan,
      });
    }

    const shopify: ShopifyCredentials[] = [];
    const lazada: LazadaCredentials[] = [];
    const shopee: ShopeeCredentials[] = [];
    const tiktok: TiktokCredentials[] = [];

    for (const row of rows) {
      try {
        const creds = JSON.parse(decryptToken(row.encryptedCredentials, row.iv, row.authTag));
        switch (row.platform) {
          case "shopify":
            shopify.push({ storeDomain: creds.storeDomain ?? creds.store_domain, accessToken: creds.accessToken ?? creds.access_token });
            break;
          case "lazada":
            lazada.push({ appKey: creds.appKey ?? creds.app_key, appSecret: creds.appSecret ?? creds.app_secret, accessToken: creds.accessToken ?? creds.access_token, market: row.market });
            break;
          case "shopee":
            shopee.push({ partnerId: creds.partnerId ?? creds.partner_id, partnerKey: creds.partnerKey ?? creds.partner_key, shopId: creds.shopId ?? creds.shop_id, accessToken: creds.accessToken ?? creds.access_token, market: row.market });
            break;
          case "tiktok":
            tiktok.push({ appKey: creds.appKey ?? creds.app_key, appSecret: creds.appSecret ?? creds.app_secret, accessToken: creds.accessToken ?? creds.access_token, shopCipher: creds.shopCipher ?? creds.shop_cipher, market: row.market });
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

    const suggestions = generateAdjustments(data.products);

    log.info("Auto-adjust suggestions generated", { userId: auth.userId, suggestions: suggestions.length });

    return NextResponse.json({
      snapshot: data.snapshot,
      suggestions,
      totalSuggestions: suggestions.length,
      potentialSavings: suggestions.reduce((sum, s) => sum + (s.currentPrice - s.suggestedPrice), 0),
    });
  } catch (err) {
    log.error("Auto-adjust API error", { error: String(err) });
    return NextResponse.json({ error: "获取调价建议失败" }, { status: 500 });
  }
}
