"use client";

import { useState, useEffect, useCallback } from "react";
import { Store, Plus, Trash2, RefreshCw, Link2, Key, Globe, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

interface StoreConnection {
  id: string;
  platform: string;
  market: string;
  storeName: string;
  status: string;
  createdAt: string;
}

const PLATFORM_BRANDS: Record<string, { name: string; icon: string; borderColor: string; bgClass: string }> = {
  shopify: { name: "Shopify", icon: "🟢", borderColor: "border-l-emerald-500", bgClass: "from-emerald-500 to-emerald-600" },
  lazada: { name: "Lazada", icon: "🟠", borderColor: "border-l-orange-500", bgClass: "from-orange-500 to-orange-600" },
  shopee: { name: "Shopee", icon: "🟡", borderColor: "border-l-amber-500", bgClass: "from-amber-500 to-amber-600" },
  tiktok: { name: "TikTok Shop", icon: "⚫", borderColor: "border-l-slate-700", bgClass: "from-slate-700 to-slate-800" },
};

type PlatformCode = "shopify" | "lazada" | "shopee" | "tiktok";

const PLATFORM_TABS: { code: PlatformCode; name: string; icon: string; desc: string; bgClass: string }[] = [
  { code: "shopify", name: "Shopify", icon: "🟢", desc: "全球独立站 · 0门槛可测", bgClass: "from-emerald-500 to-emerald-600" },
  { code: "lazada", name: "Lazada", icon: "🟠", desc: "阿里系东南亚电商", bgClass: "from-orange-500 to-orange-600" },
  { code: "shopee", name: "Shopee", icon: "🟡", desc: "腾讯系东南亚电商", bgClass: "from-amber-500 to-amber-600" },
  { code: "tiktok", name: "TikTok Shop", icon: "⚫", desc: "字节系社交电商", bgClass: "from-slate-700 to-slate-800" },
];

const MARKETS = [
  { code: "th", name: "泰国" },
  { code: "vn", name: "越南" },
  { code: "id", name: "印尼" },
  { code: "my", name: "马来西亚" },
  { code: "ph", name: "菲律宾" },
  { code: "sg", name: "新加坡" },
] as const;

// ── Shopify 表单 ──
function ShopifyForm({ onSuccess }: { onSuccess: () => void }) {
  const [storeDomain, setStoreDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setConnecting(true);
    try {
      const res = await fetch("/api/connect/shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeDomain, accessToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "连接失败"); }
      else {
        setSuccess(`已连接 ${data.connection?.storeName || storeDomain}`);
        setStoreDomain(""); setAccessToken("");
        onSuccess();
      }
    } catch { setError("连接失败，请稍后再试"); }
    finally { setConnecting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">商店域名</label>
        <div className="relative">
          <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={storeDomain} onChange={(e) => setStoreDomain(e.target.value)} required
            placeholder="my-store.myshopify.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Access Token</label>
        <div className="relative">
          <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required
            placeholder="shpat_xxxxxxxxxxxx"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">Shopify Admin → Settings → Apps and sales channels → Develop apps</p>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">{success}</p>}
      <button type="submit" disabled={connecting || !storeDomain || !accessToken}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
        {connecting ? <><RefreshCw className="w-4 h-4 animate-spin" />验证中...</> : <><Plus className="w-4 h-4" />连接 Shopify</>}
      </button>
    </form>
  );
}

// ── Lazada 表单 ──
function LazadaForm({ onSuccess }: { onSuccess: () => void }) {
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [market, setMarket] = useState("sg");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setConnecting(true);
    try {
      const res = await fetch("/api/connect/lazada", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appKey, appSecret, accessToken, market }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "连接失败"); }
      else {
        setSuccess(`已连接 ${data.connection?.storeName || "Lazada"}`);
        setAppKey(""); setAppSecret(""); setAccessToken("");
        onSuccess();
      }
    } catch { setError("连接失败，请稍后再试"); }
    finally { setConnecting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">App Key</label>
        <div className="relative">
          <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={appKey} onChange={(e) => setAppKey(e.target.value)} required
            placeholder="从 Lazada Open Platform 获取"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">App Secret</label>
        <div className="relative">
          <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} required
            placeholder="从 Lazada Open Platform 获取"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
        <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required
          placeholder="卖家授权后获取的 Access Token"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">市场</label>
        <select value={market} onChange={(e) => setMarket(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all bg-white">
          {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">Lazada Open Platform: https://open.lazada.com</p>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">{success}</p>}
      <button type="submit" disabled={connecting || !appKey || !appSecret || !accessToken}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
        {connecting ? <><RefreshCw className="w-4 h-4 animate-spin" />验证中...</> : <><Plus className="w-4 h-4" />连接 Lazada</>}
      </button>
    </form>
  );
}

// ── Shopee 表单 ──
function ShopeeForm({ onSuccess }: { onSuccess: () => void }) {
  const [partnerId, setPartnerId] = useState("");
  const [partnerKey, setPartnerKey] = useState("");
  const [shopId, setShopId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [market, setMarket] = useState("sg");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setConnecting(true);
    try {
      const res = await fetch("/api/connect/shopee", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId, partnerKey, shopId, accessToken, market }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "连接失败"); }
      else {
        setSuccess(`已连接 ${data.connection?.storeName || "Shopee"}`);
        setPartnerId(""); setPartnerKey(""); setShopId(""); setAccessToken("");
        onSuccess();
      }
    } catch { setError("连接失败，请稍后再试"); }
    finally { setConnecting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Partner ID</label>
          <input type="number" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required
            placeholder="从 Shopee Open Platform 获取"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Shop ID</label>
          <input type="number" value={shopId} onChange={(e) => setShopId(e.target.value)} required
            placeholder="你的 Shopee 店铺 ID"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Partner Key</label>
        <input type="password" value={partnerKey} onChange={(e) => setPartnerKey(e.target.value)} required
          placeholder="从 Shopee Open Platform 获取"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
        <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required
          placeholder="OAuth 授权后获取的 Access Token"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">市场</label>
        <select value={market} onChange={(e) => setMarket(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all bg-white">
          {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">Shopee Open Platform: https://open.shopee.com</p>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">{success}</p>}
      <button type="submit" disabled={connecting || !partnerId || !partnerKey || !shopId || !accessToken}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
        {connecting ? <><RefreshCw className="w-4 h-4 animate-spin" />验证中...</> : <><Plus className="w-4 h-4" />连接 Shopee</>}
      </button>
    </form>
  );
}

// ── TikTok Shop 表单 ──
function TiktokForm({ onSuccess }: { onSuccess: () => void }) {
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [shopCipher, setShopCipher] = useState("");
  const [market, setMarket] = useState("sg");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setConnecting(true);
    try {
      const res = await fetch("/api/connect/tiktok", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appKey, appSecret, accessToken, shopCipher: shopCipher || undefined, market }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "连接失败"); }
      else {
        setSuccess(`已连接 ${data.connection?.storeName || "TikTok Shop"}`);
        setAppKey(""); setAppSecret(""); setAccessToken(""); setShopCipher("");
        onSuccess();
      }
    } catch { setError("连接失败，请稍后再试"); }
    finally { setConnecting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">App Key</label>
          <input type="text" value={appKey} onChange={(e) => setAppKey(e.target.value)} required
            placeholder="从 TikTok Shop Partner Center 获取"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">App Secret</label>
          <input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} required
            placeholder="从 TikTok Shop Partner Center 获取"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Token</label>
        <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required
          placeholder="OAuth 2.0 授权后获取的 Bearer Token"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Shop Cipher <span className="text-slate-400 font-normal text-xs">（可选，部分 API 需要）</span>
        </label>
        <input type="text" value={shopCipher} onChange={(e) => setShopCipher(e.target.value)}
          placeholder="店铺加密 ID"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">市场</label>
        <select value={market} onChange={(e) => setMarket(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all bg-white">
          {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">TikTok Shop Partner Center: https://partner.tiktokshop.com</p>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">{success}</p>}
      <button type="submit" disabled={connecting || !appKey || !appSecret || !accessToken}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
        {connecting ? <><RefreshCw className="w-4 h-4 animate-spin" />验证中...</> : <><Plus className="w-4 h-4" />连接 TikTok Shop</>}
      </button>
    </form>
  );
}

// ── 主页面 ──
export default function SettingsPage() {
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const [activePlatform, setActivePlatform] = useState<PlatformCode>("shopify");

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.connections);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  async function handleDisconnect(id: string) {
    try {
      const res = await fetch(`/api/stores?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchStores();
    } catch { setError("断开连接失败"); }
  }

  const grouped = stores.reduce<Record<string, StoreConnection[]>>((acc, s) => {
    (acc[s.platform] ??= []).push(s);
    return acc;
  }, {});

  const brand = PLATFORM_TABS.find((t) => t.code === activePlatform)!;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">店铺设置</h1>
        <p className="text-sm text-slate-400">管理你的电商平台连接</p>
      </div>

      {/* 连接新店铺 */}
      <section className="mb-8">
        <button
          onClick={() => setShowConnect(!showConnect)}
          className="w-full flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">连接新店铺</p>
              <p className="text-xs text-white/60">Shopify / Lazada / Shopee / TikTok Shop</p>
            </div>
          </div>
          {showConnect ? <ChevronUp className="w-5 h-5 text-white/80" /> : <ChevronDown className="w-5 h-5 text-white/60" />}
        </button>

        {showConnect && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up">
            {/* 平台选择 Tab */}
            <div className="grid grid-cols-4 gap-2 p-1.5 mx-4 mt-4 rounded-xl">
              {PLATFORM_TABS.map((tab) => {
                const isActive = activePlatform === tab.code;
                const colors: Record<string, string> = {
                  shopify: "bg-emerald-500 text-white",
                  lazada: "bg-orange-500 text-white",
                  shopee: "bg-amber-500 text-white",
                  tiktok: "bg-slate-700 text-white",
                };
                const activeColors: Record<string, string> = {
                  shopify: "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300",
                  lazada: "bg-orange-600 text-white shadow-md ring-2 ring-orange-300",
                  shopee: "bg-amber-600 text-white shadow-md ring-2 ring-amber-300",
                  tiktok: "bg-slate-800 text-white shadow-md ring-2 ring-slate-400",
                };
                return (
                <button
                  key={tab.code}
                  onClick={() => setActivePlatform(tab.code)}
                  className={`py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    isActive ? activeColors[tab.code] : colors[tab.code]
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
                );
              })}
            </div>

            {/* 对应平台的连接表单 */}
            <div className={`p-6 border-l-4 ${
              activePlatform === "shopify" ? "border-l-emerald-500" :
              activePlatform === "lazada" ? "border-l-orange-500" :
              activePlatform === "shopee" ? "border-l-amber-500" :
              "border-l-slate-700"
            }`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${brand.bgClass} flex items-center justify-center text-sm shadow-md`}>
                  {brand.icon}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800">{brand.name}</span>
                  <p className="text-xs text-slate-400">{brand.desc}</p>
                </div>
              </div>

              {activePlatform === "shopify" && <ShopifyForm onSuccess={fetchStores} />}
              {activePlatform === "lazada" && <LazadaForm onSuccess={fetchStores} />}
              {activePlatform === "shopee" && <ShopeeForm onSuccess={fetchStores} />}
              {activePlatform === "tiktok" && <TiktokForm onSuccess={fetchStores} />}
            </div>
          </div>
        )}
      </section>

      {/* 已连接店铺 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          已连接的店铺
        </h2>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="h-4 rounded-lg skeleton-shimmer w-1/3 mb-2" />
                <div className="h-3 rounded-lg skeleton-shimmer w-1/2" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Store className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">暂无已连接的店铺</p>
            <p className="text-xs text-slate-400 mt-1">点击上方「连接新店铺」开始连接你的电商平台</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([platform, items]) => {
              const brand = PLATFORM_BRANDS[platform] ?? PLATFORM_BRANDS.shopify;
              return (
                <div key={platform} className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-l-4 ${brand.borderColor}`}>
                  <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${brand.bgClass} flex items-center justify-center text-white text-sm`}>
                      {brand.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{brand.name}</span>
                    <span className="text-xs text-slate-400">({items.length})</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {items.map((s) => (
                      <div key={s.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            {s.market.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{s.storeName || s.market.toUpperCase()}</p>
                            <p className="text-xs text-slate-400">
                              市场: {s.market.toUpperCase()} · 状态:{" "}
                              <span className={s.status === "active" ? "text-emerald-500 font-medium" : "text-slate-400"}>
                                {s.status === "active" ? "正常" : s.status}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnect(s.id)}
                          className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="断开连接"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {error && <p className="mt-4 text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
    </div>
  );
}
