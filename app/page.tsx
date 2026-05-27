"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Trash2, Globe, Send, CheckCircle, XCircle, Loader2,
  ImagePlus, Package, Tag, Sparkles, Ruler, List, AlertTriangle, Info,
} from "lucide-react";
import { PageFadeIn, FadeInUp } from "../components/animations";

const CATEGORIES = [
  "手机及配件", "电脑及办公", "消费电子", "家电",
  "服饰鞋包", "美妆个护", "母婴用品", "家居生活",
  "运动户外", "食品饮料", "汽车用品", "玩具爱好",
] as const;

const MARKETS = [
  { code: "th", name: "泰国", flag: "🇹🇭", currency: "THB" },
  { code: "vn", name: "越南", flag: "🇻🇳", currency: "VND" },
  { code: "id", name: "印尼", flag: "🇮🇩", currency: "IDR" },
  { code: "my", name: "马来西亚", flag: "🇲🇾", currency: "MYR" },
  { code: "ph", name: "菲律宾", flag: "🇵🇭", currency: "PHP" },
  { code: "sg", name: "新加坡", flag: "🇸🇬", currency: "SGD" },
] as const;

const PLATFORMS = [
  { code: "shopify", name: "Shopify", icon: "🟢", desc: "全球独立站 · 0门槛可测" },
  { code: "lazada", name: "Lazada", icon: "🟠", desc: "阿里系东南亚电商" },
  { code: "shopee", name: "Shopee", icon: "🟡", desc: "腾讯系东南亚电商" },
  { code: "tiktok", name: "TikTok Shop", icon: "⚫", desc: "字节系社交电商" },
] as const;

