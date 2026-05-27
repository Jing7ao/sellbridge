import { NextRequest, NextResponse } from "next/server";
import { checkCompliance } from "../../../src/engine/compliance";

export async function POST(req: NextRequest) {
  try {
    const { title, description, category, markets } = await req.json();

    if (!title || !markets?.length) {
      return NextResponse.json({ error: "请提供商品标题和目标市场" }, { status: 400 });
    }

    const result = checkCompliance({
      title,
      description: description ?? "",
      category: category ?? "",
      markets,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "合规检查失败" }, { status: 500 });
  }
}
