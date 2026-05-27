"use client";

import { Check } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "基础版",
    nameEn: "Basic",
    credits: 50,
    price: "免费",
    period: "",
    desc: "新用户注册即赠，体验核心功能",
    features: [
      "50 次上架额度",
      "AI 智能翻译（6 种语言）",
      "基础 AI 客服",
      "1 个店铺连接",
      "上架记录查询",
      "社区支持",
    ],
    highlight: false,
    cta: "免费注册",
    href: "/login",
  },
  {
    name: "专业版",
    nameEn: "Pro",
    credits: 500,
    price: "¥99",
    period: "/月",
    desc: "适合月销百单的中小卖家",
    features: [
      "500 次上架额度",
      "AI 翻译 + SEO 关键词优化",
      "AI 客服不限量",
      "5 个店铺连接",
      "跨平台价格监控",
      "跨平台订单管理",
      "跨平台库存管理",
      "邮件优先支持",
    ],
    highlight: true,
    cta: "升级专业版",
    href: "/account",
    badge: "推荐",
  },
  {
    name: "企业版",
    nameEn: "Enterprise",
    credits: 2000,
    price: "¥299",
    period: "/月",
    desc: "适合多店铺运营的成熟卖家",
    features: [
      "2000 次上架额度",
      "全部 AI 功能不限量",
      "AI 客服优先响应",
      "无限店铺连接",
      "价格监控 + 自动调价建议",
      "订单 + 库存全功能",
      "专属数据看板",
      "1v1 专属支持",
    ],
    highlight: false,
    cta: "升级企业版",
    href: "/account",
  },
];

const FAQS = [
  {
    q: "什么是"上架额度"？",
    a: "每次将一个商品发布到一个平台的一个市场，消耗 1 个上架额度。例如将一个商品发布到 Lazada TH、Shopee TH、TikTok Shop TH 三个平台 × 市场组合，消耗 3 个额度。",
  },
  {
    q: "支持哪些平台和市场？",
    a: "目前支持 Shopify、Lazada、Shopee、TikTok Shop 四个平台，覆盖泰国、越南、印尼、马来西亚、菲律宾、新加坡 6 个东南亚市场。",
  },
  {
    q: "可以随时升级或降级吗？",
    a: "可以。升级立即生效，剩余额度会累加到新计划中。降级在下个计费周期生效，已购额度不受影响。",
  },
  {
    q: "AI 翻译支持哪些语言？",
    a: "支持从中文翻译到泰语、越南语、印尼语、马来语、英语（菲律宾/新加坡），并针对各市场电商场景做本地化 SEO 优化。",
  },
  {
    q: "我的数据安全吗？",
    a: "所有店铺凭证使用 AES-256-GCM 加密存储，API 通信全程 HTTPS。我们不会将你的商品数据用于任何其他目的。",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          简单透明的<span className="gradient-text">定价</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg max-w-xl mx-auto">
          从小卖家到大卖家，都有适合你的方案。所有计划均包含 AI 智能翻译 + 多平台一键上架。
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.nameEn}
            className={`relative rounded-2xl border p-6 flex flex-col ${
              plan.highlight
                ? "border-indigo-300 dark:border-indigo-700 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-xl shadow-indigo-500/10"
                : "border-slate-200 dark:border-white/10 shadow-sm"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full shadow-md">
                {plan.badge}
              </span>
            )}

            <div className="mb-5">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">{plan.nameEn}</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{plan.desc}</p>
            </div>

            <div className="mb-5">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
              <span className="text-slate-400 text-sm">{plan.period}</span>
              <p className="text-xs text-slate-400 mt-1">{plan.credits} 次上架额度</p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                plan.highlight
                  ? "btn-primary"
                  : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-10">常见问题</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 p-4">
                <summary className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer list-none">
                  {faq.q}
                </summary>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">准备好开始了吗？</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">注册即送 50 次免费上架额度，无需绑定信用卡。</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex items-center gap-2">
          免费注册
        </Link>
      </div>
    </div>
  );
}
