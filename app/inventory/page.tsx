"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageFadeIn, StaggerChildren, StaggerItem } from "../../components/animations";

interface InventoryItem {
  productId: string;
  title: string;
  sku: string;
  platform: "shopify" | "lazada" | "shopee" | "tiktok";
  market: string;
  storeName: string;
  stock: number;
  price: number;
  imageUrl?: string;
  lowStock: boolean;
}

interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  byPlatform: Record<string, { products: number; stock: number }>;
}

const PLATFORM_LABELS: Record<string, string> = {
  shopify: "Shopify",
  lazada: "Lazada",
  shopee: "Shopee",
  tiktok: "TikTok Shop",
};

const PLATFORM_COLORS: Record<string, string> = {
  shopify: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  lazada: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  shopee: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  tiktok: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/inventory");
      const data = await resp.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setItems(data.items ?? []);
        setStats(data.stats ?? null);
      }
    } catch {
      toast.error("获取库存失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filtered = filter === "low"
    ? items.filter((i) => i.lowStock)
    : filter === "out"
    ? items.filter((i) => i.stock === 0)
    : items;

  return (
    <PageFadeIn className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">库存管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">跨平台库存总览与低库存预警</p>
        </div>
        <button onClick={fetchInventory} disabled={loading} className="btn-ghost gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StaggerItem>
            <StatCard label="商品总数" value={stats.totalProducts} color="slate" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="总库存" value={stats.totalStock} color="blue" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="低库存预警" value={stats.lowStockCount} color="yellow" icon={<AlertTriangle className="w-4 h-4" />} />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="已售罄" value={stats.outOfStockCount} color="red" icon={<XCircle className="w-4 h-4" />} />
          </StaggerItem>
        </StaggerChildren>
      )}

      {/* 筛选 + 平台分布 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {[
            { key: "all", label: "全部" },
            { key: "low", label: "低库存" },
            { key: "out", label: "已售罄" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {stats && (
          <div className="flex gap-2 ml-auto text-xs text-slate-400">
            {Object.entries(stats.byPlatform).map(([pf, info]) => (
              <span key={pf} className="flex items-center gap-1">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[pf]}`}>
                  {PLATFORM_LABELS[pf]}
                </span>
                {info.products}品/{info.stock}件
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 库存列表 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-xl h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {stats ? (filter !== "all" ? "无预警商品" : "暂无商品") : "暂无店铺连接"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {!stats ? (
              <>
                请先在<a href="/settings" className="text-indigo-500 hover:underline mx-1">店铺设置</a>中连接店铺
              </>
            ) : (
              "库存低于 10 件时自动预警"
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, idx) => (
            <div
              key={`${item.platform}-${item.productId}-${item.sku}`}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.title}</p>
                <p className="text-xs text-slate-400">
                  {item.sku ? `SKU: ${item.sku}` : item.storeName}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PLATFORM_COLORS[item.platform]}`}>
                {PLATFORM_LABELS[item.platform]}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                {item.market.toUpperCase()}
              </span>
              <div className="text-right">
                <p className={`text-sm font-bold ${item.stock === 0 ? "text-red-500" : item.lowStock ? "text-yellow-600" : "text-slate-600 dark:text-slate-300"}`}>
                  {item.stock}
                </p>
                <p className="text-xs text-slate-400">件</p>
              </div>
              {item.stock > 0 && (
                <p className="text-sm text-slate-400 w-20 text-right">{item.price.toFixed(2)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </PageFadeIn>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    slate: "text-slate-700 dark:text-slate-200",
    blue: "text-blue-700 dark:text-blue-400",
    yellow: "text-yellow-700 dark:text-yellow-400",
    red: "text-red-700 dark:text-red-400",
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-center shadow-sm">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className={`text-lg font-bold ${colorMap[color] ?? "text-slate-700"}`}>{value}</p>
      </div>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
