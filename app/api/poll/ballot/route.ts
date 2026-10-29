import { adminDatabase, requireUser } from "@/lib/supabase-admin";
import { loadActivePoll, loadMyPollVotes, loadPollResults, requireFinalPollMigration } from "@/lib/poll-store";
import { parseBallotOptionIds, publicPollResults, withdrawnVoteCount } from "@/lib/poll-domain";
import { guard, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const poll = await loadActivePoll();
    if (!poll) return Response.json({ submitted: false, selected: [], results: null }, { headers: { "Cache-Control": "no-store" } });
    const selected = await loadMyPollVotes(poll.id, user.uid);
    const visibleIds = poll.options.map((option) => option.id);
    const results = selected ? publicPollResults(await loadPollResults(poll.id), visibleIds) : null;
    return Response.json({ submitted: selected !== null, selected: selected || [],
      withdrawnCount: withdrawnVoteCount(selected || [], visibleIds), results },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error, 401); }
}

export async function POST(request: Request) {
  try {
    await guard(request, 30);
    const user = await requireUser(request);
    const body = await readJsonBody(request);
    const selected = parseBallotOptionIds(body.selected);
    if (typeof body.roundId !== "string" || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(body.roundId))
      throw Error("Choose a valid poll.");
    await requireFinalPollMigration();
    const { error } = await adminDatabase().rpc("poll_submit_ballot", {
      p_round: body.roundId, p_user: user.uid, p_options: selected,
    });
    if (error) throw error;
    const poll = await loadActivePoll();
    const current = poll?.id === body.roundId ? poll : null;
    const visibleIds = current?.options.map((option) => option.id) || [];
    return Response.json({ submitted: true, selected,
      withdrawnCount: current ? withdrawnVoteCount(selected, visibleIds) : 0,
      results: current ? publicPollResults(await loadPollResults(current.id), visibleIds) : null },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
