import { loadDisplayRuntime } from "@/lib/site-mode";

export const runtime = "nodejs";
export async function GET() {
  try { return Response.json(await loadDisplayRuntime(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ mode: "poll", saleEndsAt: null }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
