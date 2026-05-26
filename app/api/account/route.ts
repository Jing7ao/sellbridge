import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../src/auth/auth";
import { db } from "../../../src/db/index";
import { users, creditTransactions } from "../../../src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth?.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userRows = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
  const user = userRows[0];
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, auth.userId));

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits ?? 100,
    createdAt: user.createdAt?.toISOString() ?? null,
    transactions: transactions
      .map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt?.toISOString() ?? null,
      }))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
  });
}
