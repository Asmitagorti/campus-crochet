import { adminDatabase } from "@/lib/supabase-admin";
import { requireAdminAccess } from "@/lib/admin-access";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminAccess(request);
    await guard(request, 40);
    const body = await readJsonBody(request);
    if (typeof body.destinationPin !== "string" || !/^[1-9]\d{5}$/.test(body.destinationPin))
      throw Error("Enter a valid six-digit destination PIN.");
    if (!Number.isInteger(body.maxWeightGrams) || body.maxWeightGrams < 1 || body.maxWeightGrams > 50000)
      throw Error("Enter a valid maximum packed weight in grams.");
    if (!Number.isInteger(body.postagePaise) || body.postagePaise < 1 || body.postagePaise > 1000000)
      throw Error("Enter the full payable India Post quote, including tax.");
    if (body.active === true && body.verified !== true)
      throw Error("Confirm that you checked this payable quote in India Post's calculator.");
    const { error } = await adminDatabase().from("delivery_rates").upsert({
      destination_pin: body.destinationPin,
      max_weight_grams: body.maxWeightGrams,
      postage_paise: body.postagePaise,
      active: body.active === true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "destination_pin,max_weight_grams" });
    if (error) throw error;
    return Response.json({ saved: true });
  } catch (error) { return errorResponse(error); }
}
