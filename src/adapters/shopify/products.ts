/**
 * Shopify 商品管理模块
 *
 * 对比 Lazada/Shopee，Shopify 的上架流程极简：
 *   商品信息 → 直接 POST /products.json → 完成
 *   无需：类目预查 / 属性预拉 / 品牌预查 / 图片预上传
 */
import { ShopifyClient, ShopifyMarketCode, SHOPIFY_MARKETS } from "./client.js";

// ── 类型定义 ──

export interface ShopifyImage {
  id?: number;
  src: string; // 直接填 URL
  position?: number;
  alt?: string;
}

export interface ShopifyVariant {
  id?: number;
  title?: string;
  sku: string;
  price: string;       // Shopify 价格用字符串
  compare_at_price?: string;
  inventory_quantity: number;
  weight: number;       // kg
  weight_unit?: "kg" | "g" | "lb" | "oz";
  option1?: string;     // 如颜色
  option2?: string;     // 如尺寸
  option3?: string;
}

export interface ProductInput {
  /** 翻译后的标题 */
  translatedTitle: string;
  /** HTML 描述 */
  descriptionHtml: string;
  /** 供应商/品牌名 */
  vendor?: string;
  /** 商品类型（类目） */
  productType?: string;
  /** 标签 */
  tags?: string[];
  /** 图片列表（直接 URL，无需预先上传） */
  images: string[];
  /** SKU 变体 */
  variants: {
    sellerSku: string;
    color?: string;
    size?: string;
    price: number;
    compareAtPrice?: number;
    quantity: number;
    weight: number;
    weightUnit?: "kg" | "g";
  }[];
}

export interface CreateProductResult {
  id: number;
  title: string;
  handle: string;
  status: string;
  variants: { id: number; sku: string; price: string; compare_at_price?: string; inventory_quantity?: number; title?: string }[];
  images: { id: number; src: string }[];
}

// ── 产品服务 ──

export class ShopifyProductService {
  private client: ShopifyClient;

  constructor(client: ShopifyClient) {
    this.client = client;
  }

  /** 创建商品（一步到位，不需要预先上传图片或查询类目） */
  async createProduct(input: ProductInput): Promise<CreateProductResult> {
    const images = input.images.map((img, i) => {
      if (img.startsWith("data:image/")) {
        const [header, data] = img.split(",");
        const mimeMatch = header.match(/data:(image\/\w+);base64/);
        const ext = mimeMatch ? mimeMatch[1].split("/")[1] : "png";
        return { attachment: data, filename: `product-${i + 1}.${ext}`, position: i + 1 };
      }
      return { src: img, position: i + 1 };
    });

    const payload = {
      product: {
        title: input.translatedTitle,
        body_html: input.descriptionHtml,
        vendor: input.vendor ?? "SellBridge",
        product_type: input.productType ?? "",
        tags: (input.tags ?? []).join(", "),
        status: "active",
        images,
        variants: input.variants.map((v) => ({
          sku: v.sellerSku,
          price: v.price.toFixed(2),
          compare_at_price: v.compareAtPrice?.toFixed(2),
          inventory_quantity: v.quantity,
          weight: v.weight,
          weight_unit: v.weightUnit ?? "kg",
          ...(v.color ? { option1: v.color } : {}),
          ...(v.size
            ? v.color
              ? { option2: v.size }
              : { option1: v.size }
            : {}),
        })),
      },
    };

    return this.client.call<CreateProductResult>(
      "/products.json",
      payload,
      "POST"
    );
  }

  /** 获取所有商品列表 */
  async listProducts(limit = 50): Promise<CreateProductResult[]> {
    return this.client.call<CreateProductResult[]>(
      "/products.json",
      { limit },
      "GET"
    );
  }

  /** 更新商品 */
  async updateProduct(
    id: number,
    updates: Partial<ProductInput>
  ): Promise<CreateProductResult> {
    const payload: Record<string, unknown> = { id };

    if (updates.translatedTitle) payload.title = updates.translatedTitle;
    if (updates.descriptionHtml) payload.body_html = updates.descriptionHtml;
    if (updates.vendor) payload.vendor = updates.vendor;
    if (updates.tags) payload.tags = updates.tags.join(", ");
    if (updates.images?.length) {
      payload.images = updates.images.map((src, i) => ({
        src,
        position: i + 1,
      }));
    }

    return this.client.call<CreateProductResult>(
      `/products/${id}.json`,
      { product: payload },
      "PUT"
    );
  }

  /**
   * 一键上架（Shopify 版本——极其简短）
   */
  async quickList(input: ProductInput): Promise<{
    result: CreateProductResult;
  }> {
    const result = await this.createProduct(input);
    return { result };
  }
}
