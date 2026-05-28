/**
 * 跨平台订单聚合引擎
 * 汇总 Shopify / Lazada / Shopee / TikTok Shop 所有订单
 */
import { ShopifyClient } from "../adapters/shopify/client.js";
import { ShopifyOrderService, ShopifyOrder } from "../adapters/shopify/orders.js";
import { LazadaClient } from "../adapters/lazada/client.js";
import { LazadaOrderService, LazadaOrder } from "../adapters/lazada/orders.js";
import { ShopeeClient } from "../adapters/shopee/client.js";
import { ShopeeOrderService, ShopeeOrder } from "../adapters/shopee/orders.js";
import { TiktokClient } from "../adapters/tiktok/client.js";
import { TiktokOrderService, TiktokOrder } from "../adapters/tiktok/orders.js";

// ── 统一订单类型 ──

export type OrderStatus = "pending" | "ready_to_ship" | "shipped" | "delivered" | "cancelled" | "completed";

export interface UnifiedOrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface UnifiedOrder {
  orderId: string;
  platform: "shopify" | "lazada" | "shopee" | "tiktok";
  market: string;
  storeName: string;
  status: OrderStatus;
  statusLabel: string;
  items: UnifiedOrderItem[];
  totalAmount: number;
  currency: string;
  buyerName: string;
  shippingAddress?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── 凭证类型 ──

export interface ShopifyCredentials {
  storeDomain: string;
  accessToken: string;
  storeName?: string;
}

export interface LazadaCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  market: string;
  storeName?: string;
}

export interface ShopeeCredentials {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  market: string;
  storeName?: string;
}

export interface TiktokCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher?: string;
  market: string;
  storeName?: string;
}

// ── 状态映射 ──

const STATUS_MAP: Record<string, { status: OrderStatus; label: string }> = {
  // Shopify
  pending: { status: "pending", label: "待处理" },
  authorized: { status: "pending", label: "待处理" },
  paid: { status: "ready_to_ship", label: "待发货" },
  fulfilled: { status: "shipped", label: "已发货" },
  partial: { status: "shipped", label: "部分发货" },
  voided: { status: "cancelled", label: "已取消" },
  refunded: { status: "cancelled", label: "已退款" },

  // Lazada
  unpaid: { status: "pending", label: "待付款" },
  ready_to_ship: { status: "ready_to_ship", label: "待发货" },
  delivered: { status: "delivered", label: "已签收" },
  returned: { status: "cancelled", label: "已退货" },
  canceled: { status: "cancelled", label: "已取消" },
  failed: { status: "cancelled", label: "失败" },

  // Shopee (unpaid/ready_to_ship 复用 Lazada 的同名键)
  processed: { status: "ready_to_ship", label: "待发货" },
  shipped: { status: "shipped", label: "已发货" },
  completed: { status: "completed", label: "已完成" },
  cancelled: { status: "cancelled", label: "已取消" },
  in_cancel: { status: "cancelled", label: "取消中" },

  // TikTok (unpaid 复用 Lazada 的同名键)
  on_hold: { status: "pending", label: "待处理" },
};

// ── 转换函数 ──

function toOrderStatus(raw: string): { status: OrderStatus; label: string } {
  const key = raw?.toLowerCase?.() ?? "";
  return STATUS_MAP[key] ?? { status: "pending", label: key || "未知" };
}

