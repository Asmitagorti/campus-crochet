import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images (
        image_id,
        image_url,
        display_order
      ),
      product_colors (
        color_id,
        color_name
      )
    `);

  if (error) {
    console.error("SUPABASE ERROR:", error);

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}