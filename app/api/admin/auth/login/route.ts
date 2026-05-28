import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createAdminToken, getAdminCookieName } from "../../../../../src/auth/admin-auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const token = createAdminToken();
    const cookieStore = await cookies();
    cookieStore.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(getAdminCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ success: true });
}
