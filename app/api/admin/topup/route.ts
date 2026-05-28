import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../src/db/index";
import { users, creditTransactions } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { grantPlanPeriod, getUserPlan, getPlanExpiry, PLAN_CREDITS } from "../../../../src/billing/limits";
import { verifyAdminToken, getAdminCookieName } from "../../../../src/auth/admin-auth";

/**
 * 管理员手动充值接口
 * POST { email, amount?, key?, plan?, months? }
 * 支持两种鉴权：admin cookie 或 key 参数
 * plan 可选 "pro" | "enterprise"，传入则购买/续费方案，amount 默认取方案配额
 * amount 可选，额外追加额度（超出方案配额的部分）
 * months 购买月数，默认 1
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
    const totalDays = purchaseMonths * 30;

    // 额度：plan 决定配额，amount 作为额外追加
    const planCredits = (plan === "pro" || plan === "enterprise") ? PLAN_CREDITS[plan as "pro" | "enterprise"] : 0;
    const extraAmount = (typeof amount === "number" && amount > 0) ? amount : 0;
    const totalCredits = planCredits + extraAmount;

    if (!plan && !extraAmount) {
      return NextResponse.json({ error: "请提供 plan 或 amount" }, { status: 400 });
    }

    const planLabel = plan === "enterprise" ? "企业版" : plan === "pro" ? "专业版" : null;

    const descParts: string[] = [];
    if (planCredits > 0) descParts.push(`${planLabel}配额 ${planCredits} 额度`);
    if (extraAmount > 0) descParts.push(`额外追加 ${extraAmount} 额度`);
    if (planCredits > 0) descParts.push(`${planLabel} ${purchaseMonths} 个月（${totalDays}天）`);

    await db.insert(creditTransactions).values({
      id: txId,
      userId: user.id,
      amount: totalCredits,
      type: "topup",
      description: descParts.join("，"),
    });

    // 购买/续费方案（使用 plan_periods 叠加逻辑，内部会设置额度为方案配额）
    if (plan === "pro" || plan === "enterprise") {
      await grantPlanPeriod(user.id, plan, totalDays);
    }

    // 如果有额外追加额度，在 grantPlanPeriod 设置的配额基础上再加
    if (extraAmount > 0 && plan) {
      const currentCredits = (await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1))[0]?.credits ?? 0;
      await db
        .update(users)
        .set({ credits: currentCredits + extraAmount })
        .where(eq(users.id, user.id));
    } else if (!plan) {
      // 仅追加额度，不涉及方案
      await db
        .update(users)
        .set({ credits: (user.credits ?? 0) + extraAmount })
        .where(eq(users.id, user.id));
    }

    const activePlan = await getUserPlan(user.id);
    const expiry = await getPlanExpiry(user.id);
    const finalBalance = (await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1))[0]?.credits ?? 0;

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      newBalance: finalBalance,
      added: totalCredits,
      plan: activePlan,
      planExpiresAt: expiry?.toISOString() ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}
