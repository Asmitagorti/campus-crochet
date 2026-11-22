import { loadSettings } from "@/lib/store-data";
import { loadDisplayMode } from "@/lib/site-mode";
export const runtime = "nodejs";
export async function GET() {
  try {
    const mode = await loadDisplayMode();
    return Response.json(await loadSettings(mode === "poll" ? "poll_settings" : "settings"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Site content unavailable" },
      { status: 503 },
    );
  }
}
