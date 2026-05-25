import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { NEXTAUTH_SECRET } from "./src/auth/secret";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  const isAuth = !!token;
  const { pathname } = req.nextUrl;

  const STATIC_EXTS = /\.(mp4|webm|jpg|jpeg|png|gif|svg|ico|woff2?|ttf|eot)$/i;
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    STATIC_EXTS.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!isAuth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
