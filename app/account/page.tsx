"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User, CreditCard, ArrowUpRight, ArrowDownRight, Gift, Zap,
  Package, History, Clock, BadgeCheck, Sparkles, ChevronRight,
  Wallet, RefreshCw, Link2, Copy, Users,
} from "lucide-react";
import { toast } from "sonner";

interface AccountInfo {
  id: string;
  email: string;
  name: string;
  credits: number;
  createdAt: string | null;
  transactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string | null;
  }[];
}

const PRICING_PLANS = [
  {
    name: "基础版",
    credits: 50,
    price: "免费试用",
    desc: "新用户注册即赠",
    features: ["50 次上架额度", "AI 翻译", "基础客服", "1 个店铺连接"],
    highlight: false,
  },
  {
    name: "专业版",
    credits: 500,
    price: "¥99/月",
    desc: "适合小型卖家",
    features: ["500 次上架额度", "AI 翻译 + SEO 优化", "AI 客服不限量", "5 个店铺连接", "价格监控"],
    highlight: true,
  },
  {
    name: "企业版",
    credits: 2000,
    price: "¥299/月",
    desc: "适合多店铺运营",
    features: ["2000 次上架额度", "全部 AI 功能不限量", "AI 客服优先级", "无限店铺连接", "价格监控 + 自动调价", "专属数据看板"],
    highlight: false,
  },
];

const TYPE_LABELS: Record<string, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  signup_bonus: { label: "新用户赠送", icon: Gift, color: "text-emerald-500" },
  topup: { label: "充值", icon: ArrowUpRight, color: "text-indigo-500" },
  listing_fee: { label: "上架消耗", icon: Package, color: "text-slate-500" },
  refund: { label: "退还", icon: ArrowDownRight, color: "text-amber-500" },
};

export default function AccountPage() {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [invite, setInvite] = useState<{ inviteCode: string; inviteLink: string; inviteCount: number; inviteCredits: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchInvite() {
    try {
      const res = await fetch("/api/account/invite");
      if (res.ok) setInvite(await res.json());
    } catch {}
  }

  async function copyInviteLink() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.inviteLink);
      toast.success("邀请链接已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }

  async function fetchAccount() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account");
      if (res.ok) {
        setInfo(await res.json());
      } else {
        const d = await res.json();
        setError(d.error || "加载失败");
      }
    } catch {
      setError("加载失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAccount(); fetchInvite(); }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-xl w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-white rounded-2xl border border-slate-100" />
            <div className="h-32 bg-white rounded-2xl border border-slate-100" />
            <div className="h-32 bg-white rounded-2xl border border-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
        <div className="text-center py-12">
          <p className="text-slate-500 mb-3">{error || "暂无数据"}</p>
          <button onClick={fetchAccount} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm rounded-xl">
            重试
          </button>
        </div>
      </div>
    );
  }

  const joinDate = info.createdAt
    ? new Date(info.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const usedCredits = info.transactions
    .filter((t) => t.type === "listing_fee")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const topupCredits = info.transactions
    .filter((t) => t.type === "signup_bonus" || t.type === "topup")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-slate-900 mb-6">用户中心</h1>

      {/* 新用户欢迎提示 — 点击滚到定价方案 */}
      {topupCredits <= 200 && (
        <button
          onClick={() => document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth" })}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 mb-6 shadow-xl shadow-orange-500/20 w-full text-left cursor-pointer hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">新用户专属礼遇</p>
                <p className="text-xs text-white/80 mt-0.5">
                  注册即送 20 额度 · 首次充值买一赠一 · 邀请好友各得 50 额度
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>
        </button>
      )}

      {/* 三卡片概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* 余额卡片 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">可用额度</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{info.credits}</p>
          <p className="text-xs text-slate-400">每次上架消耗 1 额度</p>
        </div>

        {/* 已用卡片 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">已用额度</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{usedCredits}</p>
          <p className="text-xs text-slate-400">共 {info.transactions.length} 条记录</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">账户信息</span>
          </div>
          <p className="text-sm font-medium text-slate-800 truncate">{info.name || info.email}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{info.email}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            加入于 {joinDate}
          </p>
        </div>
      </div>

      {/* 定价方案 */}
      <section id="pricing-plans" className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">定价方案</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-5 border-2 transition-all duration-200 ${
                plan.highlight
                  ? "border-indigo-400 shadow-lg shadow-indigo-500/10 relative"
                  : "border-slate-100 shadow-sm hover:shadow-md"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                  推荐
                </span>
              )}
              <p className="text-sm font-semibold text-slate-800">{plan.name}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{plan.price}</p>
              <p className="text-xs text-slate-400 mt-0.5">{plan.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.credits === 50 ? (
                <button
                  className="w-full mt-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 cursor-default"
                  disabled
                >
                  已激活
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className={`block text-center w-full mt-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  立即购买
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 邀请好友 */}
      {invite && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            邀请好友
          </h2>
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">邀请好友，双方各得 <span className="text-indigo-600 font-bold">50 额度</span></p>
                <p className="text-xs text-slate-500 mt-0.5">
                  已邀请 <span className="font-bold text-slate-700">{invite.inviteCount}</span> 人，累计获得 <span className="font-bold text-indigo-600">{invite.inviteCredits}</span> 额度
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 font-mono truncate">
                <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{invite.inviteLink}</span>
              </div>
              <button onClick={copyInviteLink} className="btn-primary-sm flex items-center gap-1.5 shrink-0">
                <Copy className="w-3.5 h-3.5" />
                复制链接
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 交易记录 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <History className="w-4 h-4" />
          额度记录
          <button onClick={fetchAccount} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="刷新">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </h2>

        {info.transactions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">暂无额度记录</p>
            <p className="text-xs text-slate-400 mt-1">注册赠送额度将自动到账</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {info.transactions.map((t) => {
                const typeInfo = TYPE_LABELS[t.type] ?? { label: t.type, icon: ArrowUpRight, color: "text-slate-500" };
                const Icon = typeInfo.icon;
                return (
                  <div key={t.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        t.amount > 0 ? "bg-emerald-50" : "bg-slate-100"
                      }`}>
                        <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{typeInfo.label}</p>
                        <p className="text-xs text-slate-400">
                          {t.description}
                          {t.createdAt && ` · ${new Date(t.createdAt).toLocaleDateString("zh-CN")}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${
                      t.amount >= 0 ? "text-emerald-600" : "text-slate-600"
                    }`}>
                      {t.amount > 0 ? "+" : ""}{t.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
