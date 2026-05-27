/**
 * TikTok Shop 商品管理模块
 * 完整上架流程: 类目 → 属性 → 品牌 → 图片 → 创建
 */
import { TiktokClient, TiktokMarketCode, TIKTOK_MARKETS } from "./client.js";

// ── 类型定义 ──

export interface TiktokCategory {
  id: string;
  name: string;
  parent_id: string;
  is_leaf: boolean;
  children?: TiktokCategory[];
}

export interface TiktokAttribute {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "MULTISELECT" | "DATE";
  is_required: boolean;
  is_multiple_selection?: boolean;
  options?: { id: string; name: string }[];
}

export interface TiktokBrand {
  id: string;
  name: string;
}

export interface SkuVariant {
  seller_sku: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  package_weight: number; // kg
  package_height: number; // cm
  package_length: number; // cm
  package_width: number; // cm
}

export interface ProductInput {
  translatedTitle: string;
  description: string;
  categoryId: string;
  brandId?: string;
  imageUrls: string[];
  skus: SkuVariant[];
  attributes?: { id: string; values?: { id: string }[] }[];
}

export interface CreateProductResult {
  product_id: string;
  skus?: { id: string; seller_sku: string }[];
}

export interface TiktokListedProduct {
  productId: string;
  title: string;
  status: string;
  price: number;
  skuCount: number;
  imageUrl?: string;
  stock: number;
}

// ── 产品服务 ──

export class TiktokProductService {
  private client: TiktokClient;
  readonly market: TiktokMarketCode;

  constructor(client: TiktokClient) {
    this.client = client;
    this.market = client.market;
  }

  /** Step 1: 获取类目树 */
  async getCategories(): Promise<TiktokCategory[]> {
    const resp = await this.client.call<{ categories: TiktokCategory[] }>(
      "/api/products/categories",
      { locale: TIKTOK_MARKETS[this.market].lang },
      "GET"
    );
    return resp.categories;
  }

  /** Step 2: 获取类目属性 */
  async getAttributes(categoryId: string): Promise<TiktokAttribute[]> {
    const resp = await this.client.call<{ attributes: TiktokAttribute[] }>(
      "/api/products/attributes",
      { category_id: categoryId, locale: TIKTOK_MARKETS[this.market].lang },
      "GET"
    );
    return resp.attributes;
  }

  /** Step 3: 获取品牌 */
  async getBrands(categoryId: string): Promise<TiktokBrand[]> {
    const resp = await this.client.call<{ brands: TiktokBrand[] }>(
      "/api/products/brands",
      { category_id: categoryId },
      "GET"
    );
    return resp.brands;
  }

  /** Step 4: 上传图片（返回 URL） */
  async uploadImage(imageData: Buffer, filename: string): Promise<string> {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(imageData)]);
    form.append("file", blob, filename);

    const path = "/api/files/upload";
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.client.sign(path, timestamp);

    const resp = await fetch(
      `https://open-api.tiktokglobalshop.com${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.client.config.accessToken}`,
          "x-tts-access-token": this.client.config.accessToken,
          "x-tts-timestamp": String(timestamp),
          "x-tts-sign": sign,
        },
        body: form,
      }
    );

    const json = await resp.json() as { code: number; message?: string; data?: { url?: string } };
    if (json.code !== 0) throw new Error(`TikTok upload error: ${json.message}`);
    return json.data?.url ?? "";
  }

  /** Step 5: 创建商品 */
  async createProduct(input: ProductInput): Promise<CreateProductResult> {
    const payload = {
      title: input.translatedTitle,
      description: input.description,
      category_id: input.categoryId,
      images: input.imageUrls.map((url) => ({ url })),
      ...(input.brandId ? { brand_id: input.brandId } : {}),
      ...(input.attributes?.length
        ? {
            attributes: input.attributes.map((a) => ({
              attribute_id: a.id,
              values: a.values?.map((v) => ({ value_id: v.id })),
            })),
          }
        : {}),
      skus: input.skus.map((sku) => ({
        seller_sku: sku.seller_sku,
        price: { amount: sku.price, currency: TIKTOK_MARKETS[this.market].currency },
        stock: sku.quantity,
        package_dimensions: {
          weight: sku.package_weight,
          height: sku.package_height,
          length: sku.package_length,
          width: sku.package_width,
        },
        ...(sku.color || sku.size
          ? {
              sales_attributes: [
                ...(sku.color
                  ? [{ attribute_name: "颜色", attribute_value: sku.color }]
                  : []),
                ...(sku.size
                  ? [{ attribute_name: "尺寸", attribute_value: sku.size }]
                  : []),
              ],
            }
          : {}),
      })),
    };

    return this.client.call<CreateProductResult>("/api/products", payload);
  }

  /** 获取在售商品列表（价格监控用） */
  async listProducts(page = 1, pageSize = 50): Promise<TiktokListedProduct[]> {
    const resp = await this.client.call<{
      data?: {
        products?: Array<{
          product_id: string;
          title: string;
          status: string;
          skus?: Array<{ price: { amount: number }; stock: number }>;
          main_image?: { url: string };
        }>;
        total?: number;
      };
    }>(
      "/api/products/search",
      { page, page_size: pageSize, status: "ACTIVE" }
    );

    return (resp.data?.products ?? []).map((p) => ({
      productId: p.product_id,
      title: p.title,
      status: p.status,
      price: p.skus?.[0]?.price?.amount ?? 0,
      skuCount: p.skus?.length ?? 0,
      imageUrl: p.main_image?.url,
      stock: p.skus?.reduce((sum, sku) => sum + (sku.stock ?? 0), 0) ?? 0,
    }));
  }

  /**
   * 一键上架
   */
  async quickList(input: Omit<ProductInput, "categoryId" | "imageUrls"> & {
    images: string[];
    imageBuffers?: Buffer[];
    imageNames?: string[];
    categoryId?: string;
  }): Promise<{
    category: TiktokCategory[];
    attributes: TiktokAttribute[];
    brands: TiktokBrand[];
    result: CreateProductResult;
  }> {
    // 1. 获取类目
    const categories = await this.getCategories();

    // 递归查找叶子类目
    const findLeaf = (cats: TiktokCategory[]): string | null => {
      for (const c of cats) {
        if (c.is_leaf) return c.id;
        if (c.children?.length) {
          const found = findLeaf(c.children);
          if (found) return found;
        }
      }
      return null;
    };

    const categoryId =
      input.categoryId ?? findLeaf(categories) ?? categories[0]?.id;
    if (!categoryId) throw new Error("未找到可用类目");

    // 2. 拉取属性
    const attributes = await this.getAttributes(categoryId);
    const mandatoryAttrs = attributes.filter((a) => a.is_required);
    if (mandatoryAttrs.length && !input.attributes?.length) {
      const names = mandatoryAttrs.map((a) => a.name).join(", ");
      throw new Error(`需要提供必填属性: ${names}`);
    }

    // 3. 获取品牌
    const brands = await this.getBrands(categoryId);

    // 4. 上传图片
    const imageUrls: string[] = [...input.images];
    if (input.imageBuffers?.length) {
      for (let i = 0; i < input.imageBuffers.length; i++) {
        const url = await this.uploadImage(
          input.imageBuffers[i],
          input.imageNames?.[i] ?? `product_${i}.jpg`
        );
        imageUrls.push(url);
      }
    }

    // 5. 创建
    const result = await this.createProduct({ ...input, categoryId, imageUrls });

    return { category: categories, attributes, brands, result };
  }
}
