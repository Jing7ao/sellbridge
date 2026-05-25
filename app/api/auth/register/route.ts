import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../src/db/index";
import { users } from "../../../../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "请提供有效的邮箱地址" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.insert(users).values({
      id,
      email,
      passwordHash,
      name: name || email.split("@")[0] || undefined,
    }).run();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    );
  }
}
