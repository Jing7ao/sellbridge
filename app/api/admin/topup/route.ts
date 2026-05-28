import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../src/db/index";
import { users, creditTransactions } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { setUserPlan } from "../../../../src/billing/limits";

/**
 * 管理员手动充值接口
 * POST { email, amount, key, plan? }
 * key 从环境变量 ADMIN_KEY 读取
 * plan 可选 "pro" | "enterprise"，传入则升级方案并设置 30 天到期
 */
export async function POST(req: NextRequest) {
  try {
    const { email, amount, key, plan } = await req.json();

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

    const planLabel = plan === "enterprise" ? "企业版" : plan === "pro" ? "专业版" : null;

    await db.insert(creditTransactions).values({
      id: txId,
      userId: user.id,
      amount,
      type: "topup",
      description: planLabel
        ? `管理员手动充值 +${amount} 额度，方案升级为 ${planLabel}（30天）`
        : `管理员手动充值 +${amount} 额度`,
    });

    // 升级方案（含30天到期）
    if (plan === "pro" || plan === "enterprise") {
      await setUserPlan(user.id, plan, 30);
    }

    await db
      .update(users)
      .set({ credits: (user.credits ?? 0) + amount })
      .where(eq(users.id, user.id));

    // 读取更新后的到期时间
    const updated = await db
      .select({ plan: users.plan, planExpiresAt: users.planExpiresAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      newBalance: (user.credits ?? 0) + amount,
      added: amount,
      plan: updated[0]?.plan ?? "basic",
      planExpiresAt: updated[0]?.planExpiresAt?.toISOString() ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}
