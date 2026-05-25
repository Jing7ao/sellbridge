/**
 * 东南亚跨境电商 SaaS
 *
 * 功能:
 *   1. 一键上架 - 一个商品自动上到 Lazada/Shopee/TikTok Shop 多个站点
 *   2. 价格监控 - 竞品价格追踪 + AI 调价策略
 *   3. AI 客服 - 多语言自动回复
 *
 * 用法:
 *   npx tsx src/index.ts list --title "商品名" --desc "描述" --markets th,vn
 */
import { listProduct, formatListingReport, ListingInput } from "./engine/listing.js";
import type { MarketCode } from "./adapters/lazada/client.js";

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === "list") {
    // 一键上架
    const title = arg(args, "--title", "-t");
    const desc = arg(args, "--desc", "-d");
    const markets = (arg(args, "--markets", "-m") || "th,vn,id,my,ph,sg")
      .split(",")
      .map((m) => m.trim()) as MarketCode[];

    if (!title) {
      console.error("用法: npx tsx src/index.ts list --title '商品名' [--desc '描述'] [--markets th,vn,id]");
      process.exit(1);
    }

    console.log(`\n🚀 一键上架: ${title}\n目标市场: ${markets.join(", ")}\n`);

    const input: ListingInput = {
      title,
      description: desc,
      images: [],
      skus: [
        {
          sellerSku: "DEFAULT-001",
          quantity: 100,
          price: 49.9,
          packageWeight: 0.5,
          packageHeight: 10,
          packageLength: 10,
          packageWidth: 10,
        },
      ],
      markets,
      platforms: ["shopify", "lazada", "shopee", "tiktok"] as ListingInput["platforms"],
    };

    console.log("⏳ 翻译中 + 上架中...\n");
    const results = await listProduct(input);
    console.log(formatListingReport(results));
    return;
  }

  // 帮助
  console.log([
    "东南亚跨境电商 SaaS v0.1.0",
    "",
    "命令:",
    "  list    一键上架商品到 Lazada",
    "",
    "示例:",
    "  npx tsx src/index.ts list --title '无线蓝牙耳机 TWS-500' --desc '高品质降噪耳机' --markets th,vn,id",
    "",
    "环境变量:",
    "  CLAUDE_API_KEY               Claude API 密钥（翻译引擎）",
    "  LAZADA_TH_APP_KEY            各站点 Lazada App Key",
    "  LAZADA_TH_APP_SECRET",
    "  LAZADA_TH_ACCESS_TOKEN",
    "  (同样格式配置 VN/ID/MY/PH/SG)",
  ].join("\n"));
}

function arg(args: string[], ...names: string[]): string {
  for (const name of names) {
    const idx = args.indexOf(name);
    if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  }
  return "";
}

main().catch((err) => {
  console.error("运行失败:", err);
  process.exit(1);
});
