import { NextRequest, NextResponse } from "next/server";
import { loadHistory, addEntry, deleteEntry, clearHistory } from "../../../src/store/history";
import { checkRateLimit } from "../../../src/middleware/rate-limit";
import { log } from "../../../src/logger";
import { getAuth } from "../../../src/auth/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`history:${ip}`, { maxRequests: 30 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    }

    const history = loadHistory(auth.userId);
    return NextResponse.json({ entries: history, total: history.length });
  } catch (err) {
    log.error("History GET error", { error: String(err) });
    return NextResponse.json({ error: "获取历史失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`history:${ip}`, { maxRequests: 20 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    }

    const body = await req.json();
    const history = addEntry(body, auth.userId);
    return NextResponse.json({ entries: history, total: history.length });
  } catch (err) {
    log.error("History POST error", { error: String(err) });
    return NextResponse.json({ error: "保存历史失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`history:${ip}`, { maxRequests: 20 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const all = url.searchParams.get("all");

    if (all === "true") {
      clearHistory(auth.userId);
      log.info("History cleared via API", { userId: auth.userId });
      return NextResponse.json({ success: true });
    }

    if (id) {
      const history = deleteEntry(id, auth.userId);
      return NextResponse.json({ entries: history, total: history.length });
    }

    return NextResponse.json({ error: "缺少 id 或 all 参数" }, { status: 400 });
  } catch (err) {
    log.error("History DELETE error", { error: String(err) });
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
