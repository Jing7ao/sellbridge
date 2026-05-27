import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const MARKETS_TABLE = [
  ["泰国", "泰语", "偏好 emoji + 促销语气"],
  ["越南", "越南语", "功能罗列式，强调性价比"],
  ["印尼", "印尼语", "接地气，偏好 Halal 相关表述"],
  ["马来西亚", "马来语/英语", "双语标题常见"],
  ["菲律宾", "英语", "简洁美式英语，功能导向"],
  ["新加坡", "英语/中文", "中英双语标题，简洁商务风"],
];

const COMPLIANCE_TABLE = [
  ["泰国", "TISI 认证", "FDA 注册", "电子产品、食品、化妆品"],
  ["印尼", "SNI + BPOM + Halal", "BPOM + 进口配额", "全面准入要求，外国卖家需本地分销商"],
  ["越南", "CR 认证", "卫生部公告", "强制越南语标签"],
  ["马来西亚", "SIRIM 认证", "JAKIM Halal / NPRA", "IP 执法为东南亚最严"],
  ["菲律宾", "DTI/S 认证", "FDA 注册", "覆盖食品、化妆品、药品、器械"],
  ["新加坡", "Safety Mark", "SFA / HSA", "IP 执法极为严格"],
];

export default function BlogPost2() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8">
        <ArrowLeft className="w-4 h-4" /> 返回博客
      </Link>

      <p className="text-xs text-slate-400 mb-2">2026-05-28</p>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        独立站 + Lazada + Shopee + TikTok Shop：东南亚多平台运营实操指南
      </h1>

      <article className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">为什么要做多平台？</h2>
        <p>
          东南亚 6 个主要市场的电商格局高度分散。Lazada 在泰国和印尼用户基础深厚，Shopee 在越南、菲律宾渗透率最高，TikTok Shop 直播电商增长最快，Shopify 适合品牌独立站。据 2026 年数据，东南亚电商用户的平台交叉使用率超过 60%。
        </p>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">第一关：语言和本地化</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5">
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">市场</th>
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">语言</th>
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">文案特点</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS_TABLE.map(([market, lang, style]) => (
                <tr key={market}>
                  <td className="border border-slate-200 dark:border-white/10 p-2 font-medium">{market}</td>
                  <td className="border border-slate-200 dark:border-white/10 p-2">{lang}</td>
                  <td className="border border-slate-200 dark:border-white/10 p-2">{style}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><strong>建议：</strong>不要用 Google 翻译。AI 电商翻译引擎针对东南亚电商场景做优化，翻译结果更贴近本地消费者的搜索习惯。</p>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">第二关：定价策略</h2>
        <p>跨市场定价需要平衡平台佣金差异、汇率波动和本地竞争价格。建议上架前先在目标市场搜索同品类价格，预留 5-10% 汇率缓冲。</p>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">第三关：订单与库存协同</h2>
        <p>多平台运营最头疼的是库存协同。如果 Lazada 爆单卖出 40 件，Shopee 那边还显示 50 件库存——就会超卖。应对：设置安全库存缓冲，使用跨平台库存管理工具实时同步。</p>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">第四关：各市场合规要点</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5">
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">国家</th>
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">电子产品认证</th>
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">食品/化妆品</th>
                <th className="border border-slate-200 dark:border-white/10 p-2 text-left">备注</th>
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_TABLE.map(([country, elec, food, note]) => (
                <tr key={country}>
                  <td className="border border-slate-200 dark:border-white/10 p-2 font-medium">{country}</td>
                  <td className="border border-slate-200 dark:border-white/10 p-2">{elec}</td>
                  <td className="border border-slate-200 dark:border-white/10 p-2">{food}</td>
                  <td className="border border-slate-200 dark:border-white/10 p-2 text-sm">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><strong>最重要的一条：</strong>不要卖仿品。东南亚各国平台对知识产权的保护力度逐年加大——首次下架、二次永封。</p>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">第五关：物流与退货</h2>
        <p>新加坡/马来西亚物流成熟（3-5天），泰国/越南主要城市 5-7 天，印尼/菲律宾岛屿国家周期长且退货率高。建议高价商品用平台官方物流，低价商品考虑海外仓。</p>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">总结</h2>
        <p>东南亚多平台运营的核心能力排序：本地化能力、多平台协同、合规意识、成本控制。</p>

        <div className="mt-10 p-5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">准备开始你的东南亚多平台运营？</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-3">SellBridge 注册即送 50 次免费上架额度，内置合规检测。</p>
          <Link href="/login" className="btn-primary-sm inline-flex">免费注册</Link>
        </div>
      </article>
    </div>
  );
}
