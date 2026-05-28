import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../src/db/index";
import { users, creditTransactions } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { grantPlanPeriod, getUserPlan, getPlanExpiry, PLAN_CREDITS, isFirstPlanPurchase } from "../../../../src/billing/limits";
import { verifyAdminToken, getAdminCookieName } from "../../../../src/auth/admin-auth";

const PLAN_LABELS: Record<string, string> = { pro: "专业版", enterprise: "企业版" };

/**
 * 管理员手动充值接口
 * POST { email, amount?, key?, plan?, months? }
 * plan: "pro" | "enterprise"，额度 = 方案配额 X 月数 X (首充 X2)
 * months: 购买月数，默认 1
 * amount: 仅追加额度（不涉及方案时使用）
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amount, key, plan, months } = body;

    const adminKey = process.env.ADMIN_KEY || "sellbridge-admin-2026";
    const cookieToken = req.cookies.get(getAdminCookieName())?.value;
    const isAdmin = (cookieToken && verifyAdminToken(cookieToken)) || (key && key === adminKey);
    if (!isAdmin) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: "请提供邮箱" }, { status: 400 });
    }

    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRows[0]) {
      return NextResponse.json({ error: "未找到该用户" }, { status: 404 });
    }

    const user = userRows[0];
    const txId = crypto.randomUUID();
    const purchaseMonths = typeof months === "number" && months > 0 ? months : 1;

    // 仅追加额度（不涉及方案）
    if (!plan || (plan !== "pro" && plan !== "enterprise")) {
      const extraAmount = typeof amount === "number" && amount > 0 ? amount : 0;
      if (!extraAmount) {
        return NextResponse.json({ error: "请提供 plan 或 amount" }, { status: 400 });
      }

      const newCredits = (user.credits ?? 0) + extraAmount;
      await db.update(users).set({ credits: newCredits }).where(eq(users.id, user.id));

      await db.insert(creditTransactions).values({
        id: txId,
        userId: user.id,
        amount: extraAmount,
        type: "topup",
        description: `管理员手动追加 +${extraAmount} 额度`,
      });

      return NextResponse.json({
        success: true,
        userId: user.id,
        email: user.email,
        newBalance: newCredits,
        added: extraAmount,
        plan: await getUserPlan(user.id),
        planExpiresAt: (await getPlanExpiry(user.id))?.toISOString() ?? null,
      });
    }

    // 购买方案
    const label = PLAN_LABELS[plan];
    const firstPurchase = await isFirstPlanPurchase(user.id);
    const multiplier = firstPurchase ? 2 : 1;
    const totalMonths = purchaseMonths * multiplier;
    const totalDays = totalMonths * 30;
    const creditsToAdd = PLAN_CREDITS[plan as "pro" | "enterprise"] * totalMonths;
    const extraAmount = typeof amount === "number" && amount > 0 ? amount : 0;
    const totalAdded = creditsToAdd + extraAmount;

    // 累加额度
    const newCredits = (user.credits ?? 0) + totalAdded;
    await db.update(users).set({ credits: newCredits }).where(eq(users.id, user.id));

    // 创建交易记录
    const descParts: string[] = [];
    descParts.push(`${label} ${purchaseMonths} 个月`);
    if (firstPurchase) descParts.push("首充买一赠一");
    if (firstPurchase && purchaseMonths > 1) descParts.push(`共 ${totalMonths} 个月`);
    descParts.push(`+${creditsToAdd} 额度`);
    if (extraAmount > 0) descParts.push(`(额外追加 ${extraAmount})`);

    await db.insert(creditTransactions).values({
      id: txId,
      userId: user.id,
      amount: totalAdded,
      type: "topup",
      description: descParts.join("，"),
    });

    // 授予方案周期
    await grantPlanPeriod(user.id, plan as "pro" | "enterprise", totalDays);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      newBalance: newCredits,
      added: totalAdded,
      plan: await getUserPlan(user.id),
      planExpiresAt: (await getPlanExpiry(user.id))?.toISOString() ?? null,
      firstPurchase,
      totalMonths,
      totalDays,
    });
  } catch (err) {
    console.error("[admin/topup] error:", err);
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}
