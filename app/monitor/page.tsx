"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Package, RefreshCw,
  Loader2, ChevronDown, ChevronUp, Search, BarChart3, List, X,
  Store, ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { StatCard } from "../../components/stat-card";
import { StatsRowSkeleton, TableSkeleton } from "../../components/skeleton";
import { PageFadeIn, FadeInUp, StaggerChildren, StaggerItem } from "../../components/animations";
import { toast } from "sonner";

const PriceChart = dynamic(() => import("../../components/price-chart"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5 flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      <span className="ml-2 text-sm text-slate-400">加载图表...</span>
    </div>
  ),
});

interface PriceEntry {
  productId: number | string;
  title: string;
  platform: string;
  platformName: string;
  market: string;
  marketName: string;
  price: number;
  compareAtPrice?: number;
  change: "up" | "down" | "same" | "new";
  changePercent?: number;
  lastUpdated: string;
}

interface MonitorData {
  products: PriceEntry[];
  snapshot: {
    timestamp: string;
    totalProducts: number;
    upCount: number;
    downCount: number;
    sameCount: number;
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  shopify: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lazada: "bg-orange-50 text-orange-700 border-orange-200",
  shopee: "bg-amber-50 text-amber-700 border-amber-200",
  tiktok: "bg-slate-100 text-slate-700 border-slate-200",
};

const PLATFORM_CHART_COLORS: Record<string, string> = {
  Shopify: "#10b981",
  Lazada: "#f97316",
  Shopee: "#eab308",
  "TikTok Shop": "#6b7280",
};

const CHANGE_LABELS: Record<string, { icon: React.ReactNode; color: string }> = {
  up: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-red-500" },
  down: { icon: <TrendingDown className="w-3.5 h-3.5" />, color: "text-emerald-500" },
  same: { icon: <span className="w-3.5 h-3.5 inline-block">—</span>, color: "text-slate-400" },
  new: { icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />, color: "text-blue-500" },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "耳机/音频": ["耳机", "耳塞", "headset", "earphone", "earbuds", "headphone", "tai nghe", "หูฟัง", "speaker", "音箱", "音响", "loa", "ลำโพง"],
  "充电/电源": ["充电", "快充", "充电器", "电源", "数据线", "GaN", "USB-C", "charger", "cable", "adapter", "power", "sạc", "cáp"],
  "手机配件": ["手机", "支架", "壳", "膜", "phone", "holder", "case", "screen protector", "ốp lưng", "เคส", "cáp sạc"],
  "电脑/办公": ["笔记本", "电脑", "键盘", "鼠标", "laptop", "keyboard", "mouse", "monitor", "显示器", "chuột", "bàn phím"],
  "家电/日用": ["家居", "家电", "清洁", "厨房", "home", "kitchen", "clean", "máy", "quạt", "đèn"],
  "服饰/配饰": ["衣服", "鞋", "包", "手表", "clothing", "shoes", "bag", "watch", "quần áo", "giày", "túi", "đồng hồ"],
  "美妆/个护": ["化妆", "护肤", "美容", "口红", "makeup", "skincare", "beauty", "lipstick", "trang điểm", "dưỡng da"],
  "母婴/玩具": ["婴儿", "儿童", "玩具", "baby", "kids", "toy", "mẹ và bé", "đồ chơi"],
  "运动/户外": ["运动", "户外", "健身", "sport", "outdoor", "fitness", "gym", "camping", "thể thao", "dã ngoại"],
  "食品/饮料": ["食品", "零食", "饮料", "咖啡", "food", "snack", "drink", "coffee", "trà", "cà phê", "thực phẩm", "อาหาร"],
  "礼品卡": ["gift card", "礼品卡", "thẻ quà tặng"],
  "汽车/摩托": ["汽车", "摩托车", "车配", "car", "moto", "auto", "phụ tùng", "ô tô", "xe máy", "รถยนต์"],
};

function detectCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "其他";
}

