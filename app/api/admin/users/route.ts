import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "../../../../src/auth/admin-auth";
import { db } from "../../../../src/db/index";
import { users } from "../../../../src/db/schema";
import { getUserPlan, getPlanExpiry, isFirstPlanPurchase } from "../../../../src/billing/limits";
import { sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(getAdminCookieName())?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");

    let rows;
    if (query && query.length >= 2) {
      rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          credits: users.credits,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(sql`${users.email} ILIKE ${"%" + query + "%"}`)
        .orderBy(desc(users.createdAt))
        .limit(50);
    } else {
      rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          credits: users.credits,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(50);
    }

    const enriched = await Promise.all(
      rows.map(async (u) => {
        const plan = await getUserPlan(u.id);
        const planExpiresAt = await getPlanExpiry(u.id);
        const firstPurchase = await isFirstPlanPurchase(u.id);
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          credits: u.credits ?? 20,
          plan,
          planExpiresAt: planExpiresAt?.toISOString() ?? null,
          createdAt: u.createdAt?.toISOString() ?? null,
          firstPurchase,
        };
      })
    );

    return NextResponse.json({ users: enriched });
  } catch (err) {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
