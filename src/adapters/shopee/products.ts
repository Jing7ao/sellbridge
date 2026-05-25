/**
 * Shopee 商品管理模块
 * 完整上架流程: 类目 → 属性 → 品牌 → 图片 → 物流 → 创建
 */
import { ShopeeClient, ShopeeMarketCode, SHOPEE_MARKETS } from "./client.js";

// ── 类型定义 ──

export interface ShopeeCategory {
  category_id: number;
  parent_category_id: number;
  original_category_name: string;
  display_category_name: string;
  has_children: boolean;
}

export interface ShopeeAttribute {
  attribute_id: number;
  original_attribute_name: string;
  display_attribute_name: string;
  is_mandatory: boolean;
  attribute_type: "STRING" | "INT" | "FLOAT" | "ENUM" | "TIMESTAMP" | "DATE";
  attribute_value_list?: {
    value_id: number;
    original_value_name: string;
    display_value_name: string;
  }[];
}

export interface ShopeeBrand {
  brand_id: number;
  original_brand_name: string;
  display_brand_name: string;
}

export interface ShopeeLogistics {
  logistics_channel_id: number;
  logistics_channel_name: string;
  enabled: boolean;
  cod_enabled: boolean;
}

export interface SkuVariant {
  seller_sku: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  original_price?: number;
  package_weight: number; // kg
  package_height: number; // cm
  package_length: number; // cm
  package_width: number; // cm
}

export interface ProductInput {
  translatedTitle: string;
  description: string;
  categoryId: number;
  brandId?: number;
  imageIds: string[]; // 已上传到 Shopee 的 image_id 列表
  skus: SkuVariant[];
  attributes?: { attribute_id: number; attribute_value_list?: { value_id: number }[] }[];
}

export interface CreateProductResult {
  item_id: number;
  shop_category_id?: number;
}

// ── 产品服务 ──

export class ShopeeProductService {
  private client: ShopeeClient;
  readonly market: ShopeeMarketCode;

  constructor(client: ShopeeClient) {
    this.client = client;
    this.market = client.market;
  }

  /** Step 1: 获取类目列表 */
  async getCategories(): Promise<ShopeeCategory[]> {
    const resp = await this.client.call<{ category_list: ShopeeCategory[] }>(
      "/api/v2/product/get_category",
      { language: SHOPEE_MARKETS[this.market].lang }
    );
    return resp.category_list;
  }

  /** Step 2: 获取类目属性 */
  async getAttributes(categoryId: number): Promise<ShopeeAttribute[]> {
    const resp = await this.client.call<{ attribute_list: ShopeeAttribute[] }>(
      "/api/v2/product/get_attributes",
      { category_id: categoryId, language: SHOPEE_MARKETS[this.market].lang }
    );
    return resp.attribute_list;
  }

  /** Step 3: 获取品牌列表 */
  async getBrands(categoryId: number): Promise<ShopeeBrand[]> {
    const pageSize = 100;
    let offset = 0;
    let hasNext = true;
    const brands: ShopeeBrand[] = [];

    while (hasNext) {
      const resp = await this.client.call<{
        brand_list: ShopeeBrand[];
        has_next_page: boolean;
      }>("/api/v2/product/get_brand_list", {
        category_id: categoryId,
        offset,
        page_size: pageSize,
        status: 1, // 仅可用品牌
      });
      brands.push(...(resp.brand_list ?? []));
      hasNext = resp.has_next_page;
      offset += pageSize;
    }

    return brands;
  }

  /** Step 4: 上传图片到 Shopee CDN（通过 URL） */
  async uploadImage(imageUrl: string): Promise<string> {
    const resp = await this.client.call<{ image_info: { image_id: string } }>(
      "/api/v2/media_space/upload_image",
      { image_url: imageUrl }
    );
    return resp.image_info?.image_id ?? "";
  }

  /** Step 5: 获取物流渠道 */
  async getLogistics(): Promise<ShopeeLogistics[]> {
    const resp = await this.client.call<{ logistics_channel_list: ShopeeLogistics[] }>(
      "/api/v2/logistics/get_channel_list"
    );
    return resp.logistics_channel_list;
  }

  /** Step 6: 创建商品 */
  async createProduct(input: ProductInput): Promise<CreateProductResult> {
    const payload: Record<string, unknown> = {
      original_price: input.skus[0]?.original_price ?? input.skus[0]?.price ?? 0,
      price: Math.min(...input.skus.map((s) => s.price)),
      category_id: input.categoryId,
      item_name: input.translatedTitle,
      description: input.description,
      ...(input.brandId ? { brand: { brand_id: input.brandId } } : {}),
      image: { image_id_list: input.imageIds },
      ...(input.attributes?.length
        ? { attribute_list: input.attributes }
        : {}),
      item_sku: input.skus.map((sku) => ({
        seller_sku: sku.seller_sku,
        ...(sku.color || sku.size
          ? {
              variations: {
                ...(sku.color ? { color: sku.color } : {}),
                ...(sku.size ? { size: sku.size } : {}),
              },
            }
          : {}),
        price: sku.price,
        stock: sku.quantity,
        item_weight: sku.package_weight,
        package_height: sku.package_height,
        package_length: sku.package_length,
        package_width: sku.package_width,
      })),
      weight: input.skus[0]?.package_weight ?? 0,
      package_height: input.skus[0]?.package_height ?? 0,
      package_length: input.skus[0]?.package_length ?? 0,
      package_width: input.skus[0]?.package_width ?? 0,
    };

    return this.client.call<CreateProductResult>(
      "/api/v2/product/add_item",
      payload
    );
  }

  /**
   * 一键上架：执行完整流程
   */
  async quickList(input: Omit<ProductInput, "categoryId" | "imageIds"> & {
    images: string[];
    categoryId?: number;
  }): Promise<{
    category: ShopeeCategory[];
    attributes: ShopeeAttribute[];
    brands: ShopeeBrand[];
    result: CreateProductResult;
  }> {
    // 1. 获取类目
    const categories = await this.getCategories();
    if (!categories.length) throw new Error("未获取到类目列表");

    // 如果没有指定类目，取第一个叶子类目（实际需根据标题匹配）
    const categoryId = input.categoryId ?? (() => {
      const leaves = categories.filter((c) => !c.has_children);
      return leaves[0]?.category_id ?? categories[0]?.category_id;
    })();

    if (!categoryId) throw new Error("未找到可用类目");

    // 2. 拉取属性
    const attributes = await this.getAttributes(categoryId);
    const mandatoryAttrs = attributes.filter((a) => a.is_mandatory);
    if (mandatoryAttrs.length && !input.attributes?.length) {
      const names = mandatoryAttrs
        .slice(0, 5)
        .map((a) => a.display_attribute_name)
        .join(", ");
      throw new Error(`需要提供 ${mandatoryAttrs.length} 个必填属性: ${names}...`);
    }

    // 3. 获取品牌
    const brands = await this.getBrands(categoryId);

    // 4. 上传图片
    const imageIds: string[] = [];
    for (const url of input.images) {
      const id = await this.uploadImage(url);
      imageIds.push(id);
    }

    // 5. 创建商品
    const result = await this.createProduct({ ...input, categoryId, imageIds });

    return { category: categories, attributes, brands, result };
  }
}
