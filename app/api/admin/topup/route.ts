import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../src/db/index";
import { users, creditTransactions } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { grantPlanPeriod, getUserPlan, getPlanExpiry } from "../../../../src/billing/limits";

/**
 * 管理员手动充值接口
 * POST { email, amount, key, plan?, months? }
 * key 从环境变量 ADMIN_KEY 读取
 * plan 可选 "pro" | "enterprise"，传入则购买/续费方案
 * months 购买月数，默认 1
 */
export async function POST(req: NextRequest) {
  try {
    const { email, amount, key, plan, months } = await req.json();

    const adminKey = process.env.ADMIN_KEY || "sellbridge-admin-2026";
    if (!key || key !== adminKey) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    if (!email || !amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "请提供邮箱和有效的充值金额" }, { status: 400 });
    }

    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRows[0]) {
      return NextResponse.json({ error: "未找到该用户" }, { status: 404 });
    }

    const user = userRows[0];
    const txId = crypto.randomUUID();
    const purchaseMonths = typeof months === "number" && months > 0 ? months : 1;
    const totalDays = purchaseMonths * 30;

    const planLabel = plan === "enterprise" ? "企业版" : plan === "pro" ? "专业版" : null;

    await db.insert(creditTransactions).values({
      id: txId,
      userId: user.id,
      amount,
      type: "topup",
      description: planLabel
        ? `管理员手动充值 +${amount} 额度，${planLabel} ${purchaseMonths} 个月（${totalDays}天）`
        : `管理员手动充值 +${amount} 额度`,
    });

    // 购买/续费方案（使用 plan_periods 叠加逻辑）
    if (plan === "pro" || plan === "enterprise") {
      await grantPlanPeriod(user.id, plan, totalDays);
    }

    await db
      .update(users)
      .set({ credits: (user.credits ?? 0) + amount })
      .where(eq(users.id, user.id));

    const activePlan = await getUserPlan(user.id);
    const expiry = await getPlanExpiry(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      newBalance: (user.credits ?? 0) + amount,
      added: amount,
      plan: activePlan,
      planExpiresAt: expiry?.toISOString() ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}
