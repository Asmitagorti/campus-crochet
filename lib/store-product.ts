import { Product } from "./catalog";

type ImageRow = { image_url?: string; display_order?: number };
export type StoreProductRow = {
  product_id?: string;
  slug: string;
  name: string;
  category?: string;
  short_description?: string;
  full_description?: string;
  price?: number;
  stock_quantity?: number | null;
  packed_weight_grams?: number | null;
  is_available?: boolean;
  details?: unknown;
  display_colors?: unknown;
  revision?: number;
  product_images?: ImageRow[];
};

export function mapStoreProduct(row: StoreProductRow): Product {
  const details = Array.isArray(row.details) ? row.details.filter((d): d is [string, string] => Array.isArray(d) && d.length === 2 && d.every((v) => typeof v === "string")) : [];
  return {
    id: row.slug,
    databaseId: row.product_id,
    name: row.name,
    category: row.category || "Accessories",
    note: row.short_description || "",
    description: row.full_description || "",
    price: Number(row.price || 0),
    stock: row.stock_quantity == null ? null : Number(row.stock_quantity),
    packedWeightGrams: row.packed_weight_grams == null ? null : Number(row.packed_weight_grams),
    madeToOrder: false,
    active: row.is_available === true,
    revision: row.revision || 0,
    details,
    colors: Array.isArray(row.display_colors) ? row.display_colors.filter((color): color is string => typeof color === "string") : [],
    gallery: (row.product_images || []).filter((image) => typeof image.image_url === "string").sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((image) => image.image_url!),
  };
}
