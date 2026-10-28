import { adminDatabase, requireUser } from "@/lib/supabase-admin";
import { loadActivePoll, loadMyPollVotes, loadPollResults } from "@/lib/poll-store";
import { parseBallotOptionIds } from "@/lib/poll-domain";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const poll = await loadActivePoll();
    if (!poll) return Response.json({ submitted: false, selected: [], results: null }, { headers: { "Cache-Control": "no-store" } });
    const selected = await loadMyPollVotes(poll.id, user.uid);
    const results = selected ? await loadPollResults(poll.id) : null;
    return Response.json({ submitted: selected !== null, selected: selected || [], results },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 401); }
}

export async function POST(request: Request) {
  try {
    await guard(request, 30);
    const user = await requireUser(request);
    const body = await readJsonBody(request);
    const poll = await loadActivePoll();
    if (!poll || body.roundId !== poll.id) throw Error("This poll is not open for voting.");
    const selected = parseBallotOptionIds(body.selected);
    const { error } = await adminDatabase().rpc("poll_submit_ballot", {
      p_round: poll.id, p_user: user.uid, p_options: selected,
    });
    if (error) throw error;
    return Response.json({ submitted: true, selected, results: await loadPollResults(poll.id) },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
