import { NextResponse } from "next/server";
import { getAuth } from "../../../../src/auth/auth";
import { db } from "../../../../src/db/index";
import { creditTransactions } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const inviteCode = auth.userId; // use full UUID as invite code
    const inviteLink = `${process.env.NEXTAUTH_URL ?? "https://sellbridge.app"}/login?invite=${inviteCode}`;

    const rewards = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, auth.userId));

    const inviteCount = rewards.filter((t) => t.type === "invite_reward").length;
    const inviteCredits = rewards
      .filter((t) => t.type === "invite_reward")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      inviteCode,
      inviteLink,
      inviteCount,
      inviteCredits,
    });
  } catch {
    return NextResponse.json({ error: "获取邀请信息失败" }, { status: 500 });
  }
}
