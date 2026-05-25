/**
 * Lazada 商品管理模块
 * 完整上架流程: 类目 → 属性 → 品牌 → 图片 → 创建
 */
import { LazadaClient, MarketCode, LAZADA_MARKETS } from "./client.js";

// ── 类型定义 ──

export interface CategorySuggestion {
  categoryId: number;
  categoryName: string;
  categoryPath: string;
}

export interface CategoryAttribute {
  name: string;
  label: string;
  isMandatory: boolean;
  inputType: "text" | "singleSelect" | "multiSelect" | "numeric" | "richText";
  options?: { name: string; id: string }[];
}

export interface Brand {
  brandId: number;
  brandName: string;
}

export interface SkuVariant {
  sellerSku: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  specialPrice?: number;
  packageWeight: number; // kg
  packageHeight: number; // cm
  packageLength: number; // cm
  packageWidth: number; // cm
}

export interface ProductInput {
  /** 中文商品名称（会翻译为各站点语言） */
  title: string;
  /** 各站点语言标题（如果已有翻译） */
  translatedTitle?: string;
  description?: string;
  categoryId: number;
  brandId?: number;
  images: string[]; // 图片 URL（需先上传到 Lazada CDN）
  skus: SkuVariant[];
  /** 各站点自定义属性 */
  attributes?: Record<string, string>;
}

export interface CreateProductResult {
  itemId: number;
  skuList: { shopSku: string; sellerSku: string; skuId: number }[];
}

// ── 产品服务 ──

export class LazadaProductService {
  private client: LazadaClient;
  readonly market: MarketCode;
  readonly marketInfo: (typeof LAZADA_MARKETS)[MarketCode];

  constructor(client: LazadaClient) {
    this.client = client;
    this.market = (client as any).config?.market ?? "my";
    this.marketInfo = LAZADA_MARKETS[this.market];
  }

  /** Step 1: 根据标题推荐类目 */
  async suggestCategory(title: string): Promise<CategorySuggestion[]> {
    return this.client.call<{ categorySuggestions: CategorySuggestion[] }>(
      "/product/category/suggestion/get",
      { title }
    ).then((d) => d.categorySuggestions ?? []);
  }

  /** Step 2: 获取类目下所有属性 */
  async getAttributes(categoryId: number): Promise<CategoryAttribute[]> {
    return this.client.call<{ attributes: CategoryAttribute[] }>(
      "/category/attributes/get",
      { primary_category_id: categoryId }
    ).then((d) => d.attributes ?? []);
  }

  /** Step 3: 获取品牌列表 */
  async getBrands(startIndex = 0, pageSize = 50): Promise<Brand[]> {
    return this.client.call<{ brands: Brand[] }>(
      "/category/brands/query",
      { start_index: startIndex, page_size: pageSize }
    ).then((d) => d.brands ?? []);
  }

  /** Step 4: 上传单张图片到 Lazada CDN */
  async uploadImage(imageUrl: string): Promise<string> {
    // Lazada 要求图片先迁到其 CDN
    // 实际调用: POST /image/migrate
    return this.client.call<{ image: { url: string } }>(
      "/image/migrate",
      { image: imageUrl },
      "POST"
    ).then((d) => d.image?.url ?? "");
  }

  /** Step 5: 创建商品 */
  async createProduct(input: ProductInput): Promise<CreateProductResult> {
    const payload: Record<string, unknown> = {
      Product: {
        PrimaryCategory: String(input.categoryId),
        Images: { Image: input.images },
        Attributes: {
          name: input.translatedTitle || input.title,
          ...(input.description ? { description: input.description } : {}),
          ...(input.brandId ? { brand_id: String(input.brandId) } : {}),
          ...(input.attributes ?? {}),
        },
        Skus: {
          Sku: input.skus.map((sku) => ({
            SellerSku: sku.sellerSku,
            quantity: String(sku.quantity),
            price: String(sku.price),
            ...(sku.specialPrice ? { special_price: String(sku.specialPrice) } : {}),
            package_weight: String(sku.packageWeight),
            package_height: String(sku.packageHeight),
            package_length: String(sku.packageLength),
            package_width: String(sku.packageWidth),
            ...(sku.color || sku.size
              ? {
                  saleProp: {
                    ...(sku.color ? { color_family: sku.color } : {}),
                    ...(sku.size ? { size: sku.size } : {}),
                  },
                }
              : {}),
          })),
        },
      },
    };

    return this.client.call<CreateProductResult>(
      "/product/create",
      { Request: JSON.stringify(payload) },
      "POST"
    );
  }

  /**
   * 一键上架：执行完整流程
   * 类目推荐 → 属性拉取 → 品牌查找 → 创建
   */
  async quickList(input: ProductInput): Promise<{
    category: CategorySuggestion[];
    attributes: CategoryAttribute[];
    result: CreateProductResult;
  }> {
    // 1. 推荐类目
    const category = await this.suggestCategory(input.title);
    if (!category.length) throw new Error("未找到匹配类目，请手动指定 categoryId");

    // 2. 拉取属性
    const attrs = await this.getAttributes(input.categoryId);
    const missing = attrs
      .filter((a) => a.isMandatory)
      .filter((a) => !input.attributes || !(a.name in (input.attributes ?? {})));
    if (missing.length) {
      throw new Error(
        `缺少必填属性: ${missing.map((a) => `${a.label}(${a.name})`).join(", ")}`
      );
    }

    // 3. 查找品牌（如果有品牌属性需要）
    if (!input.brandId && attrs.some((a) => a.name === "brand_id" && a.isMandatory)) {
      const brands = await this.getBrands();
      throw new Error(
        `该站点需要品牌。可用品牌: ${brands.slice(0, 5).map((b) => `${b.brandName}(id:${b.brandId})`).join(", ")}...`
      );
    }

    // 4. 创建
    const result = await this.createProduct(input);
    return { category, attributes: attrs, result };
  }
}
