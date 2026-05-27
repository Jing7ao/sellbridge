import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "../../../../src/db/index";
import { users, creditTransactions } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { checkPassword } from "../../../../src/auth/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, invite } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "请提供有效的邮箱地址" }, { status: 400 });
    }

    const pw = checkPassword(password);
    if (!pw.valid) {
      return NextResponse.json({ error: pw.errors[0] }, { status: 400 });
    }

    const existingRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingRows[0]) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name: name || email.split("@")[0] || undefined,
    });

    // 邀请奖励：双方各得 50 积分
    if (invite && typeof invite === "string" && invite.length >= 8) {
      const inviterRows = await db.select().from(users).where(eq(users.id, invite)).limit(1);
      if (inviterRows[0]) {
        await db.insert(creditTransactions).values([
          {
            id: crypto.randomUUID(),
            userId: inviterRows[0].id,
            amount: 50,
            type: "invite_reward",
            description: `邀请用户 ${email} 注册奖励`,
          },
          {
            id: crypto.randomUUID(),
            userId: id,
            amount: 50,
            type: "invite_bonus",
            description: "通过邀请链接注册奖励",
          },
        ]);
        await db
          .update(users)
          .set({ credits: (inviterRows[0].credits ?? 100) + 50 })
          .where(eq(users.id, inviterRows[0].id));
        await db
          .update(users)
          .set({ credits: 150 })
          .where(eq(users.id, id));
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    );
  }
}
