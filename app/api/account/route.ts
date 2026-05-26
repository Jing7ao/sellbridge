import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../src/auth/auth";
import { db } from "../../../src/db/index";
import { users, creditTransactions } from "../../../src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const auth = await getAuth();
  const t1 = Date.now();
  if (!auth?.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userRows = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
  const t2 = Date.now();
  const user = userRows[0];
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, auth.userId));
  const t3 = Date.now();

  console.log(`[api/account] auth=${t1-t0}ms user-query=${t2-t1}ms tx-query=${t3-t2}ms total=${t3-t0}ms`);

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
