/**
 * Shopee 订单管理模块
 * Reference: https://open.shopee.com/documents
 */
import { ShopeeClient } from "./client.js";

export interface ShopeeOrderItem {
  item_id: number;
  item_name: string;
  item_sku: string;
  model_name?: string;
  model_sku?: string;
  quantity: number;
  original_price: number;
  deal_price: number;
}

export interface ShopeeOrder {
  order_sn: string;
  order_status: string;
  // Shopee statuses: UNPAID, READY_TO_SHIP, PROCESSED, SHIPPED, COMPLETED, CANCELLED, IN_CANCEL
  order_creation_date: number; // unix timestamp
  update_time: number;
  total_amount: number;
  currency: string;
  item_count: number;
  items?: ShopeeOrderItem[];
  buyer_username?: string;
  recipient_address?: {
    name: string;
    phone: string;
    town: string;
    district: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    full_address: string;
  };
  shipping_carrier?: string;
  tracking_number?: string;
  actual_shipping_cost?: number;
  pay_time?: number;
}

export class ShopeeOrderService {
  private client: ShopeeClient;

  constructor(client: ShopeeClient) {
    this.client = client;
  }

  /** 获取订单列表 */
  async listOrders(params?: {
    orderStatus?:
      | "UNPAID"
      | "READY_TO_SHIP"
      | "PROCESSED"
      | "SHIPPED"
      | "COMPLETED"
      | "CANCELLED"
      | "IN_CANCEL";
    pageSize?: number;
    cursor?: string; // pagination cursor
    timeRangeField?: "create_time" | "update_time";
    timeFrom?: number;
    timeTo?: number;
  }): Promise<{
    orders: ShopeeOrder[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const payload: Record<string, unknown> = {
      page_size: params?.pageSize ?? 50,
      time_range_field: params?.timeRangeField ?? "create_time",
      time_from: params?.timeFrom ?? Math.floor(Date.now() / 1000) - 30 * 24 * 3600,
      time_to: params?.timeTo ?? Math.floor(Date.now() / 1000),
    };
    if (params?.orderStatus) payload.order_status = params.orderStatus;
    if (params?.cursor) payload.cursor = params.cursor;

    const resp = await this.client.call<{
      response?: {
        order_list?: ShopeeOrder[];
        more?: boolean;
        next_cursor?: string;
      };
    }>(
      "/api/v2/order/get_order_list",
      payload
    );

    return {
      orders: resp.response?.order_list ?? [],
      hasMore: resp.response?.more ?? false,
      nextCursor: resp.response?.next_cursor,
    };
  }

  /** 获取订单详情 */
  async getOrder(orderSn: string): Promise<ShopeeOrder> {
    const resp = await this.client.call<{
      response?: { order_list?: ShopeeOrder[] };
    }>(
      "/api/v2/order/get_order_detail",
      { order_sn_list: orderSn }
    );
    const list = resp.response?.order_list ?? [];
    if (!list.length) throw new Error(`Order ${orderSn} not found`);
    return list[0];
  }

  /** 批量获取订单详情（含商品明细） */
  async getOrders(orderSns: string[]): Promise<ShopeeOrder[]> {
    const resp = await this.client.call<{
      response?: { order_list?: ShopeeOrder[] };
    }>(
      "/api/v2/order/get_order_detail",
      { order_sn_list: orderSns.join(","), response_optional_fields: "item_list,total_amount,recipient_address" }
    );
    return resp.response?.order_list ?? [];
  }

  /** 发货 */
  async shipOrder(
    orderSn: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<void> {
    await this.client.call("/api/v2/logistics/ship_order", {
      order_sn: orderSn,
      tracking_number: trackingNumber,
      ...(carrier ? { shipping_carrier: carrier } : {}),
    });
  }

  /** 取消订单 */
  async cancelOrder(
    orderSn: string,
    reason: string,
    reasonDetail?: string
  ): Promise<void> {
    await this.client.call("/api/v2/order/cancel_order", {
      order_sn: orderSn,
      cancel_reason: reason,
      ...(reasonDetail ? { cancel_reason_detail: reasonDetail } : {}),
    });
  }
}