function normalizeShopifyOrder(o: ShopifyOrder, storeName: string, market: string): UnifiedOrder {
  const st = o.fulfillment_status ? toOrderStatus(o.fulfillment_status) : { status: "pending" as OrderStatus, label: o.financial_status };
  return {
    orderId: String(o.id),
    platform: "shopify",
    market,
    storeName,
    status: st.status,
    statusLabel: st.label,
    items: (o.line_items ?? []).map((li) => ({
      name: li.title,
      sku: li.sku ?? "",
      quantity: li.quantity,
      price: parseFloat(li.price),
    })),
    totalAmount: parseFloat(o.total_price),
    currency: o.currency,
    buyerName: o.shipping_address?.name ?? o.email ?? "",
    shippingAddress: o.shipping_address
      ? `${o.shipping_address.address1}, ${o.shipping_address.city}, ${o.shipping_address.country}`
      : undefined,
    trackingNumber: o.tracking_number,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

function normalizeLazadaOrder(o: LazadaOrder, storeName: string, market: string): UnifiedOrder {
  const rawStatus = o.statuses?.[0] ?? o.status ?? "";
  const st = toOrderStatus(rawStatus);
  return {
    orderId: String(o.order_id),
    platform: "lazada",
    market,
    storeName,
    status: st.status,
    statusLabel: st.label,
    items: (o.order_items ?? []).map((oi) => ({
      name: oi.name,
      sku: oi.sku,
      quantity: oi.quantity,
      price: parseFloat(oi.paid_price),
      imageUrl: oi.product_main_image,
    })),
    totalAmount: parseFloat(o.price),
    currency: "",
    buyerName: [o.customer_first_name, o.customer_last_name].filter(Boolean).join(" ") || "",
    shippingAddress: o.address_shipping
      ? `${o.address_shipping.address1}, ${o.address_shipping.city}, ${o.address_shipping.country}`
      : undefined,
    trackingNumber: o.awb || o.tracking_code,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

function normalizeShopeeOrder(o: ShopeeOrder, storeName: string, market: string): UnifiedOrder {
  const st = toOrderStatus(o.order_status);
  return {
    orderId: o.order_sn,
    platform: "shopee",
    market,
    storeName,
    status: st.status,
    statusLabel: st.label,
    items: (o.items ?? []).map((oi) => ({
      name: oi.item_name,
      sku: oi.model_sku ?? oi.item_sku,
      quantity: oi.quantity,
      price: oi.deal_price,
    })),
    totalAmount: o.total_amount,
    currency: o.currency,
    buyerName: o.recipient_address?.name ?? o.buyer_username ?? "",
    shippingAddress: o.recipient_address?.full_address,
    trackingNumber: o.tracking_number,
    createdAt: new Date(o.order_creation_date * 1000).toISOString(),
    updatedAt: new Date(o.update_time * 1000).toISOString(),
  };
}

function normalizeTiktokOrder(o: TiktokOrder, storeName: string, market: string): UnifiedOrder {
  const st = toOrderStatus(o.order_status);
  return {
    orderId: o.order_id,
    platform: "tiktok",
    market,
    storeName,
    status: st.status,
    statusLabel: st.label,
    items: (o.items ?? []).map((oi) => ({
      name: oi.product_name,
      sku: oi.seller_sku,
      quantity: oi.quantity,
      price: oi.price?.amount ?? 0,
      imageUrl: oi.main_image?.url,
    })),
    totalAmount: o.total_amount,
    currency: o.currency,
    buyerName: o.buyer_name ?? "",
    shippingAddress: o.shipping_address?.full_address,
    trackingNumber: o.tracking_number,
    createdAt: new Date(o.create_time * 1000).toISOString(),
    updatedAt: new Date(o.update_time * 1000).toISOString(),
  };
}

// ── 聚合引擎 ──

export interface OrderFetchParams {
  status?: "pending" | "ready_to_ship" | "shipped" | "delivered" | "completed" | "cancelled";
  limit?: number;
}

export interface OrderFetchResult {
  orders: UnifiedOrder[];
  stats: {
    total: number;
    pending: number;
    readyToShip: number;
    shipped: number;
    completed: number;
    cancelled: number;
  };
}

export async function getAllOrders(
  connections: {
    shopify?: ShopifyCredentials[];
    lazada?: LazadaCredentials[];
    shopee?: ShopeeCredentials[];
    tiktok?: TiktokCredentials[];
  },
  params: OrderFetchParams = {}
): Promise<OrderFetchResult> {
  const fetchers: Promise<UnifiedOrder[]>[] = [];

  // Shopify
  for (const cred of connections.shopify ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new ShopifyClient({ storeDomain: cred.storeDomain, accessToken: cred.accessToken });
          const svc = new ShopifyOrderService(client);
          const status = params.status === "ready_to_ship" ? "open" : params.status === "shipped" ? "any" : "any";
          const ffStatus = params.status === "shipped" ? "shipped" : params.status === "ready_to_ship" ? "unshipped" : "any";
          const orders = await svc.listOrders({ status, fulfillmentStatus: ffStatus, limit: params.limit ?? 30 });
          return orders.map((o) => normalizeShopifyOrder(o, cred.storeName ?? "Shopify", "global"));
        } catch {
          return [];
        }
      })()
    );
  }

  // Lazada
  for (const cred of connections.lazada ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new LazadaClient({ appKey: cred.appKey, appSecret: cred.appSecret, accessToken: cred.accessToken, market: cred.market as any });
          const svc = new LazadaOrderService(client);
          const status = params.status && params.status !== "completed" ? params.status as any : undefined;
          const orders = await svc.listOrders({ status, limit: params.limit ?? 30 });
          return orders.map((o) => normalizeLazadaOrder(o, cred.storeName ?? `Lazada ${cred.market.toUpperCase()}`, cred.market));
        } catch {
          return [];
        }
      })()
    );
  }

  // Shopee
  for (const cred of connections.shopee ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new ShopeeClient({ partnerId: cred.partnerId, partnerKey: cred.partnerKey, shopId: cred.shopId, accessToken: cred.accessToken, market: cred.market as any });
          const svc = new ShopeeOrderService(client);
          const statusMap: Record<string, string> = { pending: "UNPAID", ready_to_ship: "READY_TO_SHIP", shipped: "SHIPPED", completed: "COMPLETED", cancelled: "CANCELLED" };
          const orderStatus = params.status ? statusMap[params.status] as any : undefined;
          const result = await svc.listOrders({ orderStatus, pageSize: params.limit ?? 30 });
          return result.orders.map((o) => normalizeShopeeOrder(o, cred.storeName ?? `Shopee ${cred.market.toUpperCase()}`, cred.market));
        } catch {
          return [];
        }
      })()
    );
  }

  // TikTok Shop
  for (const cred of connections.tiktok ?? []) {
    fetchers.push(
      (async () => {
        try {
          const client = new TiktokClient({ appKey: cred.appKey, appSecret: cred.appSecret, accessToken: cred.accessToken, shopCipher: cred.shopCipher, market: cred.market as any });
          const svc = new TiktokOrderService(client);
          const statusMap: Record<string, string> = { pending: "UNPAID", ready_to_ship: "READY_TO_SHIP", shipped: "SHIPPED", delivered: "DELIVERED", completed: "COMPLETED", cancelled: "CANCELLED" };
          const status = params.status ? statusMap[params.status] : undefined;
          const result = await svc.listOrders({ status, pageSize: params.limit ?? 30 });
          return result.orders.map((o) => normalizeTiktokOrder(o, cred.storeName ?? `TikTok ${cred.market.toUpperCase()}`, cred.market));
        } catch {
          return [];
        }
      })()
    );
  }

  const results = await Promise.all(fetchers);
  const allOrders = results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const countByStatus = (status: OrderStatus) => allOrders.filter((o) => o.status === status).length;

  return {
    orders: allOrders,
    stats: {
      total: allOrders.length,
      pending: countByStatus("pending"),
      readyToShip: countByStatus("ready_to_ship"),
      shipped: countByStatus("shipped"),
      completed: countByStatus("completed"),
      cancelled: countByStatus("cancelled"),
    },
  };
}

export { ShopifyOrderService, LazadaOrderService, ShopeeOrderService, TiktokOrderService };
