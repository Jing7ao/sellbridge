import { NextRequest, NextResponse } from "next/server";
import { checkCompliance, getTariffInfo } from "../../../src/engine/compliance";

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

    // 附上各目标市场关税信息
    const tariffs = markets.map((m: string) => getTariffInfo(m)).filter(Boolean);

    // Form E 提醒
    const formENote = {
      title: "中国-东盟自贸区原产地证书（Form E）",
      body: "凭 Form E 证书，绝大多数消费品出口至东盟六国可享受 0% 关税。Form E 须在货物出口前向中国海关或贸促会申领。未提供 Form E 的货物将按 MFN 税率征税。申领网址：origin.customs.gov.cn",
    };

    return NextResponse.json({ ...result, tariffs, formENote });
  } catch {
    return NextResponse.json({ error: "合规检查失败" }, { status: 500 });
  }
}
