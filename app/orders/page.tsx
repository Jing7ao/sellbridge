"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Truck, CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { PageFadeIn, StaggerChildren, StaggerItem } from "../../components/animations";

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  orderId: string;
  platform: "shopify" | "lazada" | "shopee" | "tiktok";
  market: string;
  storeName: string;
  status: "pending" | "ready_to_ship" | "shipped" | "delivered" | "completed" | "cancelled";
  statusLabel: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  buyerName: string;
  shippingAddress?: string;
  trackingNumber?: string;
  createdAt: string;
}

interface OrderStats {
  total: number;
  pending: number;
  readyToShip: number;
  shipped: number;
  completed: number;
  cancelled: number;
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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ready_to_ship: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_TABS = [
  { key: "", label: "全部", icon: Package },
  { key: "pending", label: "待付款", icon: Clock },
  { key: "ready_to_ship", label: "待发货", icon: Package },
  { key: "shipped", label: "已发货", icon: Truck },
  { key: "completed", label: "已完成", icon: CheckCircle2 },
  { key: "cancelled", label: "已取消", icon: XCircle },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<{ reason: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setBlocked(null);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set("status", activeTab);
      const resp = await fetch(`/api/orders?${params.toString()}`);
      const data = await resp.json();
      if (data.blocked) {
        setBlocked({ reason: data.reason, message: data.message });
        setOrders([]);
        setStats(null);
      } else if (data.error) {
        toast.error(data.error);
      } else {
        setOrders(data.orders ?? []);
        setStats(data.stats ?? null);
      }
    } catch {
      toast.error("获取订单失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <PageFadeIn className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">订单汇总</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">跨平台订单汇总查看</p>
        </div>
        <button onClick={fetchOrders} disabled={loading} className="btn-ghost gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StaggerItem>
            <StatCard label="全部" value={stats.total} color="slate" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="待付款" value={stats.pending} color="yellow" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="待发货" value={stats.readyToShip} color="blue" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="已发货" value={stats.shipped} color="indigo" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="已完成" value={stats.completed} color="green" />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="已取消" value={stats.cancelled} color="red" />
          </StaggerItem>
        </StaggerChildren>
      )}

      {/* 状态 Tab */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {STATUS_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 订单列表 */}
      {blocked ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">{blocked.message}</p>
          <p className="text-sm text-slate-400 mt-1">
            请先在
            <a href="/settings" className="text-indigo-500 hover:underline mx-1">店铺设置</a>
            中连接店铺，即可查看各平台订单
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-xl h-20" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState hasConnections={!!stats} activeTab={activeTab} />
      ) : (
        <div className="space-y-2">
          {orders.map((order, idx) => {
            const isOpen = expanded.has(order.orderId);
            return (
              <div
                key={order.orderId}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden shadow-sm"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                {/* 主行 */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(order.orderId)}
                >
                  <button className="p-0.5 text-slate-400">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PLATFORM_COLORS[order.platform]}`}>
                    {PLATFORM_LABELS[order.platform]}
                  </span>

                  <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                    {order.market.toUpperCase()}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {order.buyerName || order.orderId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-400">{order.items.length} 件商品</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.statusLabel}
                  </span>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {(order.currency ? `${order.currency} ` : "") + order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>

                {/* 展开详情 */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-50 dark:border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">商品明细</h4>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{item.name}</p>
                                <p className="text-xs text-slate-400">SKU: {item.sku} × {item.quantity}</p>
                              </div>
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {item.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">订单信息</h4>
                        <dl className="space-y-1.5 text-sm">
                          <div className="flex gap-2">
                            <dt className="text-slate-400 shrink-0">订单号：</dt>
                            <dd className="text-slate-600 dark:text-slate-300 font-mono text-xs">{order.orderId}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-slate-400 shrink-0">买家：</dt>
                            <dd className="text-slate-600 dark:text-slate-300">{order.buyerName || "-"}</dd>
                          </div>
                          {order.shippingAddress && (
                            <div className="flex gap-2">
                              <dt className="text-slate-400 shrink-0">地址：</dt>
                              <dd className="text-slate-600 dark:text-slate-300">{order.shippingAddress}</dd>
                            </div>
                          )}
                          {order.trackingNumber && (
                            <div className="flex gap-2">
                              <dt className="text-slate-400 shrink-0">物流单号：</dt>
                              <dd className="text-slate-600 dark:text-slate-300 font-mono">{order.trackingNumber}</dd>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <dt className="text-slate-400 shrink-0">店铺：</dt>
                            <dd className="text-slate-600 dark:text-slate-300">{order.storeName}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageFadeIn>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    slate: "text-slate-700 dark:text-slate-200",
    yellow: "text-yellow-700 dark:text-yellow-400",
    blue: "text-blue-700 dark:text-blue-400",
    indigo: "text-indigo-700 dark:text-indigo-400",
    green: "text-green-700 dark:text-green-400",
    red: "text-red-700 dark:text-red-400",
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-center shadow-sm">
      <p className={`text-lg font-bold ${colorMap[color] ?? "text-slate-700"}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState({ hasConnections, activeTab }: { hasConnections: boolean; activeTab: string }) {
  if (!hasConnections) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">暂无店铺连接</p>
        <p className="text-sm text-slate-400 mt-1">
          请先在
          <a href="/settings" className="text-indigo-500 hover:underline mx-1">店铺设置</a>
          中连接店铺，即可查看各平台订单
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-16">
      <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-500 dark:text-slate-400 font-medium">
        {activeTab ? "该状态下暂无订单" : "暂无订单"}
      </p>
      <p className="text-sm text-slate-400 mt-1">订单将按平台自动同步显示</p>
    </div>
  );
}
