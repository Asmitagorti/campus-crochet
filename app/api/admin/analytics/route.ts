import { requireAdminAccess } from "@/lib/admin-access";
import { adminDatabase } from "@/lib/supabase-admin";
import { errorResponse } from "@/lib/forms";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdminAccess(request);
    const { data, error } = await adminDatabase().rpc("site_analytics_summary");
    if (error) throw error;
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 403); }
}