const STAT_GRADIENTS: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
  red: "bg-gradient-to-br from-red-500 to-rose-500 text-white",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
  purple: "bg-gradient-to-br from-purple-500 to-violet-500 text-white",
};

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"card" | "chart">("card");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/monitor");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = useMemo(() => {
    if (!data) return [];
    const cats = new Set(data.products.map((p) => detectCategory(p.title)));
    return Array.from(cats).sort();
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory && detectCategory(p.title) !== selectedCategory) return false;
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(p.platform)) return false;
      return true;
    });
  }, [data, search, selectedCategory, selectedPlatforms]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, PriceEntry[]> = {};
    for (const p of filteredProducts) {
      if (!groups[p.title]) groups[p.title] = [];
      groups[p.title].push(p);
    }
    return Object.entries(groups);
  }, [filteredProducts]);

  const chartComparisonData = useMemo(() => {
    const productTitles = [...new Set(filteredProducts.map((p) => p.title))];
    return productTitles.slice(0, 20).map((title) => {
      const row: Record<string, string | number> = {
        product: title.length > 20 ? title.slice(0, 20) + "..." : title,
      };
      const entries = filteredProducts.filter((p) => p.title === title);
      for (const platform of ["Shopify", "Lazada", "Shopee", "TikTok Shop"]) {
        const found = entries.find((e) => e.platformName === platform);
        row[platform] = found ? found.price : 0;
      }
      return row;
    });
  }, [filteredProducts]);

  const togglePlatform = (code: string) => {
    const next = new Set(selectedPlatforms);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedPlatforms(next);
  };

  return (
    <PageFadeIn className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <FadeInUp>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">价格监控</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">跨平台商品价格追踪与对比</p>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <button onClick={fetchData} disabled={loading} className="btn-ghost dark:bg-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </FadeInUp>
      </div>

      {/* 搜索 + 筛选 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索商品名称..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "card" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" />列表
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "chart" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 inline mr-1" />图表
            </button>
          </div>
        </div>

        {/* 品类筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">品类</span>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              selectedCategory === null
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 平台筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">平台</span>
          {Object.entries(PLATFORM_COLORS).map(([code, colorClass]) => {
            const name = code === "shopify" ? "Shopify" : code === "lazada" ? "Lazada" : code === "shopee" ? "Shopee" : "TikTok";
            const selected = selectedPlatforms.has(code);
            return (
              <button
                key={code}
                onClick={() => togglePlatform(code)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  selected ? colorClass : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {name}
              </button>
            );
          })}
          {selectedPlatforms.size > 0 && (
            <button onClick={() => setSelectedPlatforms(new Set())} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">清除</button>
          )}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && !data && (
        <div className="space-y-6">
          <StatsRowSkeleton />
          <TableSkeleton rows={5} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-5">
          {error}
        </div>
      )}

      {data && data.snapshot.totalProducts === 0 && (
        // 无连接店铺时的空状态引导
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-5">
            <Store className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">连接店铺，获取价格信息</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            目前还没有连接任何电商店铺。前往设置页面连接 Shopify / Lazada / Shopee / TikTok Shop，即可实时监控各平台商品价格。
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium hover:from-indigo-600 hover:to-violet-600 transition-all shadow-sm"
          >
            前往连接店铺 <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {data && data.snapshot.totalProducts > 0 && (
        <>
          {/* 摘要栏 */}
          <StaggerChildren className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StaggerItem><StatCard icon={<Package className="w-5 h-5" />} label="监控商品" value={data.snapshot.totalProducts} gradient={STAT_GRADIENTS.blue} /></StaggerItem>
            <StaggerItem><StatCard icon={<TrendingUp className="w-5 h-5" />} label="涨价" value={data.snapshot.upCount} gradient={STAT_GRADIENTS.red} /></StaggerItem>
            <StaggerItem><StatCard icon={<TrendingDown className="w-5 h-5" />} label="降价" value={data.snapshot.downCount} gradient={STAT_GRADIENTS.emerald} /></StaggerItem>
            <StaggerItem><StatCard icon={<DollarSign className="w-5 h-5" />} label="最后更新" value={new Date(data.snapshot.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} gradient={STAT_GRADIENTS.purple} isTime /></StaggerItem>
          </StaggerChildren>

          {/* 筛选结果提示 */}
          {(search || selectedCategory || selectedPlatforms.size > 0) && (
            <p className="text-xs text-slate-400 mb-4">
              筛选: {groupedProducts.length} 商品 · {filteredProducts.length} 条价格
            </p>
          )}

          {/* 图表视图 */}
          {viewMode === "chart" && (
            <PriceChart
              data={chartComparisonData}
              platformColors={PLATFORM_CHART_COLORS}
            />
          )}

          {/* 列表视图 */}
          {viewMode === "card" && (
            <>
              {groupedProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                  <DollarSign className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm font-medium">没有匹配的商品</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedProducts.map(([title, entries]) => (
                    <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-hover">
                      <button
                        onClick={() => setExpandedProduct(expandedProduct === title ? null : title)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-sm text-slate-800 truncate">{title}</span>
                          <span className="text-xs text-slate-400 shrink-0">{entries.length} 平台</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium shrink-0">{detectCategory(title)}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {entries.some((e) => e.change === "up") && (
                            <span className="text-xs text-red-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /></span>
                          )}
                          {entries.some((e) => e.change === "down") && (
                            <span className="text-xs text-emerald-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" /></span>
                          )}
                          <span className="text-sm font-mono font-semibold text-slate-700">
                            ¥{Math.min(...entries.map((e) => e.price)).toFixed(0)}~{Math.max(...entries.map((e) => e.price)).toFixed(0)}
                          </span>
                          {expandedProduct === title ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {expandedProduct === title && (
                        <div className="border-t border-slate-100">
                          <div className="p-4 grid grid-cols-1 gap-2">
                            {entries.sort((a, b) => a.platformName.localeCompare(b.platformName)).map((entry, i) => {
                              const changeInfo = CHANGE_LABELS[entry.change];
                              return (
                                <div key={`${entry.platform}-${entry.market}-${i}`}
                                  className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-white transition-colors border border-transparent hover:border-slate-100"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PLATFORM_COLORS[entry.platform] || "bg-slate-100"}`}>
                                      {entry.platformName}
                                    </span>
                                    <span className="text-xs text-slate-500">{entry.marketName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-semibold text-slate-700">¥{entry.price.toFixed(2)}</span>
                                    {entry.compareAtPrice && entry.compareAtPrice > entry.price && (
                                      <span className="text-xs text-slate-400 line-through">¥{entry.compareAtPrice.toFixed(2)}</span>
                                    )}
                                    <span className={`flex items-center gap-0.5 text-xs font-medium ${changeInfo.color}`}>
                                      {changeInfo.icon}
                                      {entry.change !== "same" && entry.change !== "new" && entry.changePercent
                                        ? `${entry.changePercent}%`
                                        : entry.change === "new" ? "首次" : ""}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageFadeIn>
  );
}
