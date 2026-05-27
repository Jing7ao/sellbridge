/**
 * TikTok Shop 订单管理模块
 * Reference: https://partner.tiktokshop.com/doc
 */
import { TiktokClient, TIKTOK_MARKETS, TiktokMarketCode } from "./client.js";

export interface TiktokOrderItem {
  sku_id: string;
  product_id: string;
  product_name: string;
  seller_sku: string;
  quantity: number;
  price: { amount: number; currency: string };
  main_image?: { url: string };
}

export interface TiktokOrder {
  order_id: string;
  order_status: string;
  // statuses: UNPAID, ON_HOLD, READY_TO_SHIP, SHIPPED, DELIVERED, COMPLETED, CANCELLED
  create_time: number; // unix timestamp
  update_time: number;
  total_amount: number;
  currency: string;
  item_count?: number;
  items?: TiktokOrderItem[];
  buyer_name?: string;
  buyer_phone?: string;
  shipping_address?: {
    full_address?: string;
    city?: string;
    province?: string;
    country?: string;
    zip_code?: string;
  };
  tracking_number?: string;
  shipping_provider?: string;
  payment_status?: string;
}

export class TiktokOrderService {
  private client: TiktokClient;
  readonly market: TiktokMarketCode;

  constructor(client: TiktokClient) {
    this.client = client;
    this.market = client.market;
  }

  /** 搜索订单列表 */
  async listOrders(params?: {
    status?: string; // UNPAID, READY_TO_SHIP, SHIPPED, DELIVERED, COMPLETED, CANCELLED
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    createTimeFrom?: number;
    createTimeTo?: number;
  }): Promise<{ orders: TiktokOrder[]; total: number }> {
    const payload: Record<string, unknown> = {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 50,
      sort_by: params?.sortBy ?? "create_time",
      sort_direction: params?.sortDirection ?? "DESC",
    };
    if (params?.status) payload.order_status = params.status;
    if (params?.createTimeFrom) payload.create_time_from = params.createTimeFrom;
    if (params?.createTimeTo) payload.create_time_to = params.createTimeTo;

    const resp = await this.client.call<{
      data?: { orders?: TiktokOrder[]; total?: number };
    }>(
      "/api/orders/search",
      payload,
      "POST"
    );

    return {
      orders: resp.data?.orders ?? [],
      total: resp.data?.total ?? 0,
    };
  }

  /** 获取订单详情 */
  async getOrder(orderId: string): Promise<TiktokOrder> {
    const resp = await this.client.call<{
      data?: { order?: TiktokOrder };
    }>(
      "/api/orders/detail",
      { order_id: orderId },
      "POST"
    );
    if (!resp.data?.order) throw new Error(`Order ${orderId} not found`);
    return resp.data.order;
  }

  /** 发货 */
  async shipOrder(
    orderId: string,
    trackingNumber: string,
    providerId: string
  ): Promise<void> {
    await this.client.call("/api/orders/ship", {
      order_id: orderId,
      tracking_number: trackingNumber,
      shipping_provider_id: providerId,
    });
  }

  /** 获取物流商列表 */
  async getShippingProviders(): Promise<{ id: string; name: string }[]> {
    const resp = await this.client.call<{
      data?: { shipping_providers?: { id: string; name: string }[] };
    }>(
      "/api/logistics/shipping_providers",
      { locale: TIKTOK_MARKETS[this.market].lang },
      "GET"
    );
    return resp.data?.shipping_providers ?? [];
  }
}
