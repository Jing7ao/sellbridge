/**
 * Lazada 订单管理模块
 * Reference: https://open.lazada.com/doc/doc.htm
 */
import { LazadaClient } from "./client.js";

export interface LazadaOrderItem {
  order_item_id: number;
  name: string;
  sku: string;
  item_price: string;
  paid_price: string;
  quantity: number;
  product_main_image?: string;
}

export interface LazadaOrder {
  order_id: number;
  order_number: string;
  statuses: string[]; // pending, ready_to_ship, delivered, returned, failed, canceled
  status: string;
  created_at: string;
  updated_at: string;
  price: string;
  items_count: number;
  order_items?: LazadaOrderItem[];
  customer_first_name?: string;
  customer_last_name?: string;
  address_shipping?: {
    country: string;
    address1: string;
    city: string;
    phone: string;
    post_code: string;
  };
  awb?: string; // tracking number
  tracking_code?: string;
  shipping_provider_type?: string;
  branch_number?: string;
}

export class LazadaOrderService {
  private client: LazadaClient;

  constructor(client: LazadaClient) {
    this.client = client;
  }

  /** 获取订单列表 */
  async listOrders(params?: {
    status?: "pending" | "ready_to_ship" | "shipped" | "delivered" | "canceled" | "returned" | "failed";
    offset?: number;
    limit?: number;
    createdAfter?: string; // ISO date
    createdBefore?: string;
    updateAfter?: string;
    updateBefore?: string;
  }): Promise<LazadaOrder[]> {
    const query: Record<string, string | number | undefined> = {
      offset: params?.offset ?? 0,
      limit: params?.limit ?? 50,
    };
    if (params?.status) query.status = params.status;
    if (params?.createdAfter) query.created_after = params.createdAfter;
    if (params?.createdBefore) query.created_before = params.createdBefore;
    if (params?.updateAfter) query.update_after = params.updateAfter;
    if (params?.updateBefore) query.update_before = params.updateBefore;

    const resp = await this.client.call<{ orders: LazadaOrder[] }>(
      "/orders/get",
      query,
      "GET"
    );
    return resp.orders ?? [];
  }

  /** 获取单个订单详情 */
  async getOrder(orderId: number): Promise<LazadaOrder> {
    const resp = await this.client.call<{ orders: LazadaOrder[] }>(
      "/order/get",
      { order_id: orderId }
    );
    if (!resp.orders?.length) throw new Error(`Order ${orderId} not found`);
    return resp.orders[0];
  }

  /** 批量获取订单详情（含商品明细） */
  async getOrders(orderIds: number[]): Promise<LazadaOrder[]> {
    const resp = await this.client.call<{ orders: LazadaOrder[] }>(
      "/orders/get",
      { order_ids: `[${orderIds.join(",")}]` },
      "GET"
    );
    return resp.orders ?? [];
  }

  /** 标记订单为已发货 */
  async setReadyToShip(orderItemIds: number[], shippingProvider?: string, trackingNumber?: string): Promise<void> {
    await this.client.call(
      "/order/rts",
      {
        order_item_ids: `[${orderItemIds.join(",")}]`,
        ...(shippingProvider ? { shipping_provider: shippingProvider } : {}),
        ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
      },
      "POST"
    );
  }

  /** 获取物流追踪信息 */
  async getAwb(orderId: number): Promise<string> {
    const resp = await this.client.call<{ awb: string }>(
      "/order/awb/document/get",
      { order_id: String(orderId) }
    );
    return resp.awb ?? "";
  }
}
