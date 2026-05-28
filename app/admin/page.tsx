"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Shield, LogOut, RefreshCw, CreditCard,
  BadgeCheck, Clock, X, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string | null;
}

const PLAN_LABELS: Record<string, string> = { basic: "基础版", pro: "专业版", enterprise: "企业版" };
const PLAN_COLORS: Record<string, string> = {
  basic: "bg-slate-100 text-slate-600",
  pro: "bg-indigo-50 text-indigo-700",
  enterprise: "bg-violet-50 text-violet-700",
};
const PLAN_CREDITS_MAP: Record<string, number> = { pro: 500, enterprise: 2000 };

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    fetch("/api/admin/auth/check")
      .then((r) => { setAuthorized(r.ok); })
      .catch(() => { setAuthorized(false); });
  }, []);

  // Redirect to login if not authed
  useEffect(() => {
    if (authorized === false) router.push("/admin/login");
  }, [authorized, router]);

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authorized) fetchUsers();
  }, [authorized, fetchUsers]);

  function handleSearch() {
    fetchUsers(search.length >= 2 ? search : undefined);
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">验证中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-white">SellBridge 管理员后台</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(search.length >= 2 ? search : undefined)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                await fetch("/api/admin/auth/login", { method: "DELETE" });
                router.push("/admin/login");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-900 rounded-xl border border-white/10">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="搜索用户邮箱..."
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            搜索
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-slate-400">总用户</p>
            <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-slate-400">付费用户</p>
            <p className="text-2xl font-bold text-white mt-1">
              {users.filter((u) => u.plan !== "basic").length}
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-slate-400">企业版用户</p>
            <p className="text-2xl font-bold text-white mt-1">
              {users.filter((u) => u.plan === "enterprise").length}
            </p>
          </div>
        </div>

        {/* User table */}
        <div className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">用户</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">方案</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">额度</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 hidden md:table-cell">到期</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 hidden md:table-cell">注册时间</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelected(u)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">{u.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{u.name || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[u.plan] || PLAN_COLORS.basic}`}>
                        <BadgeCheck className="w-3 h-3" />
                        {PLAN_LABELS[u.plan] || u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-mono text-xs">{u.credits}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.planExpiresAt ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(u.planExpiresAt).toLocaleDateString("zh-CN")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 hidden md:table-cell">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-CN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                      暂无用户数据
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                      加载中...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User detail panel */}
      {selected && (
        <UserPanel
          user={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            fetchUsers(search.length >= 2 ? search : undefined);
          }}
        />
      )}
    </div>
  );
}

function UserPanel({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUser;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [topupAmount, setTopupAmount] = useState("");
  const [planMonths, setPlanMonths] = useState("1");
  const [processing, setProcessing] = useState(false);

  async function handleTopup() {
    const amount = parseInt(topupAmount);
    if (!amount || amount <= 0) { toast.error("请输入有效金额"); return; }
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, amount }),
      });
      if (res.ok) {
        toast.success(`已为用户 ${user.email} 充值 ${amount} 额度`);
        setTopupAmount("");
        onUpdated();
      } else {
        const d = await res.json();
        toast.error(d.error || "充值失败");
      }
    } catch { toast.error("网络错误"); }
    setProcessing(false);
  }

  async function handleGrantPlan(plan: "pro" | "enterprise") {
    const months = parseInt(planMonths);
    if (!months || months <= 0) { toast.error("请输入有效月数"); return; }
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan, months }),
      });
      if (res.ok) {
        const d = await res.json();
        toast.success(`已开通${PLAN_LABELS[plan]} ${months} 个月，额度 ${d.newBalance}`);
        onUpdated();
      } else {
        const d = await res.json();
        toast.error(d.error || "操作失败");
      }
    } catch { toast.error("网络错误"); }
    setProcessing(false);
  }

  const planQuota = PLAN_CREDITS_MAP[user.plan] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg">
          <X className="w-5 h-5" />
        </button>

        {/* User info */}
        <div className="mb-6">
          <p className="text-sm font-bold text-white">{user.email}</p>
          {user.name && <p className="text-xs text-slate-400 mt-0.5">{user.name}</p>}
          <div className="flex items-center gap-3 mt-3">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[user.plan] || PLAN_COLORS.basic}`}>
              <BadgeCheck className="w-3 h-3" />
              {PLAN_LABELS[user.plan] || user.plan}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              {user.credits} 额度
            </span>
            {user.planExpiresAt && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                到期 {new Date(user.planExpiresAt).toLocaleDateString("zh-CN")}
              </span>
            )}
          </div>
        </div>

        {/* Plan quota bar */}
        {user.plan !== "basic" && (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">方案额度使用</span>
              <span className="text-xs text-slate-400">{user.credits} / {planQuota}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (user.credits / planQuota) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Topup section */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-slate-300 mb-3">手动追加额度</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="输入额度数"
              className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={handleTopup}
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 shrink-0"
            >
              追加
            </button>
          </div>
        </div>

        {/* Plan section */}
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-300 mb-3">购买 / 续费方案</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400">月数：</span>
            <input
              type="number"
              value={planMonths}
              onChange={(e) => setPlanMonths(e.target.value)}
              className="w-20 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleGrantPlan("pro")}
              disabled={processing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              专业版 (500 额度)
            </button>
            <button
              onClick={() => handleGrantPlan("enterprise")}
              disabled={processing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              企业版 (2000 额度)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
