import { supabase } from "@/lib/supabase";
import { getSession, isAdmin } from "@/lib/auth";

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

type ProductImage = { image_id: string; image_url: string; display_order: number | null };
type ProductColor = { color_id: string; color_name: string };
type DbRow = {
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
  product_images?: ProductImage[] | null;
  product_colors?: ProductColor[] | null;
};

function normalize(row: DbRow) {
  const primaryImage = (row.product_images ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ?? "";
  const colorNames = (row.product_colors ?? []).map((c) => c.color_name);
  const days = row.processing_time_days ?? null;

  return {
    id: row.product_id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    description: row.full_description ?? row.short_description ?? "",
    short_description: row.short_description ?? null,
    image: primaryImage,
    image_url: primaryImage,
    stock_quantity: row.stock_quantity ?? null,
    stock: row.stock_quantity ?? null,
    is_available: row.is_available ?? false,
    active: row.is_available ?? false,
    featured: false,
    processing_time_days: days,
    processing_time: days ? `${days}-${days + 2} working days` : null,
    updated_at: row.updated_at ?? null,
    product_images: (row.product_images ?? []).map((img) => ({
      image_id: img.image_id,
      image_url: img.image_url,
      display_order: img.display_order ?? 0,
    })),
    product_colors: (row.product_colors ?? []).map((c) => ({
      color_id: c.color_id,
      color_name: c.color_name,
    })),
  };
}

export async function GET() {
  const session = await getSession();
  const showAll = isAdmin(session);

  let query = supabase
    .from("products")
    .select(SELECT)
    .order("updated_at", { ascending: false });

  if (!showAll) {
    query = query.eq("is_available", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("SUPABASE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((row) => normalize(row as DbRow));
  return Response.json(normalized);
}