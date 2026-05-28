import { NextRequest, NextResponse } from "next/server";
import { listProduct } from "../../../src/engine/listing";
import type { ListingInput, Platform, StoreConnection } from "../../../src/engine/listing";
import { checkRateLimit } from "../../../src/middleware/rate-limit";
import { addEntry } from "../../../src/store/history";
import { saveBase64Image } from "../../../src/store/image";
import { log } from "../../../src/logger";
import { getAuth } from "../../../src/auth/auth";
import { db } from "../../../src/db/index";
import { storeConnections } from "../../../src/db/schema";
import { decryptToken } from "../../../src/crypto/encrypt";
import { eq, and } from "drizzle-orm";
import { deductCredits } from "../../../src/billing/limits";
import { users } from "../../../src/db/schema";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 限流：每 IP 每分钟 10 次
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`list:${ip}`, { maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const body = await req.json();
    const { title, description, markets, platforms, price, quantity, weight, images, keywords, category, packageLength, packageWidth, packageHeight } = body;

    if (!title || !markets?.length) {
      return NextResponse.json(
        { error: "请填写商品名称并选择至少一个市场" },
        { status: 400 }
      );
    }

    // 计算所需额度：市场数 × 平台数
    const activePlatforms: Platform[] = (platforms?.length ? platforms : ["shopify"]) as Platform[];
    const requiredCredits = markets.length * activePlatforms.length;

    // 检查积分是否足够
    const userRows = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    const currentCredits = userRows[0]?.credits ?? 0;
    if (currentCredits < requiredCredits) {
      return NextResponse.json(
        { error: `额度不足，需要 ${requiredCredits} 额度，当前剩余 ${currentCredits} 额度` },
        { status: 402 }
      );
    }

    // 图片从 base64 转为本地文件
    const imageUrls: string[] = [];
    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img === "string" && img.startsWith("data:")) {
          const url = saveBase64Image(img);
          if (url) imageUrls.push(url);
        } else if (typeof img === "string") {
          imageUrls.push(img);
        }
      }
    }

    // 查询用户已连接的所有平台店铺
    const userStores: StoreConnection[] = [];
    try {
      const rows = await db
        .select()
        .from(storeConnections)
        .where(and(eq(storeConnections.userId, auth.userId), eq(storeConnections.status, "active")));

      for (const row of rows) {
        const creds = JSON.parse(decryptToken(row.encryptedCredentials, row.iv, row.authTag));
        userStores.push({
          platform: row.platform as Platform,
          market: row.market,
          credentials: creds,
        });
      }
    } catch (err) {
      log.error("Failed to load store connections", { error: String(err) });
    }

    const input: ListingInput = {
      title,
      description: description || "",
      markets,
      platforms: activePlatforms,
      keywords: keywords?.length ? keywords : [],
      category: category || "",
      images: imageUrls,
      skus: [
        {
          sellerSku: "SKU001",
          price: parseFloat(price) || 0,
          quantity: parseInt(quantity) || 0,
          packageWeight: parseFloat(weight) || 0.5,
          packageHeight: parseFloat(packageHeight) || 10,
          packageLength: parseFloat(packageLength) || 10,
          packageWidth: parseFloat(packageWidth) || 10,
        },
      ],
    };

    log.info("Listing request", { userId: auth.userId, title, markets: markets.join(","), platforms: activePlatforms.join(",") });

    const results = await listProduct(input, userStores.length ? userStores : undefined);

    // 扣除上架额度（按实际尝试的平台×市场组合数）
    const deducted = results.length;
    const newBalance = await deductCredits(auth.userId, deducted, `上架商品「${title}」消耗 ${deducted} 额度`);
    if (newBalance === null) {
      log.error("Credit deduction failed after listing", { userId: auth.userId, title, deducted });
    }

    const hasApiKey = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY);

    const timestamp = new Date().toISOString();
    const historyEntry = {
      id: crypto.randomUUID(),
      title,
      markets,
      platforms: activePlatforms,
      results,
      timestamp,
      translationMode: hasApiKey ? "claude" : "mock",
    };

    try {
      await addEntry(historyEntry, auth.userId);
    } catch (err) {
      log.error("Failed to save history entry", { error: String(err) });
    }

    const successCount = results.filter((r) => r.success).length;
    log.info("Listing completed", { userId: auth.userId, title, success: `${successCount}/${results.length}` });

    return NextResponse.json({
      title,
      price,
      quantity,
      weight,
      images: imageUrls,
      results,
      translationMode: historyEntry.translationMode,
      connectedPlatforms: userStores.map((s) => s.platform),
      timestamp,
      historyId: historyEntry.id,
      creditsRemaining: newBalance ?? currentCredits,
    });
  } catch (err) {
    log.error("Listing API error", { error: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "未知错误" },
      { status: 500 }
    );
  }
}
