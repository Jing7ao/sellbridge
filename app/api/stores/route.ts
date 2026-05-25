import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../src/auth/auth";
import { db } from "../../../src/db/index";
import { storeConnections } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const connections = db
      .select({
        id: storeConnections.id,
        platform: storeConnections.platform,
        market: storeConnections.market,
        storeName: storeConnections.storeName,
        status: storeConnections.status,
        createdAt: storeConnections.createdAt,
      })
      .from(storeConnections)
      .where(eq(storeConnections.userId, auth.userId))
      .all();

    return NextResponse.json({ connections });
  } catch {
    return NextResponse.json({ error: "获取店铺列表失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
    }

    const result = db
      .delete(storeConnections)
      .where(and(eq(storeConnections.id, id), eq(storeConnections.userId, auth.userId)))
      .run();

    if (result.changes === 0) {
      return NextResponse.json({ error: "店铺不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
