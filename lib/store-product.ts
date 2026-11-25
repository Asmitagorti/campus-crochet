import { Product } from "./catalog";
import { productCategoryNames } from "./product-categories";
import { effectiveProductPrice } from "./pricing";
import { parseColorOptions } from "./personalization";

type ImageRow = { image_url?: string; display_order?: number };
export type StoreProductRow = {
  product_id?: string;
  slug: string;
  name: string;
  category?: string;
  categories?: string[];
  short_description?: string;
  full_description?: string;
  price?: number;
  discount_price?: number | null;
  stock_quantity?: number | null;
  packed_weight_grams?: number | null;
  is_available?: boolean;
  details?: unknown;
  display_colors?: unknown;
  color_options?: unknown;
  revision?: number;
  product_images?: ImageRow[];
};

export function mapStoreProduct(row: StoreProductRow, saleActive = false): Product {
  const details = Array.isArray(row.details) ? row.details.filter((d): d is [string, string] => Array.isArray(d) && d.length === 2 && d.every((v) => typeof v === "string")) : [];
  const categoryNames = productCategoryNames({ category: row.category || "Accessories", categories: row.categories });
  return {
    id: row.slug,
    databaseId: row.product_id,
    name: row.name,
    category: categoryNames[0],
    categories: categoryNames,
    note: row.short_description || "",
    description: row.full_description || "",
    ...effectiveProductPrice(Number(row.price || 0), row.discount_price == null ? null : Number(row.discount_price), saleActive),
    stock: null,
    packedWeightGrams: row.packed_weight_grams == null ? null : Number(row.packed_weight_grams),
    madeToOrder: true,
    active: row.is_available === true,
    revision: row.revision || 0,
    details,
    colors: Array.isArray(row.display_colors) ? row.display_colors.filter((color): color is string => typeof color === "string") : [],
    colorOptions: parseColorOptions(row.color_options ?? []),
    gallery: (row.product_images || []).filter((image) => typeof image.image_url === "string").sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((image) => image.image_url!),
  };
}
