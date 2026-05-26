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

  const user = db.select().from(users).where(eq(users.id, auth.userId)).get();
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const transactions = db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, auth.userId))
    .all();

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
