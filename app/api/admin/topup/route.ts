import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../src/db/index";
import { users, creditTransactions } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

/**
 * 管理员手动充值接口
 * POST { email, amount, key }
 * key 从环境变量 ADMIN_KEY 读取
 */
export async function POST(req: NextRequest) {
  try {
    const { email, amount, key } = await req.json();

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

    await db.insert(creditTransactions).values({
      id: txId,
      userId: user.id,
      amount,
      type: "topup",
      description: `管理员手动充值 +${amount} 额度`,
    });

    await db
      .update(users)
      .set({ credits: (user.credits ?? 0) + amount })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      newBalance: (user.credits ?? 0) + amount,
      added: amount,
    });
  } catch (err) {
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}