interface ListingResult {
  market: string;
  marketName: string;
  platform?: string;
  platformName?: string;
  translation: { title: string; description?: string; keywords: string[] };
  itemId?: number | string;
  error?: string;
  success: boolean;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set(["th", "vn"]));
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(["shopify"]));
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState({ price: "99.00", quantity: "100", weight: "0.5", length: "10", width: "10", height: "10" });
  const [imageFiles, setImageFiles] = useState<{ preview: string; base64: string }[]>([]);
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ListingResult[] | null>(null);
  const [compliance, setCompliance] = useState<{
    warnings: { type: string; severity: string; message: string; market: string; detail?: string; lawRef?: string }[];
    exportWarnings: { type: string; severity: string; message: string; market: string; detail?: string; lawRef?: string }[];
    exportLaws: { law: string; summary: string }[];
    tariffs: { market: string; label: string; acftaRate: string; mfnRate: string; vatRate: string; deMinimis: string; sensitiveCategories: { category: string; rate: string }[]; note: string }[];
    formENote: { title: string; body: string };
  } | null>(null);
  const [checkingCompliance, setCheckingCompliance] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [results]);

  const toggleMarket = (code: string) => {
    const next = new Set(selectedMarkets);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedMarkets(next);
  };

  const togglePlatform = (code: string) => {
    const next = new Set(selectedPlatforms);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelectedPlatforms(next);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImageFiles((prev) => [
          ...prev,
          { preview: reader.result as string, base64: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setResults(null);

    try {
      const resp = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          markets: Array.from(selectedMarkets),
          platforms: Array.from(selectedPlatforms),
          category,
          price: parseFloat(sku.price),
          quantity: parseInt(sku.quantity),
          weight: parseFloat(sku.weight),
          packageLength: parseFloat(sku.length) || 10,
          packageWidth: parseFloat(sku.width) || 10,
          packageHeight: parseFloat(sku.height) || 10,
          images: imageFiles.map((f) => f.base64),
          keywords: keywords.split(/[,，、\s]+/).filter(Boolean),
        }),
      });

      const data = await resp.json();
      setResults(data.results);

      try {
        const stored = localStorage.getItem("listing_history");
        const history = stored ? JSON.parse(stored) : [];
        history.unshift({
          id: data.historyId ?? crypto.randomUUID(),
          title,
          markets: Array.from(selectedMarkets),
          platforms: Array.from(selectedPlatforms),
          results: data.results,
          timestamp: data.timestamp,
          translationMode: data.translationMode || "mock",
        });
        localStorage.setItem("listing_history", JSON.stringify(history.slice(0, 50)));
      } catch { /* ignore */ }
    } catch (err) {
      setResults([
        { market: "*", marketName: "请求失败", success: false, error: String(err), translation: { title: "", keywords: [] } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stepNum = (n: number) => (
    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-500/25">
      {n}
    </span>
  );

  return (
    <PageFadeIn className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      {/* 欢迎横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 mb-8 shadow-xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{getGreeting()}，准备上架新品</h2>
            <p className="text-white/70 text-sm mt-0.5">
              已选 {selectedMarkets.size} 市场 · {selectedPlatforms.size} 平台
            </p>
          </div>
        </div>
      </div>

      {/* 步骤 1: 商品信息 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5 animate-fade-in-up">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2.5">
          {stepNum(1)}
          商品信息
          <span className="text-xs font-normal text-slate-400 ml-1">（输入中文，自动翻译为对应市场语言）</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              商品名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：无线蓝牙耳机 TWS-500 ANC主动降噪"
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">商品描述</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="材质、功能、规格、适用场景..."
              className="input-modern resize-none"
            />
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              商品图片 <span className="text-slate-400 font-normal text-xs">（本地上传）</span>
            </label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {imageFiles.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.preview}
                    alt={`预览 ${i + 1}`}
                    className="w-full h-28 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-all h-28">
                <ImagePlus className="w-6 h-6 text-slate-300 mb-1" />
                <span className="text-xs text-slate-400">
                  {imageFiles.length === 0 ? "点击上传" : "添加更多"}
                </span>
                <input
                  type="file" accept="image/*" multiple
                  onChange={handleImageSelect} className="hidden"
                />
              </label>
            </div>
            {imageFiles.length > 0 && (
              <p className="text-xs text-slate-400">已选择 {imageFiles.length} 张，悬停可删除</p>
            )}
          </div>

          {/* 品类选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <List className="w-3.5 h-3.5 inline mr-1" />
              商品品类 <span className="text-slate-400 font-normal text-xs">（必选，匹配各平台分类）</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-modern bg-white"
            >
              <option value="">-- 请选择品类 --</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 关键词 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              商品关键词 <span className="text-slate-400 font-normal text-xs">（逗号分隔，帮助 SEO）</span>
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="蓝牙耳机, 降噪, 无线, TWS, ANC"
              className="input-modern"
            />
          </div>

          {/* SKU + 尺寸 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">价格 (CNY)</label>
              <input
                type="number" value={sku.price}
                onChange={(e) => setSku({ ...sku, price: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">库存</label>
              <input
                type="number" value={sku.quantity}
                onChange={(e) => setSku({ ...sku, quantity: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">重量 (kg)</label>
              <input
                type="number" value={sku.weight}
                onChange={(e) => setSku({ ...sku, weight: e.target.value })}
                className="input-modern"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Ruler className="w-3.5 h-3.5 inline mr-1" />
                长 (cm)
              </label>
              <input
                type="number" value={sku.length}
                onChange={(e) => setSku({ ...sku, length: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">宽 (cm)</label>
              <input
                type="number" value={sku.width}
                onChange={(e) => setSku({ ...sku, width: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">高 (cm)</label>
              <input
                type="number" value={sku.height}
                onChange={(e) => setSku({ ...sku, height: e.target.value })}
                className="input-modern"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 步骤 2: 市场选择 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5 animate-fade-in-up stagger-1">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2.5">
          {stepNum(2)}
          选择目标市场
          <span className="text-xs font-normal text-slate-400 ml-auto">
            {selectedMarkets.size}/6 已选
          </span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {MARKETS.map((m) => {
            const sel = selectedMarkets.has(m.code);
            return (
              <button
                key={m.code}
                onClick={() => toggleMarket(m.code)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                  sel
                    ? "border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/10"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <span className="text-2xl">{m.flag}</span>
                <div>
                  <div className="font-medium text-sm text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.currency}</div>
                </div>
                {sel && <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 步骤 3: 平台选择 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 animate-fade-in-up stagger-2">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2.5">
          {stepNum(3)}
          选择上架平台
          <span className="text-xs font-normal text-slate-400 ml-auto">
            {selectedPlatforms.size}/4 已选
          </span>
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PLATFORMS.map((p) => {
            const sel = selectedPlatforms.has(p.code);
            return (
              <button
                key={p.code}
                onClick={() => togglePlatform(p.code)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  sel
                    ? "border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/10 scale-[1.02]"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <div className="font-medium text-sm text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-400 text-center">{p.desc}</div>
                {sel && <CheckCircle className="w-4 h-4 text-indigo-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 步骤 4: 合规检查 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 animate-fade-in-up stagger-3">
        <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2.5">
          {stepNum(4)}
          合规检查
          <span className="text-xs font-normal text-slate-400">商标 · 禁售品类 · 市场准入 · 出口管制 · 关税预估</span>
        </h3>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400">
            {compliance
              ? `上次检查: ${new Date().toLocaleTimeString("zh-CN")}`
              : !title.trim()
              ? "输入商品标题后点击检查"
              : selectedMarkets.size === 0
              ? "请先选择目标市场"
              : "检查商品是否存在合规风险"}
          </p>
          <button
            onClick={async () => {
              setCheckingCompliance(true);
              try {
                const resp = await fetch("/api/compliance", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title,
                    description,
                    category,
                    markets: Array.from(selectedMarkets),
                  }),
                });
                const data = await resp.json();
                setCompliance(data);
              } catch { /* ignore */ }
              finally { setCheckingCompliance(false); }
            }}
            disabled={checkingCompliance || !title.trim() || selectedMarkets.size === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {checkingCompliance ? "检查中..." : compliance ? "重新检查" : "点击检查"}
          </button>
        </div>

          {/* 目标市场合规警告 */}
          {compliance && compliance.warnings.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-semibold text-slate-500">目标市场风险</p>
              {compliance.warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm border ${
                    w.severity === "high"
                      ? "bg-red-50 border-red-100 text-red-800"
                      : w.severity === "medium"
                      ? "bg-amber-50 border-amber-100 text-amber-800"
                      : "bg-blue-50 border-blue-100 text-blue-700"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    w.severity === "high" ? "text-red-500" : w.severity === "medium" ? "text-amber-500" : "text-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{w.message}</p>
                    {w.detail && <p className="text-xs opacity-75 mt-0.5">{w.detail}</p>}
                    {w.lawRef && <p className="text-xs mt-1 opacity-50">法规依据: {w.lawRef}</p>}
                    <p className="text-xs mt-0.5 opacity-60">涉及市场: {w.market}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 中国出口端合规警告 */}
          {compliance && compliance.exportWarnings?.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-semibold text-orange-600">中国出口端风险</p>
              {compliance.exportWarnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm border ${
                    w.severity === "high"
                      ? "bg-orange-50 border-orange-200 text-orange-800"
                      : w.severity === "medium"
                      ? "bg-amber-50 border-amber-100 text-amber-800"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    w.severity === "high" ? "text-orange-500" : w.severity === "medium" ? "text-amber-500" : "text-slate-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{w.message}</p>
                    {w.detail && <p className="text-xs opacity-75 mt-0.5">{w.detail}</p>}
                    {w.lawRef && <p className="text-xs mt-1 opacity-50">法规依据: {w.lawRef}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 关税信息：Form E 突出展示 */}
          {compliance && compliance.tariffs && compliance.tariffs.length > 0 && (
            <div className="space-y-2 mb-3">
              {/* Form E 提醒 — 始终可见 */}
              {compliance.formENote && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm border bg-green-50 border-green-200 text-green-800">
                  <Info className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{compliance.formENote.title}</p>
                    <p className="text-xs opacity-75 mt-0.5">{compliance.formENote.body}</p>
                  </div>
                </div>
              )}

              {/* 关税表 + 敏感品类 — 折叠区，默认关闭 */}
              <details>
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-500">查看各市场关税明细（ACFTA / MFN / 增值税 / 敏感品类）</summary>
                <div className="mt-2 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5">
                          <th className="border border-slate-200 dark:border-white/10 p-1.5 text-left font-medium">市场</th>
                          <th className="border border-slate-200 dark:border-white/10 p-1.5 text-left font-medium">ACFTA 税率</th>
                          <th className="border border-slate-200 dark:border-white/10 p-1.5 text-left font-medium">无 Form E</th>
                          <th className="border border-slate-200 dark:border-white/10 p-1.5 text-left font-medium">增值税</th>
                          <th className="border border-slate-200 dark:border-white/10 p-1.5 text-left font-medium">免税额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compliance.tariffs.map((t) => (
                          <tr key={t.market}>
                            <td className="border border-slate-200 dark:border-white/10 p-1.5 font-medium">{t.label}</td>
                            <td className="border border-slate-200 dark:border-white/10 p-1.5 text-emerald-700">{t.acftaRate}</td>
                            <td className="border border-slate-200 dark:border-white/10 p-1.5 text-red-600">{t.mfnRate}</td>
                            <td className="border border-slate-200 dark:border-white/10 p-1.5">{t.vatRate}</td>
                            <td className="border border-slate-200 dark:border-white/10 p-1.5">{t.deMinimis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {compliance.tariffs.map((t) => (
                    <div key={`sens-${t.market}`} className="text-xs">
                      <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">{t.label} 敏感品类</p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {t.sensitiveCategories.map((sc) => (
                          <div key={sc.category} className="px-2 py-1 bg-slate-50 dark:bg-white/5 rounded flex justify-between">
                            <span className="text-slate-500">{sc.category}</span>
                            <span className="text-slate-600 font-medium">{sc.rate}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-slate-400 mt-0.5 italic">{t.note}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* 相关法规速查 */}
          {compliance && compliance.exportLaws && compliance.exportLaws.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-500">涉及的中国出口法规速查（共 {compliance.exportLaws.length} 部）</summary>
              <div className="mt-2 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                {compliance.exportLaws.map((l, i) => (
                  <div key={i} className="text-xs px-2 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{l.law}</span>
                    <span className="text-slate-400"> — {l.summary}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* 全部通过 */}
          {compliance && compliance.warnings?.length === 0 && (!compliance.exportWarnings || compliance.exportWarnings.length === 0) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              未发现明显风险（本检查仅供参考，不构成法律意见）
            </div>
          )}

          {!compliance && (
            <p className="text-xs text-slate-400">
              输入商品标题后点击检查按钮，检测商标、禁售品类、中国出口管制、目标市场准入及关税风险
            </p>
          )}
        </div>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={loading || !title.trim() || selectedMarkets.size === 0 || selectedPlatforms.size === 0}
        className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-300 text-sm ${
          loading
            ? "bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse"
            : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            正在翻译并上架...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            一键上架到 {selectedPlatforms.size} 平台 × {selectedMarkets.size} 市场
          </>
        )}
      </button>

      {/* 结果展示 */}
      {results && (
        <div ref={resultsRef} className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 scroll-mt-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800">上架结果</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              results.every((r) => r.success)
                ? "bg-emerald-100 text-emerald-700"
                : results.some((r) => r.success)
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}>
              {results.filter((r) => r.success).length}/{results.length} 成功
            </span>
          </div>

          <div className="space-y-2.5">
            {results.map((r, idx) => (
              <div
                key={`${r.platform ?? ""}-${r.market}-${idx}`}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 transition-all ${
                  r.success
                    ? "bg-emerald-50/50 border-l-emerald-500 border border-emerald-100"
                    : "bg-red-50/50 border-l-red-500 border border-red-100"
                }`}
              >
                {r.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800">
                    {r.platformName && (
                      <span className="text-slate-400 mr-1">[{r.platformName}]</span>
                    )}
                    {r.marketName} {r.success ? `· ID: ${r.itemId}` : "· 失败"}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {r.translation?.title || r.error}
                  </div>
                  {r.translation?.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.translation.keywords.slice(0, 5).map((kw: string) => (
                        <span key={kw} className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-full text-xs text-slate-500">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
