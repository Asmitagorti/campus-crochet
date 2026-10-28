import { loadSiteMode } from "@/lib/site-mode";
import { loadActivePoll, loadPollResults } from "@/lib/poll-store";
import { guard } from "@/lib/forms";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await guard(request, 1500);
    const mode = await loadSiteMode();
    const poll = mode === "poll" ? await loadActivePoll() : null;
    const results = poll ? await loadPollResults(poll.id) : null;
    return Response.json({ mode, poll, results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The poll is unavailable right now." }, { status: 503 });
  }
}
