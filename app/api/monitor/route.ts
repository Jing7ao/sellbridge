import { NextRequest, NextResponse } from "next/server";
import { getAllPrices, GetAllPricesOptions } from "../../../src/engine/price-monitor";
import { checkRateLimit } from "../../../src/middleware/rate-limit";
import { log } from "../../../src/logger";
import { getAuth } from "../../../src/auth/auth";
import { db } from "../../../src/db/index";
import { storeConnections } from "../../../src/db/schema";
import { decryptToken } from "../../../src/crypto/encrypt";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`monitor:${ip}`, { maxRequests: 30 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    // 查询用户的 Shopify 店铺连接
    const shopifyConnections: Array<{ storeDomain: string; accessToken: string }> = [];
    try {
      const rows = await db
        .select()
        .from(storeConnections)
        .where(and(eq(storeConnections.userId, auth.userId), eq(storeConnections.status, "active")));

      for (const row of rows) {
        if (row.platform === "shopify") {
          const creds = JSON.parse(decryptToken(row.encryptedCredentials, row.iv, row.authTag));
          shopifyConnections.push(creds as { storeDomain: string; accessToken: string });
        }
      }
    } catch (err) {
      log.error("Failed to load store connections for monitor", { error: String(err) });
    }

    const options: GetAllPricesOptions = {
      userId: auth.userId,
      shopifyConnections: shopifyConnections.length ? shopifyConnections : undefined,
    };

    const data = await getAllPrices(options);
    log.info("Monitor data fetched", { userId: auth.userId, total: data.snapshot.totalProducts });

    return NextResponse.json(data);
  } catch (err) {
    log.error("Monitor API error", { error: String(err) });
    return NextResponse.json(
      { error: "获取价格数据失败" },
      { status: 500 }
    );
  }
}
