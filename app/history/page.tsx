"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Clock, Globe, CheckCircle, XCircle, Search, Trash2, Download,
  ChevronDown, ChevronUp, Package, BarChart3, AlertTriangle,
} from "lucide-react";
import { StatCard } from "../../components/stat-card";
import { TableSkeleton, StatsRowSkeleton } from "../../components/skeleton";

const PLATFORM_NAMES: Record<string, string> = {
  lazada: "Lazada", shopee: "Shopee", tiktok: "TikTok Shop", shopify: "Shopify",
};

interface HistoryEntry {
  id: string;
  title: string;
  markets: string[];
  platforms?: string[];
  results: {
    market: string; marketName: string;
    platform?: string; platformName?: string;
    success: boolean; itemId?: number | string; error?: string;
    translation?: { title: string; keywords?: string[] };
  }[];
  timestamp: string;
  translationMode: string;
}

type SortMode = "time-desc" | "platforms" | "success";

const ICON_GRADIENTS: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
  purple: "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
  orange: "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("time-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.entries?.length) {
          setEntries(data.entries);
          localStorage.setItem("listing_history", JSON.stringify(data.entries));
        } else {
          const stored = localStorage.getItem("listing_history");
          if (stored) {
            try { setEntries(JSON.parse(stored)); } catch {}
          }
        }
      })
      .catch(() => {
        const stored = localStorage.getItem("listing_history");
        if (stored) {
          try { setEntries(JSON.parse(stored)); } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const syncStorage = (next: HistoryEntry[]) => {
    setEntries(next);
    localStorage.setItem("listing_history", JSON.stringify(next));
  };

  const deleteEntry = async (id: string) => {
    syncStorage(entries.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
    try { await fetch(`/api/history?id=${id}`, { method: "DELETE" }); } catch {}
  };

  const clearAll = async () => {
    syncStorage([]);
    setConfirmClear(false);
    try { await fetch("/api/history?all=true", { method: "DELETE" }); } catch {}
  };

  const stats = useMemo(() => {
    const total = entries.length;
    const totalResults = entries.reduce((s, e) => s + e.results.length, 0);
    const successResults = entries.reduce((s, e) => s + e.results.filter((r) => r.success).length, 0);
    const platforms = new Set<string>();
    const markets = new Set<string>();
    entries.forEach((e) => {
      e.platforms?.forEach((p) => platforms.add(p));
      e.markets?.forEach((m) => markets.add(m));
    });
    return { total, totalResults, successResults, platformCount: platforms.size, marketCount: markets.size };
  }, [entries]);

  const displayEntries = useMemo(() => {
    let list = filter
      ? entries.filter(
          (e) =>
            e.title.includes(filter) ||
            e.markets.some((m) => m.includes(filter.toLowerCase())) ||
            (e.platforms ?? []).some((p) =>
              (PLATFORM_NAMES[p] ?? p).toLowerCase().includes(filter.toLowerCase())
            )
        )
      : [...entries];

    switch (sortMode) {
      case "platforms":
        list.sort((a, b) => (b.platforms?.length ?? 0) - (a.platforms?.length ?? 0));
        break;
      case "success":
        list.sort((a, b) => {
          const aRate = a.results.filter((r) => r.success).length / a.results.length;
          const bRate = b.results.filter((r) => r.success).length / b.results.length;
          return bRate - aRate;
        });
        break;
      default:
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return list;
  }, [entries, filter, sortMode]);

  const exportCSV = () => {
    const header = "商品名称,时间,平台,市场,状态,Item ID,错误\n";
    const rows = entries.flatMap((e) =>
      e.results.map((r) =>
        [
          `"${e.title}"`,
          new Date(e.timestamp).toLocaleString("zh-CN"),
          r.platformName ?? "-",
          r.marketName,
          r.success ? "成功" : "失败",
          r.itemId ?? "-",
          r.error ? `"${r.error}"` : "",
        ].join(",")
      )
    );
    const csv = header + rows.join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `上架记录_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (entry: HistoryEntry) => {
    const allSuccess = entry.results.every((r) => r.success);
    const anySuccess = entry.results.some((r) => r.success);
    if (allSuccess) return { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: "全部成功", color: "bg-emerald-100 text-emerald-700" };
    if (anySuccess) return { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: "部分成功", color: "bg-amber-100 text-amber-700" };
    return { icon: <XCircle className="w-4 h-4 text-red-500" />, label: "全部失败", color: "bg-red-100 text-red-700" };
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">上架记录</h2>
          <p className="text-slate-500 text-sm">查看所有历史商品上架记录</p>
        </div>
      </div>

      {/* 统计摘要 */}
      {loading ? (
        <StatsRowSkeleton />
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in-up">
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="总上架次数" value={stats.total}
            gradient={ICON_GRADIENTS.blue}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="成功率"
            value={`${Math.round((stats.successResults / stats.totalResults) * 100)}%`}
            gradient={ICON_GRADIENTS.emerald}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="覆盖平台" value={stats.platformCount}
            gradient={ICON_GRADIENTS.purple}
          />
          <StatCard
            icon={<Globe className="w-5 h-5" />}
            label="覆盖市场" value={stats.marketCount}
            gradient={ICON_GRADIENTS.orange}
          />
        </div>
      ) : null}

      {/* 工具栏 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜索商品名称、平台或市场..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-sm"
            />
          </div>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-sm border-slate-200 rounded-xl shadow-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 py-2.5 px-3"
          >
            <option value="time-desc">按时间倒序</option>
            <option value="platforms">按平台数</option>
            <option value="success">按成功率</option>
          </select>

          <button onClick={exportCSV} className="btn-ghost text-xs">
            <Download className="w-3.5 h-3.5" /> 导出
          </button>

          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} className="btn-danger-ghost text-xs">
              <Trash2 className="w-3.5 h-3.5" /> 清空
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">确认清空？</span>
              <button onClick={clearAll} className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">确认</button>
              <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
            </div>
          )}
        </div>

        {filter && (
          <p className="text-xs text-slate-400">筛选结果: {displayEntries.length} 条记录</p>
        )}
      </div>

      {/* 列表 */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Clock className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">暂无上架记录</p>
          <p className="text-slate-400 text-xs mt-1">在「商品上架」页完成一次上架后，记录会出现在这里</p>
        </div>
      ) : displayEntries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 text-sm">没有匹配的记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayEntries.map((entry) => {
            const badge = getStatusBadge(entry);
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-hover"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 hover:opacity-70 transition-opacity"
                    >
                      {badge.icon}
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-slate-800 truncate">{entry.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(entry.timestamp).toLocaleString("zh-CN", {
                            year: "numeric", month: "2-digit", day: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                          <span className="mx-1.5">·</span>
                          {entry.platforms?.length ? `${entry.platforms.length} 平台` : `${entry.results.length} 结果`}
                          <span className="mx-1.5">·</span>
                          {entry.translationMode === "claude" ? "AI 翻译" : "模拟翻译"}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                        {entry.results.filter((r) => r.success).length}/{entry.results.length}
                      </span>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {entry.results.slice(0, 6).map((r) => (
                      <span
                        key={`${r.platform ?? ""}-${r.market}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.success
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-red-50 text-red-500 border border-red-200"
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        {r.platformName && <span className="text-slate-400">[{r.platformName}]</span>}
                        {r.marketName}
                      </span>
                    ))}
                    {entry.results.length > 6 && (
                      <span className="text-xs text-slate-400 px-2 py-1">+{entry.results.length - 6} 更多</span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 transition-all">
                    <div className="grid grid-cols-1 gap-2">
                      {entry.results.map((r, i) => (
                        <div
                          key={`${r.platform ?? ""}-${r.market}-${i}`}
                          className={`flex items-center justify-between py-2.5 px-4 rounded-xl ${
                            r.success ? "bg-white shadow-sm" : "bg-red-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-medium text-slate-600 w-16 shrink-0">{r.platformName ?? "-"}</span>
                            <span className="text-xs text-slate-500 w-12 shrink-0">{r.marketName}</span>
                            {r.success ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 min-w-0 ml-3">
                            {r.translation?.title && (
                              <span className="text-xs text-slate-500 truncate max-w-xs hidden sm:block">{r.translation.title}</span>
                            )}
                            {r.success && r.itemId ? (
                              <span className="text-xs text-emerald-500 font-mono shrink-0">#{r.itemId}</span>
                            ) : r.error ? (
                              <span className="text-xs text-red-400 truncate max-w-[12rem]">{r.error}</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
