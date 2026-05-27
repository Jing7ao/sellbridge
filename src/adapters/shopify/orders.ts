/**
 * Shopify 订单管理模块
 * Reference: https://shopify.dev/docs/api/admin-rest/2024-01/resources/order
 */
import { ShopifyClient } from "./client.js";

export interface ShopifyOrderItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string; // e.g. "#1001"
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  financial_status: string; // pending, paid, refunded, voided
  fulfillment_status: string | null; // null, pending, fulfilled, partial
  line_items: ShopifyOrderItem[];
  shipping_address?: {
    name: string;
    address1: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
  tracking_number?: string;
  tracking_url?: string;
  tracking_company?: string;
  note?: string;
}

export class ShopifyOrderService {
  private client: ShopifyClient;

  constructor(client: ShopifyClient) {
    this.client = client;
  }

  /** 获取订单列表 */
  async listOrders(params?: {
    status?: "open" | "closed" | "any";
    fulfillmentStatus?: "shipped" | "partial" | "unshipped" | "any";
    limit?: number;
    sinceId?: number;
    createdAtMin?: string;
    createdAtMax?: string;
  }): Promise<ShopifyOrder[]> {
    const query: Record<string, unknown> = {
      limit: params?.limit ?? 50,
      status: params?.status ?? "any",
    };
    if (params?.fulfillmentStatus && params.fulfillmentStatus !== "any") {
      query.fulfillment_status = params.fulfillmentStatus;
    }
    if (params?.createdAtMin) query.created_at_min = params.createdAtMin;
    if (params?.createdAtMax) query.created_at_max = params.createdAtMax;

    return this.client.call<ShopifyOrder[]>("/orders.json", query, "GET");
  }

  /** 获取单个订单 */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    return this.client.call<ShopifyOrder>(`/orders/${orderId}.json`, undefined, "GET");
  }

  /** 更新订单发货状态 (添加 tracking info 会自动标记为 fulfilled) */
  async fulfillOrder(
    orderId: number,
    tracking: { number: string; company?: string; url?: string }
  ): Promise<ShopifyOrder> {
    const payload = {
      fulfillment: {
        tracking_number: tracking.number,
        tracking_company: tracking.company,
        tracking_url: tracking.url,
        notify_customer: true,
      },
    };
    return this.client.call<ShopifyOrder>(
      `/orders/${orderId}/fulfillments.json`,
      payload,
      "POST"
    );
  }
}
