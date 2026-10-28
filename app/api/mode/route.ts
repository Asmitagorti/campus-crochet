import { loadDisplayMode } from "@/lib/site-mode";

export const runtime = "nodejs";
export async function GET() {
  try { return Response.json({ mode: await loadDisplayMode() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ mode: "poll" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
