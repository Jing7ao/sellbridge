"use client";

import Link from "next/link";
import { Globe, Zap, BarChart3, Sparkles, Shield, ArrowRight, Package, ShoppingBag, Boxes } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "一键多平台上架",
    desc: "输入中文商品信息，60 秒内自动发布到 Lazada、Shopee、TikTok Shop、Shopify 四大平台，覆盖东南亚 6 国。",
  },
  {
    icon: Globe,
    title: "AI 本地化翻译",
    desc: "AI 引擎自动将商品名/描述翻译为泰语、越南语、印尼语、马来语、英语，并生成本地化 SEO 关键词。",
  },
  {
    icon: BarChart3,
    title: "跨平台价格监控",
    desc: "实时追踪各平台同品类价格变化，同比/环比分析图表，让定价策略有理有据。",
  },
  {
    icon: ShoppingBag,
    title: "订单统一管理",
    desc: "一个页面查看所有平台的订单，按状态筛选，批量处理发货——告别 4 个后台来回切换。",
  },
  {
    icon: Boxes,
    title: "库存总览与预警",
    desc: "跨平台库存对比、低库存自动预警、售罄提醒，避免超卖。",
  },
  {
    icon: Shield,
    title: "合规风险检测",
    desc: "上架前自动检测商标侵权风险、禁售品类、各国市场准入要求，降低跨境合规风险。",
  },
];

const MARKETS = [
  { name: "泰国", flag: "🇹🇭", platforms: "Lazada · Shopee · TikTok Shop" },
  { name: "越南", flag: "🇻🇳", platforms: "Lazada · Shopee · TikTok Shop" },
  { name: "印尼", flag: "🇮🇩", platforms: "Lazada · Shopee · TikTok Shop" },
  { name: "马来西亚", flag: "🇲🇾", platforms: "Lazada · Shopee · TikTok Shop" },
  { name: "菲律宾", flag: "🇵🇭", platforms: "Lazada · Shopee · TikTok Shop" },
  { name: "新加坡", flag: "🇸🇬", platforms: "Lazada · Shopee · TikTok Shop" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">SellBridge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">定价</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200">登录</Link>
            <Link href="/login" className="btn-primary-sm">免费注册</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          已接入 4 大平台 · 覆盖 6 国 · 支持 6 种语言
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          一次输入，<span className="gradient-text">60 秒</span><br />上架东南亚四大平台
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          SellBridge 是面向东南亚跨境电商卖家的智能上架平台。中文输入商品信息，
          AI 自动翻译为 6 种本地语言并生成 SEO 关键词，一键发布到
          Lazada、Shopee、TikTok Shop 和 Shopify。
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/login" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            免费开始 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/pricing" className="px-8 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            查看定价
          </Link>
        </div>
      </section>

      {/* Markets */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <p className="text-xs text-slate-400 text-center mb-5 font-medium uppercase tracking-wider">覆盖市场</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {MARKETS.map((m) => (
            <div key={m.name} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-2xl">{m.flag}</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">{m.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-12">
            跨境上架需要的，SellBridge 都内置了
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">准备好把你的商品铺到东南亚了吗？</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3">注册即送 50 次免费上架额度，无需绑定信用卡。</p>
        <Link href="/login" className="btn-primary text-base px-8 py-3 mt-6 inline-flex items-center gap-2">
          免费注册 <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-slate-400">
          <p>SellBridge — 东南亚跨境电商 SaaS 平台 &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}
