import { requireUser } from "@/lib/supabase-admin";
import { loadSavedCheckoutDetails } from "@/lib/saved-checkout";
import { errorResponse } from "@/lib/forms";
import { requireShoppingMode } from "@/lib/site-mode";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireShoppingMode();
    const user = await requireUser(request);
    const details = await loadSavedCheckoutDetails(user.uid);
    return Response.json({ details }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
