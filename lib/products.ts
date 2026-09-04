import { supabase } from "./supabase";
import type { Product, ProductWithImages } from "@/types";

type DbProduct = {
  product_id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  price: number | string;
  stock_quantity: number | null;
  processing_time_days: number | null;
  category: string;
  is_available: boolean | null;
  updated_at: string | null;
};

type DbProductWithRelations = DbProduct & {
  product_images?: Array<{
    image_id: string;
    image_url: string;
    display_order: number | null;
  }> | null;
  product_colors?: Array<{
    color_id: string;
    color_name: string;
  }> | null;
};

const SELECT = `
  product_id,
  name,
  short_description,
  full_description,
  price,
  stock_quantity,
  processing_time_days,
  category,
  is_available,
  updated_at,
  product_images ( image_id, image_url, display_order ),
  product_colors ( color_id, color_name )
`;

function toProduct(row: DbProductWithRelations): Product {
  const primaryImage = (row.product_images ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ?? "";

  const colorNames = (row.product_colors ?? []).map((c) => c.color_name);

  const days = row.processing_time_days ?? null;
  const processingTime = days ? `${days}-${days + 2} working days` : undefined;

  return {
    id: row.product_id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    colors: colorNames,
    image: primaryImage,
    description: row.full_description ?? row.short_description ?? "",
    short_description: row.short_description ?? undefined,
    care: undefined,
    stock: row.stock_quantity ?? undefined,
    is_available: row.is_available ?? false,
    featured: false,
    processing_time_days: days ?? undefined,
    processing_time: processingTime,
    updated_at: row.updated_at ?? undefined,
  };
}

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT);

  if (error) {
    console.error("fetchAllProducts error:", error);
    return [];
  }

  return (data ?? []).map((row) => toProduct(row as DbProductWithRelations));
}

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_available", true);

  if (error) {
    console.error("fetchActiveProducts error:", error);
    return [];
  }

  return (data ?? []).map((row) => toProduct(row as DbProductWithRelations));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("product_id", id)
    .maybeSingle();

  if (error) {
    console.error("fetchProductById error:", error);
    return null;
  }

  return data ? toProduct(data as DbProductWithRelations) : null;
}

export async function fetchProductImages(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("image_url, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("fetchProductImages error:", error);
    return [];
  }

  return (data ?? []).map((row) => row.image_url);
}

export async function fetchProductColors(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_colors")
    .select("color_name")
    .eq("product_id", productId);

  if (error) {
    console.error("fetchProductColors error:", error);
    return [];
  }

  return (data ?? []).map((row) => row.color_name);
}