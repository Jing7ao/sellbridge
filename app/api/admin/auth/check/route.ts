import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "../../../../../src/auth/admin-auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(getAdminCookieName())?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
  return NextResponse.json({ valid: true });
}
