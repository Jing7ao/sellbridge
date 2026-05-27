import Link from "next/link";
import { ArrowRight } from "lucide-react";

const POSTS = [
  {
    title: "2026年东南亚跨境电商上架工具推荐与对比",
    desc: "Lazada、Shopee、TikTok Shop、Shopify 多平台运营的实用工具对比，帮助中小卖家选择最适合的上架工具。",
    date: "2026-05-28",
    slug: "2026-se-asia-cross-border-tools",
  },
  {
    title: "独立站+Lazada+Shopee+TikTok Shop：东南亚多平台运营实操指南",
    desc: "详解如何同时运营四大平台，包括翻译策略、定价策略、库存协同和各国合规注意事项。",
    date: "2026-05-28",
    slug: "multi-platform-se-asia-guide",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">SellBridge 博客</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-10">跨境电商运营干货与东南亚市场洞察</p>

      <div className="space-y-6">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <p className="text-xs text-slate-400 mb-2">{post.date}</p>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{post.desc}</p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-indigo-500">
              阅读全文 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
